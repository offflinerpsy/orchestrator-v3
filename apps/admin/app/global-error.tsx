'use client'

import { useEffect } from 'react'

/**
 * Global Error Boundary
 * Catches errors in root layout, including errors during render of layout itself
 * 
 * Note: Must be a Client Component and must include <html> and <body> tags
 * as it replaces the root layout in production builds.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log критичную ошибку
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html lang="ru">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-white">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">💥</h1>
              <h2 className="text-2xl font-semibold">Критическая ошибка</h2>
            </div>
            
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left">
              <p className="text-sm text-zinc-400 font-mono break-all">
                {error.message || 'Неизвестная критическая ошибка'}
              </p>
              {error.digest && (
                <p className="text-xs text-zinc-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-black hover:bg-zinc-200 h-10 px-4 py-2 transition-colors"
              >
                Перезагрузить приложение
              </button>
              
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 h-10 px-4 py-2 transition-colors"
              >
                Вернуться на главную
              </a>
            </div>

            <div className="text-xs text-zinc-500 space-y-1">
              <p>Если проблема сохраняется:</p>
              <ul className="text-left list-disc list-inside space-y-0.5">
                <li>Проверьте консоль браузера (F12)</li>
                <li>Очистите кэш и cookies</li>
                <li>Перезапустите браузер</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
