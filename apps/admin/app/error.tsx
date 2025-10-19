'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log ошибку только на клиенте
    if (typeof window !== 'undefined') {
      console.error('Boundary caught error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">⚠️</h1>
          <h2 className="text-2xl font-semibold">Что-то пошло не так</h2>
        </div>
        
        <div className="rounded-lg border bg-card p-4 text-left">
          <p className="text-sm text-muted-foreground font-mono break-all">
            {error.message || 'Неизвестная ошибка'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Попробовать снова
          </button>
          
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Вернуться на главную
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Если проблема повторяется, проверьте консоль браузера (F12)
        </p>
      </div>
    </div>
  )
}
