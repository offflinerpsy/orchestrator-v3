/**
 * Path Resolution Helper
 * Читает пути из paths.json для кросс-платформенности
 * 
 * USAGE:
 * import { resolvePath } from '@/lib/paths'
 * const jobsDir = resolvePath('jobs')
 * const outDir = resolvePath('dropOut')
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { env } from './env'

interface PathsConfig {
  projectRoot: string
  comfyRoot: string
  modelsRoot: string
  hfCache: string
  dropIn: string
  dropOut: string
  workflows: string
  logs: string
  data: string
  jobs?: string  // Optional: add to paths.json
}

let pathsCache: PathsConfig | null = null

/**
 * Load paths.json from project root
 */
function loadPaths(): PathsConfig {
  if (pathsCache) return pathsCache

  try {
    // Try to find paths.json
    const pathsJsonPath = join(process.cwd(), '../../paths.json')
    
    if (!existsSync(pathsJsonPath)) {
      console.warn('[PATHS] paths.json not found, using defaults')
      return getDefaultPaths()
    }

    const content = readFileSync(pathsJsonPath, 'utf-8')
    pathsCache = JSON.parse(content)
    
    return pathsCache!
  } catch (err) {
    console.error('[PATHS] Failed to load paths.json:', err)
    return getDefaultPaths()
  }
}

/**
 * Get default paths (fallback)
 */
function getDefaultPaths(): PathsConfig {
  const projectRoot = env.DATA_DIR ? join(env.DATA_DIR, '..') : 'C:\\Work\\Orchestrator'
  
  return {
    projectRoot,
    comfyRoot: 'F:\\ComfyUI',
    modelsRoot: 'F:\\Models',
    hfCache: 'F:\\Cache\\HF',
    dropIn: 'F:\\Drop\\in',
    dropOut: 'F:\\Drop\\out',
    workflows: 'F:\\Workflows',
    logs: join(projectRoot, 'logs'),
    data: env.DATA_DIR || join(projectRoot, 'data'),
    jobs: join(projectRoot, 'jobs'),
  }
}

/**
 * Resolve path by key
 */
export function resolvePath(key: keyof PathsConfig): string {
  const paths = loadPaths()
  const value = paths[key]
  
  if (!value) {
    throw new Error(`Path key "${key}" not found in paths.json`)
  }
  
  return value
}

/**
 * Get all paths
 */
export function getAllPaths(): PathsConfig {
  return loadPaths()
}
