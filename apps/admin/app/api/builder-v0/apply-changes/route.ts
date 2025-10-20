/**
 * Builder v0 — Apply Changes API
 * Применяет изменения к исходным файлам (контент/стили)
 */

import { NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const revalidate = 0

interface ApplyRequest {
  locator: string
  changes: {
    content?: string
    styles?: Record<string, string>
  }
  filePath?: string // Опционально: если известен конкретный файл
}

export async function POST(req: Request) {
  try {
    const body: ApplyRequest = await req.json()
    const { locator, changes, filePath } = body

    if (!locator || !changes) {
      return NextResponse.json(
        { error: 'locator and changes required' },
        { status: 400 }
      )
    }

    // TODO: В production — определить файл через AST/парсинг
    // Пока заглушка: возвращаем успех без реальной записи
    const targetFile = filePath || detectFileFromLocator(locator)

    if (!targetFile) {
      return NextResponse.json(
        { error: 'Unable to detect target file from locator' },
        { status: 404 }
      )
    }

    // В будущем: читаем файл, парсим JSX/HTML, применяем изменения
    // const fileContent = await readFile(targetFile, 'utf-8')
    // const updatedContent = applyChangesToAST(fileContent, locator, changes)
    // await writeFile(targetFile, updatedContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: `Changes applied to ${targetFile}`,
      locator,
      changes,
      note: 'Stub implementation — actual file write not implemented yet'
    })
  } catch (error: any) {
    console.error('[apply-changes] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply changes' },
      { status: 500 }
    )
  }
}

function detectFileFromLocator(locator: string): string | null {
  // Заглушка: в production нужен reverse-mapping locator → file
  // Возможные подходы:
  // 1. Source map из билда
  // 2. Runtime registry (регистрируем компоненты при рендере)
  // 3. AST-анализ всех файлов в app/

  // Пока возвращаем null (требуется ручное указание filePath)
  return null
}
