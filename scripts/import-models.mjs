#!/usr/bin/env node
/**
 * Orchestrator V3 — Hugging Face Models Importer
 * 
 * Скачивает модели в F:\Models:
 * - SDXL Base 1.0
 * - SD 3.5 Medium (требует Agree)
 * - ControlNet Depth SDXL
 * - IP-Adapter SDXL
 * - SVD 1.1 (требует Agree)
 * 
 * Использует HF_TOKEN из .env.local
 * Кэш: F:\Cache\HF (переменная HF_HOME)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load .env.local explicitly
config({ path: join(PROJECT_ROOT, '.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * Загрузка paths.json
 */
async function loadPaths() {
  const pathsFile = join(PROJECT_ROOT, 'paths.json');
  const content = await readFile(pathsFile, 'utf-8');
  return JSON.parse(content);
}

/**
 * Проверка HF_TOKEN
 */
function checkHFToken() {
  const token = process.env.HF_TOKEN;
  if (!token) {
    log('❌ HF_TOKEN не найден в .env.local', 'red');
    log('Получите токен: https://huggingface.co/settings/tokens', 'cyan');
    process.exit(1);
  }
  return token;
}

/**
 * Установка HF_HOME (cache directory)
 */
function setHFCache(hfCache) {
  process.env.HF_HOME = hfCache;
  log(`📦 HF_HOME установлен: ${hfCache}`, 'dim');
}

/**
 * Проверка принятия лицензии на HF
 */
async function checkLicenseAgreed(repoId, token) {
  try {
    const response = await fetch(`https://huggingface.co/api/models/${repoId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 403) {
      log(`⚠️  Модель ${repoId} требует принятия лицензии!`, 'yellow');
      log(`   Откройте: https://huggingface.co/${repoId}`, 'cyan');
      log(`   Нажмите: "Agree and access repository"`, 'cyan');
      return false;
    }
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Скачивание репозитория HF через git clone
 */
async function downloadHFRepo(repoId, targetDir, token) {
  const repoUrl = `https://huggingface.co/${repoId}`;
  const authedUrl = `https://user:${token}@huggingface.co/${repoId}`;
  
  log(`📥 Скачивание ${repoId}...`, 'cyan');
  
  try {
    await mkdir(targetDir, { recursive: true });
    
    // Git clone с LFS
    execSync(
      `git clone ${authedUrl} "${targetDir}"`,
      { 
        stdio: 'inherit',
        env: { 
          ...process.env,
          GIT_LFS_SKIP_SMUDGE: '0' // Скачивать LFS файлы
        }
      }
    );
    
    log(`✅ ${repoId} скачан в ${targetDir}`, 'green');
    return true;
  } catch (err) {
    log(`❌ Ошибка при скачивании ${repoId}: ${err.message}`, 'red');
    return false;
  }
}

/**
 * Скачивание одного файла через HF API
 */
async function downloadFile(repoId, filename, outputPath, token) {
  const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
  
  log(`📥 Скачивание ${filename}...`, 'dim');
  
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      log(`❌ Не удалось скачать ${filename}: ${response.status}`, 'red');
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, Buffer.from(buffer));
    
    log(`✅ ${filename} сохранён`, 'green');
    return true;
  } catch (err) {
    log(`❌ Ошибка: ${err.message}`, 'red');
    return false;
  }
}

/**
 * Основной процесс импорта
 */
async function main() {
  log('\n🚀 Orchestrator V3 — Импорт моделей из HuggingFace\n', 'cyan');
  
  const paths = await loadPaths();
  const token = checkHFToken();
  setHFCache(paths.hfCache);
  
  const modelsRoot = paths.modelsRoot;
  
  log('📋 План загрузки:', 'cyan');
  log('  1. SDXL Base 1.0 → checkpoints/', 'dim');
  log('  2. SD 3.5 Medium → checkpoints/', 'dim');
  log('  3. ControlNet Depth SDXL → controlnet/', 'dim');
  log('  4. IP-Adapter SDXL → ipadapter/', 'dim');
  log('  5. SVD 1.1 → video/', 'dim');
  log('');
  
  // 1. SDXL Base 1.0
  log('═'.repeat(60), 'dim');
  log('1/5 SDXL Base 1.0', 'cyan');
  await downloadFile(
    'stabilityai/stable-diffusion-xl-base-1.0',
    'sd_xl_base_1.0.safetensors',
    join(modelsRoot, 'checkpoints', 'sd_xl_base_1.0.safetensors'),
    token
  );
  
  // 2. SD 3.5 Medium
  log('\n' + '═'.repeat(60), 'dim');
  log('2/5 SD 3.5 Medium', 'cyan');
  
  const sd35Agreed = await checkLicenseAgreed('stabilityai/stable-diffusion-3.5-medium', token);
  if (!sd35Agreed) {
    log('⏭️  Пропускаю SD 3.5 Medium (требуется Agree)', 'yellow');
  } else {
    await downloadFile(
      'stabilityai/stable-diffusion-3.5-medium',
      'sd3.5_medium.safetensors',
      join(modelsRoot, 'checkpoints', 'sd3.5_medium.safetensors'),
      token
    );
  }
  
  // 3. ControlNet Depth SDXL
  log('\n' + '═'.repeat(60), 'dim');
  log('3/5 ControlNet Depth SDXL', 'cyan');
  await downloadFile(
    'diffusers/controlnet-depth-sdxl-1.0',
    'diffusion_pytorch_model.safetensors',
    join(modelsRoot, 'controlnet', 'controlnet-depth-sdxl-1.0.safetensors'),
    token
  );
  
  // 4. IP-Adapter SDXL
  log('\n' + '═'.repeat(60), 'dim');
  log('4/5 IP-Adapter SDXL', 'cyan');
  await downloadHFRepo(
    'h94/IP-Adapter',
    join(modelsRoot, 'ipadapter', 'IP-Adapter'),
    token
  );
  
  // 5. SVD 1.1
  log('\n' + '═'.repeat(60), 'dim');
  log('5/5 SVD 1.1 (Stable Video Diffusion)', 'cyan');
  
  const svdAgreed = await checkLicenseAgreed('stabilityai/stable-video-diffusion-img2vid-xt-1-1', token);
  if (!svdAgreed) {
    log('⏭️  Пропускаю SVD 1.1 (требуется Agree)', 'yellow');
  } else {
    await downloadHFRepo(
      'stabilityai/stable-video-diffusion-img2vid-xt-1-1',
      join(modelsRoot, 'video', 'svd-1.1'),
      token
    );
  }
  
  log('\n' + '═'.repeat(60), 'dim');
  log('✅ Импорт завершён!', 'green');
  log(`📁 Модели в: ${modelsRoot}`, 'cyan');
  log('\nСледующий шаг: настройте F:\\ComfyUI\\extra_model_paths.yaml', 'yellow');
  log('См. SETUP-GUIDE.md', 'dim');
  log('═'.repeat(60) + '\n', 'dim');
}

main().catch(err => {
  log(`\n❌ Критическая ошибка: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
