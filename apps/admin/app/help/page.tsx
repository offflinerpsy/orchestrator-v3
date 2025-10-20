/**
 * Help Page — Builder v0
 * 
 * Горячие клавиши, FAQ, справка по слэш-командам.
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Справка — Builder v0',
  description: 'Горячие клавиши и справка по командам',
}

export default function HelpPage() {
  return (
    <div className="container max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Справка Builder v0</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Горячие клавиши</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
            <kbd className="px-2 py-1 rounded bg-muted text-sm font-mono">D</kbd>
            <span className="text-sm">Переключить режим Дизайн/Просмотр</span>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
            <kbd className="px-2 py-1 rounded bg-muted text-sm font-mono">Esc</kbd>
            <span className="text-sm">Снять выделение элемента</span>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
            <kbd className="px-2 py-1 rounded bg-muted text-sm font-mono">Ctrl+S</kbd>
            <span className="text-sm">Применить изменения</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Слэш-команды</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border bg-muted/20">
            <code className="text-sm font-mono text-primary">/design on|off</code>
            <p className="text-sm text-muted-foreground mt-2">
              Включить/выключить режим дизайна
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <code className="text-sm font-mono text-primary">/select &lt;locator&gt;</code>
            <p className="text-sm text-muted-foreground mt-2">
              Выбрать элемент программно (например: <code>/select id-hero-title</code>)
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <code className="text-sm font-mono text-primary">/gen image &lt;prompt&gt;</code>
            <p className="text-sm text-muted-foreground mt-2">
              Сгенерировать изображение локально через SDXL
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <code className="text-sm font-mono text-primary">/apply</code>
            <p className="text-sm text-muted-foreground mt-2">
              Применить накопленные изменения к исходным файлам
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <code className="text-sm font-mono text-primary">/undo</code>
            <p className="text-sm text-muted-foreground mt-2">
              Отменить последнее изменение
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Как редактировать текст?</h3>
            <p className="text-sm text-muted-foreground">
              1. Включите режим «Дизайн»<br />
              2. Кликните на текстовый элемент<br />
              3. В правой панели (Inspector) → вкладка «Содержимое»<br />
              4. Измените текст → нажмите «Применить изменения»
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Как заменить изображение?</h3>
            <p className="text-sm text-muted-foreground">
              1. Выберите элемент &lt;img&gt;<br />
              2. Перейдите на вкладку «Действия»<br />
              3. Введите промпт для генерации<br />
              4. Нажмите «Сгенерировать (локально, SDXL)»<br />
              5. Подождите ~30 секунд — изображение подменится автоматически
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Какая модель используется?</h3>
            <p className="text-sm text-muted-foreground">
              Локально через ComfyUI: <strong>SDXL 1.0</strong><br />
              Файлы сохраняются в: <code className="text-xs">F:\Drop\out</code>
            </p>
          </div>

          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Как отменить изменения?</h3>
            <p className="text-sm text-muted-foreground">
              Используйте команду <code className="text-xs">/undo</code> в чате или Ctrl+Z (в будущих версиях)
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">О проекте</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Builder v0 — визуальный редактор сайтов с локальной генерацией изображений.
          Вдохновлён проектом <a href="https://github.com/dyad-sh/dyad" className="text-primary underline" target="_blank" rel="noopener noreferrer">Dyad</a> (Apache-2.0).
        </p>
        <p className="text-sm text-muted-foreground">
          Версия: 0.1.0 (минимальный прототип)<br />
          Дата: 20 октября 2025
        </p>
      </section>
    </div>
  )
}
