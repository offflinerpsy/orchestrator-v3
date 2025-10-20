/**
 * Builder v0-style Layout — Three-column Grid
 * 
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * Licensed under Apache-2.0
 * 
 * Layout zones:
 * - Left: ChatSidebar (~380-420px) — chat history, slash commands
 * - Center: CanvasPreview — iframe with Next.js site preview
 * - Right: Inspector — content/style/actions tabs
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Builder v0 — Orchestrator',
  description: 'v0-style visual builder with local SDXL generation',
}

export default function BuilderV0Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-hidden">
      {/* Three-column grid: left (chat) | center (canvas) | right (inspector) */}
      <div className="grid h-full" style={{ gridTemplateColumns: '380px 1fr 360px' }}>
        {children}
      </div>
    </div>
  )
}
