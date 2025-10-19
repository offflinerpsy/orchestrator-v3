/**
 * use-toast hook (shadcn/ui)
 * Упрощённая версия для уведомлений
 */

import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

const toasts: Toast[] = []
const listeners: Array<(toasts: Toast[]) => void> = []

function notify(listeners: Array<(toasts: Toast[]) => void>) {
  listeners.forEach((listener) => listener([...toasts]))
}

export function useToast() {
  const [, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, ...props }
    
    toasts.push(newToast)
    notify(listeners)

    // Автоматически убираем через 5 секунд
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id)
      if (index > -1) {
        toasts.splice(index, 1)
        notify(listeners)
      }
    }, 5000)

    // Для простоты используем alert (можно заменить на реальный Toast компонент)
    if (props.variant === 'destructive') {
      console.error(`[TOAST] ${props.title}`, props.description)
    } else {
      console.log(`[TOAST] ${props.title}`, props.description)
    }
  }, [])

  return { toast }
}
