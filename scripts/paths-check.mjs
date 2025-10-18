#!/usr/bin/env node
/**
 * Orchestrator V3 — Paths Validation Script
 * 
 * Проверяет:
 * - Доступность всех путей из paths.json
 * - Права на чтение/запись
 * - Свободное место на дисках C: и F:
 * - Соблюдение правила: модели/кэш только на F:, проект на C:
 */

import { readFile, access, mkdir, writeFile, unlink, constants } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Цвета для терминала
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
  try {
    const pathsFile = join(PROJECT_ROOT, 'paths.json');
    const content = await readFile(pathsFile, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    log(`❌ Ошибка чтения paths.json: ${err.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Проверка доступности директории
 */
async function checkPathAccess(path, name) {
  try {
    await access(path, constants.F_OK);
    log(`  ✅ ${name}: существует`, 'green');
    return true;
  } catch {
    log(`  ⚠️  ${name}: не найден (будет создан автоматически)`, 'yellow');
    return false;
  }
}

/**
 * Проверка прав на чтение/запись
 */
async function checkReadWrite(path, name) {
  const testFile = join(path, `.test-${Date.now()}.tmp`);
  
  try {
    // Создаём директорию если нет
    await mkdir(path, { recursive: true });
    
    // Тест записи
    await writeFile(testFile, 'test');
    
    // Тест чтения
    await readFile(testFile);
    
    // Удаление тестового файла
    await unlink(testFile);
    
    log(`  ✅ ${name}: доступ R/W`, 'green');
    return true;
  } catch (err) {
    log(`  ❌ ${name}: нет доступа R/W — ${err.message}`, 'red');
    return false;
  }
}

/**
 * Получение свободного места на диске (Windows)
 */
function getDiskSpace(driveLetter) {
  try {
    const output = execSync(
      `powershell "Get-PSDrive -Name ${driveLetter} | Select-Object -ExpandProperty Free"`,
      { encoding: 'utf-8' }
    );
    const bytes = parseInt(output.trim());
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(2);
    return { bytes, gb };
  } catch (err) {
    log(`  ❌ Не удалось получить информацию о диске ${driveLetter}:`, 'red');
    return { bytes: 0, gb: '0.00' };
  }
}

/**
 * Проверка правила: модели/кэш на F:, проект на C:
 */
function validatePathRules(paths) {
  log('\n📋 Проверка правил размещения:', 'cyan');
  
  let valid = true;
  
  // Модели должны быть на F:
  if (!paths.modelsRoot.startsWith('F:\\')) {
    log(`  ❌ modelsRoot должен быть на F:\\ (сейчас: ${paths.modelsRoot})`, 'red');
    valid = false;
  } else {
    log(`  ✅ modelsRoot на F:\\`, 'green');
  }
  
  // HF кэш должен быть на F:
  if (!paths.hfCache.startsWith('F:\\')) {
    log(`  ❌ hfCache должен быть на F:\\ (сейчас: ${paths.hfCache})`, 'red');
    valid = false;
  } else {
    log(`  ✅ hfCache на F:\\`, 'green');
  }
  
  // ComfyUI может быть на F:
  if (!paths.comfyRoot.startsWith('F:\\')) {
    log(`  ⚠️  comfyRoot рекомендуется на F:\\ (сейчас: ${paths.comfyRoot})`, 'yellow');
  } else {
    log(`  ✅ comfyRoot на F:\\`, 'green');
  }
  
  // Проект должен быть на C:
  if (!paths.projectRoot.startsWith('C:\\')) {
    log(`  ❌ projectRoot должен быть на C:\\ (сейчас: ${paths.projectRoot})`, 'red');
    valid = false;
  } else {
    log(`  ✅ projectRoot на C:\\`, 'green');
  }
  
  return valid;
}

/**
 * Основная функция проверки
 */
async function main() {
  log('\n🔍 Orchestrator V3 — Проверка путей\n', 'cyan');
  
  const paths = await loadPaths();
  
  // 1. Проверка существования путей
  log('📂 Проверка существования директорий:', 'cyan');
  for (const [key, path] of Object.entries(paths)) {
    await checkPathAccess(path, key);
  }
  
  // 2. Проверка прав доступа R/W
  log('\n🔐 Проверка прав доступа (R/W):', 'cyan');
  const accessResults = [];
  for (const [key, path] of Object.entries(paths)) {
    const hasAccess = await checkReadWrite(path, key);
    accessResults.push(hasAccess);
  }
  
  // 3. Свободное место на дисках
  log('\n💾 Свободное место на дисках:', 'cyan');
  const cDisk = getDiskSpace('C');
  const fDisk = getDiskSpace('F');
  
  log(`  C:\\ — ${cDisk.gb} GB свободно`, cDisk.bytes > 10 * 1024 * 1024 * 1024 ? 'green' : 'yellow');
  log(`  F:\\ — ${fDisk.gb} GB свободно`, fDisk.bytes > 100 * 1024 * 1024 * 1024 ? 'green' : 'yellow');
  
  if (fDisk.bytes < 50 * 1024 * 1024 * 1024) {
    log('  ⚠️  Рекомендуется минимум 50 GB на F:\\ для моделей', 'yellow');
  }
  
  // 4. Правила размещения
  const rulesValid = validatePathRules(paths);
  
  // Итоговый статус
  log('\n' + '='.repeat(60), 'dim');
  const allAccessible = accessResults.every(r => r);
  
  if (allAccessible && rulesValid) {
    log('✅ Все проверки пройдены успешно!', 'green');
    log('🎨 Orchestrator V3 готов к работе', 'cyan');
  } else {
    log('❌ Обнаружены проблемы. Проверьте пути в paths.json', 'red');
    process.exit(1);
  }
  
  log('='.repeat(60) + '\n', 'dim');
}

main().catch(err => {
  log(`\n❌ Критическая ошибка: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
