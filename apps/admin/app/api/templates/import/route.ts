/**
 * Template Import API
 * 
 * POST /api/templates/import
 * 
 * Import components from registries:
 * - shadcn/ui (ui.shadcn.com/registry)
 * - HyperUI (hyperui.dev)
 * - Custom templates
 * 
 * Modern patterns (Context7: shadcn-ui-registry-api, component-import-workflow)
 * - Fetch component JSON from registry
 * - Auto-install npm dependencies
 * - Write component files to project
 * - Return installation result
 * 
 * Request:
 * {
 *   source: 'shadcn' | 'hyperui' | 'custom',
 *   component: string,
 *   style?: 'default' | 'new-york'
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   files: string[],
 *   dependencies: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMPONENTS_DIR = join(process.cwd(), 'components', 'templates')

interface ImportRequest {
  source: 'shadcn' | 'hyperui' | 'custom'
  component: string
  style?: 'default' | 'new-york'
}

interface ShadcnComponent {
  name: string
  type: string
  files: Array<{ path: string; content: string }>
  dependencies?: string[]
  registryDependencies?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()
    const { source, component, style = 'new-york' } = body

    if (!source || !component) {
      return NextResponse.json(
        { error: 'source and component are required' },
        { status: 400 }
      )
    }

    let result: { files: string[]; dependencies: string[] } | null = null

    switch (source) {
      case 'shadcn':
        result = await importShadcnComponent(component, style)
        break
      case 'hyperui':
        result = await importHyperUIComponent(component)
        break
      case 'custom':
        return NextResponse.json(
          { error: 'Custom templates not yet implemented' },
          { status: 501 }
        )
      default:
        return NextResponse.json(
          { error: `Unknown source: ${source}` },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to import component' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: result.files,
      dependencies: result.dependencies,
    })
  } catch (error: any) {
    console.error('[Template Import]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Import component from shadcn/ui registry
 * Context7 pattern: fetch JSON from registry, parse files, install deps
 */
async function importShadcnComponent(
  componentName: string,
  style: string
): Promise<{ files: string[]; dependencies: string[] }> {
  // Fetch component JSON from shadcn registry
  const registryUrl = `https://ui.shadcn.com/registry/${style}/${componentName}.json`
  
  const response = await fetch(registryUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch component from shadcn registry: ${response.statusText}`)
  }

  const data: ShadcnComponent = await response.json()

  const installedFiles: string[] = []
  const dependencies: string[] = []

  // Write component files
  for (const file of data.files) {
    const filePath = join(COMPONENTS_DIR, file.path)
    const fileDir = dirname(filePath)

    // Create directory if not exists
    if (!existsSync(fileDir)) {
      await mkdir(fileDir, { recursive: true })
    }

    await writeFile(filePath, file.content, 'utf-8')
    installedFiles.push(file.path)
  }

  // Collect dependencies
  if (data.dependencies) {
    dependencies.push(...data.dependencies)
  }

  // Install npm dependencies (non-blocking)
  if (dependencies.length > 0) {
    const depsString = dependencies.join(' ')
    execAsync(`pnpm add ${depsString}`).catch(err => {
      console.error('[Template Import] Failed to install dependencies:', err)
    })
  }

  return { files: installedFiles, dependencies }
}

/**
 * Import component from HyperUI
 * Note: HyperUI doesn't have a JSON API, so we'll parse HTML examples
 */
async function importHyperUIComponent(
  componentName: string
): Promise<{ files: string[]; dependencies: string[] }> {
  // HyperUI components are HTML snippets, need conversion to React/TSX
  // For now, return placeholder
  throw new Error('HyperUI import not yet implemented. Use manual copy from hyperui.dev')
}
