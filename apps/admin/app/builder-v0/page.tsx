/**
 * Builder v0-style Main Page
 * 
 * Three-panel layout with react-resizable-panels
 */
'use client'

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { ChatSidebar } from '@/components/builder-v0/ChatSidebar'
import { CanvasPreview } from '@/components/builder-v0/CanvasPreview'
import { Inspector } from '@/components/builder-v0/Inspector'

export default function BuilderV0Page() {
  return (
    <div className="h-screen overflow-hidden">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left: Chat Sidebar */}
        <Panel id="chat" order={1} defaultSize={25} minSize={20} maxSize={35}>
          <ChatSidebar />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Center: Canvas */}
        <Panel id="canvas" order={2} defaultSize={50} minSize={30}>
          <CanvasPreview />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Right: Inspector */}
        <Panel id="inspector" order={3} defaultSize={25} minSize={20} maxSize={35} collapsible>
          <Inspector />
        </Panel>
      </PanelGroup>
    </div>
  )
}
