'use client'

/**
 * Кнопка IGNITE — запуск всего стека Orchestrator одной кнопкой
 * Вызывает POST /api/system/ignite
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function IgniteButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleIgnite() {
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/system/ignite', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        toast.success('✅ Система запущена', {
          description: 'ComfyUI, Panel и Worker успешно стартовали',
        })

        // Убираем галочку через 5 секунд
        setTimeout(() => setSuccess(false), 5000)
      } else {
        toast.error('⚠️ Запуск завершён с ошибками', {
          description: data.message || 'Проверьте статус служб',
        })
      }
    } catch (error: any) {
      console.error('[IGNITE] Error:', error)
      toast.error('❌ Ошибка запуска', {
        description: error.message || 'Не удалось запустить систему',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      variant={success ? 'default' : 'outline'}
      className="gap-2"
      onClick={handleIgnite}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Запуск системы...
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Система запущена
        </>
      ) : (
        <>
          <Zap className="h-5 w-5" />
          Запуск системы
        </>
      )}
    </Button>
  )
}
