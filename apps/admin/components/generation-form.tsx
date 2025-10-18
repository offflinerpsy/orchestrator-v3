/**
 * Generation Form Component
 * Unified interface for FLUX/SDXL/SD3.5/SVD generation
 * Includes FLUX confirmation modal (paid API warning)
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, Zap, Loader2 } from 'lucide-react'

type Backend = 'flux' | 'sdxl' | 'sd35' | 'svd'

export function GenerationForm() {
  const [backend, setBackend] = useState<Backend>('sdxl')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFluxModal, setShowFluxModal] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    // Show confirmation modal for FLUX
    if (backend === 'flux') {
      setShowFluxModal(true)
      return
    }

    // For non-FLUX backends, generate immediately
    await executeGeneration()
  }

  const executeGeneration = async () => {
    setLoading(true)
    setShowFluxModal(false)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backend,
          prompt,
          params: {},
          runNow: true
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Job created: ${data.jobId}`)
        setPrompt('') // Clear form
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Failed to create job: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Backend Selection */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            Backend
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  <strong>FLUX:</strong> Cloud (paid), ultra-quality, photorealism<br/>
                  <strong>SDXL/SD3.5:</strong> Local (free), fast, ComfyUI<br/>
                  <strong>SVD:</strong> Local video generation
                </p>
              </TooltipContent>
            </Tooltip>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={backend === 'flux' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackend('flux')}
              className="justify-start"
            >
              <Zap className="mr-2 h-4 w-4" />
              FLUX Ultra
            </Button>
            <Button
              variant={backend === 'sdxl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackend('sdxl')}
              className="justify-start"
            >
              SDXL
            </Button>
            <Button
              variant={backend === 'sd35' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackend('sd35')}
              className="justify-start"
            >
              SD 3.5
            </Button>
            <Button
              variant={backend === 'svd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackend('svd')}
              className="justify-start"
            >
              SVD Video
            </Button>
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            Prompt
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Describe the scene, lighting, lens, mood. Be specific but concise.
                </p>
              </TooltipContent>
            </Tooltip>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A modern house at sunset, wide angle lens, photorealistic..."
            className="w-full h-24 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate {backend.toUpperCase()}
            </>
          )}
        </Button>

        {/* FLUX Confirmation Modal */}
        <AlertDialog open={showFluxModal} onOpenChange={setShowFluxModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Paid API Call — FLUX Ultra</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You are about to make a <strong>paid call</strong> to the FLUX 1.1 Pro Ultra API.
                </p>
                <p className="text-xs text-muted-foreground">
                  Cost: ~$0.05 USD per image<br/>
                  Prompt: "{prompt.substring(0, 100)}..."
                </p>
                <p className="text-sm">
                  Do you want to proceed?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeGeneration}>
                Yes, Generate (Charge Me)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
