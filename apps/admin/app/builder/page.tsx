/**
 * Orchestrator V6 — Ultra Builder
 * 
 * Main builder interface inspired by v0 Platform API UX patterns:
 * @see https://vercel.com/blog/build-your-own-ai-app-builder-with-the-v0-platform-api
 * @see https://vercel.com/templates/next.js/v0-platform-api-demo
 * @see C:\Work\Orchestrator\docs\v0-ux-notes.md
 * 
 * Layout Structure:
 * - Top Bar: Composer (prompt input + slash commands + action buttons)
 * - Center: Tabs (Preview iframe | Canvas grid | Diff/PR view)
 * - Left Drawer: Assets browser, Site tree, Queue list
 * - Right Drawer: Generation controls (FLUX/SDXL/v0/Codemods)
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { QueuePanel } from '@/components/queue-panel'
import { GenerationForm } from '@/components/generation-form'
import { 
  Sparkles, 
  Image as ImageIcon, 
  Play, 
  Calculator,
  FolderTree,
  FileImage,
  ListTodo,
  Settings,
  Code,
  Palette,
  Wrench
} from 'lucide-react'

export default function BuilderPage() {
  const [prompt, setPrompt] = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar - Composer */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Describe what you want to build (try /ui, /img, /video, /codemod, /preview)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 h-10 px-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button variant="default" size="default">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate UI (v0)
          </Button>
          <Button variant="secondary" size="default">
            <ImageIcon className="mr-2 h-4 w-4" />
            Generate Media
          </Button>
          <Button variant="outline" size="default">
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
          <Button variant="ghost" size="default">
            <Calculator className="mr-2 h-4 w-4" />
            Estimate
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Drawer */}
        <aside className="w-64 border-r bg-card overflow-y-auto hidden md:block">
          <div className="p-4 space-y-4">
            {/* Assets */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <FileImage className="h-4 w-4" />
                Assets
              </div>
              <div className="text-xs text-muted-foreground">
                F:\Drop\in, F:\Drop\out
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {/* Placeholder thumbnails */}
                <div className="aspect-square bg-muted rounded border" />
                <div className="aspect-square bg-muted rounded border" />
                <div className="aspect-square bg-muted rounded border" />
              </div>
            </div>

            {/* Site Tree */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <FolderTree className="h-4 w-4" />
                Site Tree
              </div>
              <div className="space-y-1 text-sm">
                <div className="pl-2 hover:bg-accent cursor-pointer rounded px-2 py-1">
                  / (Home)
                </div>
                <div className="pl-2 hover:bg-accent cursor-pointer rounded px-2 py-1">
                  /app
                </div>
                <div className="pl-4 hover:bg-accent cursor-pointer rounded px-2 py-1 text-muted-foreground">
                  page.tsx
                </div>
              </div>
            </div>

            {/* Queue */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <ListTodo className="h-4 w-4" />
                Queue
              </div>
              <QueuePanel />
            </div>
          </div>
        </aside>

        {/* Center - Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-card px-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="diff">Diff/PR</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 m-0 p-4">
              <div className="h-full border rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Live preview will appear here</p>
                  <p className="text-xs mt-2">iframe with v0 demo URL or local routes</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="canvas" className="flex-1 m-0 p-4">
              <div className="h-full border rounded-lg bg-card p-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Placeholder for generated images/videos */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-video bg-muted rounded-lg border flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diff" className="flex-1 m-0 p-4">
              <div className="h-full border rounded-lg bg-card p-4">
                <div className="text-center text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Git diff and PR preview</p>
                  <p className="text-xs mt-2">File changes will be shown here</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Drawer - Controls */}
        <aside className="w-80 border-l bg-card overflow-y-auto hidden lg:block">
          <div className="p-4 space-y-6">
            {/* Generate Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <ImageIcon className="h-4 w-4" />
                Generate
              </div>
              <GenerationForm />
            </div>

            {/* UI Code Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Code className="h-4 w-4" />
                UI Code (v0)
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Generate React components from natural language
              </div>
              <Button variant="default" size="sm" className="w-full">
                Generate UI
              </Button>
            </div>

            {/* Design Tokens */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Palette className="h-4 w-4" />
                Design Tokens
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Colors, typography, spacing
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Edit Tokens
              </Button>
            </div>

            {/* Codemods */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Wrench className="h-4 w-4" />
                Codemods
              </div>
              <div className="space-y-2 text-sm">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Replace buttons → shadcn
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  More rules...
                </Button>
              </div>
            </div>

            {/* Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Settings
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                Configure paths
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
