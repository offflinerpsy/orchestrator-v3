/**
 * Builder v0-style Main Page
 * 
 * Assembles three zones:
 * - ChatSidebar (left)
 * - CanvasPreview (center)
 * - Inspector (right)
 */

import { ChatSidebar } from '@/components/builder-v0/ChatSidebar'
import { CanvasPreview } from '@/components/builder-v0/CanvasPreview'
import { Inspector } from '@/components/builder-v0/Inspector'

export default function BuilderV0Page() {
  return (
    <>
      {/* Left: Chat with slash commands */}
      <ChatSidebar />
      
      {/* Center: Preview iframe */}
      <CanvasPreview />
      
      {/* Right: Inspector (content/style/actions) */}
      <Inspector />
    </>
  )
}
