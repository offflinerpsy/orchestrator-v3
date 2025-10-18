#!/usr/bin/env node
/**
 * Guard Script for ComfyUI Model Paths
 * 
 * Protects extra_model_paths.yaml from being overwritten by ComfyUI updates
 * @see https://www.viewcomfy.com/blog/building-a-production-ready-comfyui-api
 * 
 * Usage:
 * - node scripts/guard-model-paths.mjs          (check & report)
 * - node scripts/guard-model-paths.mjs backup   (backup current)
 * - node scripts/guard-model-paths.mjs restore  (restore from backup)
 */

import { readFile, writeFile, copyFile, access } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const COMFYUI_PATH = 'F:\\ComfyUI'
const YAML_PATH = join(COMFYUI_PATH, 'extra_model_paths.yaml')
const BACKUP_PATH = join(COMFYUI_PATH, 'extra_model_paths.yaml.backup')

const EXPECTED_CONFIG = `# ComfyUI Extra Model Paths (F: drive)
# This file is managed by Orchestrator — DO NOT EDIT MANUALLY

base_path: F:/Models/

checkpoints: 
  - F:/Models/checkpoints/

vae:
  - F:/Models/vae/

loras:
  - F:/Models/loras/

controlnet:
  - F:/Models/controlnet/

ipadapter:
  - F:/Models/ipadapter/

diffusion_models:
  - F:/Models/video/
`

async function checkPermissions() {
  try {
    await access('F:\\', 2) // Check write permissions
    console.log('✓ F:\\ drive is accessible')
    return true
  } catch {
    console.error('✗ F:\\ drive is not accessible or no write permissions')
    return false
  }
}

async function backupConfig() {
  if (!existsSync(YAML_PATH)) {
    console.error(`✗ Config file not found: ${YAML_PATH}`)
    process.exit(1)
  }

  await copyFile(YAML_PATH, BACKUP_PATH)
  console.log(`✓ Backup created: ${BACKUP_PATH}`)
}

async function restoreConfig() {
  if (!existsSync(BACKUP_PATH)) {
    console.error(`✗ Backup not found: ${BACKUP_PATH}`)
    console.log(`Creating from template instead...`)
    await writeFile(YAML_PATH, EXPECTED_CONFIG)
    console.log(`✓ Template config written to: ${YAML_PATH}`)
    return
  }

  await copyFile(BACKUP_PATH, YAML_PATH)
  console.log(`✓ Config restored from backup: ${YAML_PATH}`)
}

async function checkConfig() {
  if (!existsSync(YAML_PATH)) {
    console.warn(`⚠️  Config file missing: ${YAML_PATH}`)
    console.log(`Run with 'restore' to create from backup or template`)
    return false
  }

  const content = await readFile(YAML_PATH, 'utf-8')
  
  // Check if F: paths are present
  const hasCorrectPaths = content.includes('F:/Models')
  
  if (hasCorrectPaths) {
    console.log(`✓ Config is valid: ${YAML_PATH}`)
    return true
  } else {
    console.warn(`⚠️  Config exists but doesn't contain expected F: paths`)
    console.log(`Run with 'restore' to fix`)
    return false
  }
}

async function main() {
  const command = process.argv[2]

  console.log('ComfyUI Model Paths Guard\n')

  // Check permissions first
  const hasPermissions = await checkPermissions()
  if (!hasPermissions) {
    process.exit(1)
  }

  switch (command) {
    case 'backup':
      await backupConfig()
      break
    
    case 'restore':
      await restoreConfig()
      break
    
    default:
      // Default: check status
      await checkConfig()
      console.log(`\nUsage:
  node scripts/guard-model-paths.mjs          (check status)
  node scripts/guard-model-paths.mjs backup   (backup current config)
  node scripts/guard-model-paths.mjs restore  (restore from backup)
`)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
