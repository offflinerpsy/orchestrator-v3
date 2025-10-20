/**
 * Keyboard Shortcuts (Hotkeys)
 * 
 * Context7: react-hotkeys-hook (johannesklauss/react-hotkeys-hook, 2988★)
 * Modern pattern: useHotkeys hook with scoped handlers
 * 
 * Горячие клавиши:
 * - Ctrl/Cmd+K: Фокус на чат-инпут
 * - Ctrl/Cmd+Enter: Отправить сообщение
 * - Ctrl/Cmd+J: Toggle логи (будущая фича)
 * - Escape: Снять фокус / закрыть модалы
 */

'use client'

import { useHotkeys } from 'react-hotkeys-hook'
import { useCallback } from 'react'

export interface HotkeysConfig {
  onFocusChat?: () => void
  onSubmitMessage?: () => void
  onToggleLogs?: () => void
  onEscape?: () => void
}

/**
 * Hook для регистрации глобальных хоткеев
 * Context7: Modern React hooks pattern with useCallback
 */
export function useBuilderHotkeys(config: HotkeysConfig) {
  const {
    onFocusChat,
    onSubmitMessage,
    onToggleLogs,
    onEscape,
  } = config

  // Ctrl/Cmd+K: Focus chat input
  useHotkeys(
    'mod+k',
    useCallback((e) => {
      e.preventDefault()
      onFocusChat?.()
    }, [onFocusChat]),
    { enableOnFormTags: false }
  )

  // Ctrl/Cmd+Enter: Submit message
  useHotkeys(
    'mod+enter',
    useCallback((e) => {
      e.preventDefault()
      onSubmitMessage?.()
    }, [onSubmitMessage]),
    { enableOnFormTags: ['INPUT', 'TEXTAREA'] }
  )

  // Ctrl/Cmd+J: Toggle logs
  useHotkeys(
    'mod+j',
    useCallback((e) => {
      e.preventDefault()
      onToggleLogs?.()
    }, [onToggleLogs]),
    { enableOnFormTags: false }
  )

  // Escape: Clear focus / close modals
  useHotkeys(
    'escape',
    useCallback((e) => {
      onEscape?.()
    }, [onEscape]),
    { enableOnFormTags: true }
  )
}

/**
 * Список всех хоткеев для документации
 */
export const HOTKEYS_LIST = [
  { key: 'Ctrl/Cmd+K', description: 'Фокус на чат-инпут' },
  { key: 'Ctrl/Cmd+Enter', description: 'Отправить сообщение' },
  { key: 'Ctrl/Cmd+J', description: 'Открыть/закрыть логи' },
  { key: 'Escape', description: 'Снять фокус / закрыть модалы' },
] as const
