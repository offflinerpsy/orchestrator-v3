/**
 * Builder v0-style Layout — Resizable Three-Panel Layout
 * 
 * Inspired by Dyad (https://github.com/dyad-sh/dyad)
 * Licensed under Apache-2.0
 * 
 * Context7: react-resizable-panels (bvaughn/react-resizable-panels, 4410★)
 * Modern pattern: ResizablePanelGroup with controlled panels
 * 
 * Layout zones:
 * - Left: ChatSidebar (320-520px resizable) — chat history, slash commands
 * - Center: CanvasPreview (flexible) — iframe with Next.js site preview
 * - Right: Inspector (360px collapsible) — content/style/actions tabs
 */

'use client'

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'

// Note: metadata export moved to page.tsx (client components can't export metadata)

export default function BuilderV0Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left: Chat Sidebar (resizable 320-520px) */}
        <Panel
          id="chat-sidebar"
          order={1}
          defaultSize={25}
          minSize={20}
          maxSize={35}
        >
          {/* Chat content rendered by page.tsx */}
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Center: Canvas/Preview (flexible) */}
        <Panel
          id="canvas"
          order={2}
          defaultSize={50}
          minSize={30}
        >
          {children}
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Right: Inspector (collapsible) */}
        <Panel
          id="inspector"
          order={3}
          defaultSize={25}
          minSize={20}
          maxSize={35}
          collapsible
        >
          {/* Inspector rendered by page.tsx */}
        </Panel>
      </PanelGroup>
    </div>
  )
}
