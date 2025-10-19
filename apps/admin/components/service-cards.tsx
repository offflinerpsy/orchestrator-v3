/**
 * Service Status Component (Client-side)
 * Real-time status checks for ComfyUI, FLUX, v0
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Server, 
  Zap, 
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface ServiceStatus {
  comfyui: { online: boolean; url: string }
  flux: { valid: boolean; error: string | null }
  v0: { valid: boolean; error: string | null }
}

export function ServiceCards() {
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const [comfyRes, keysRes] = await Promise.all([
        fetch('/api/system/comfy/status'),
        fetch('/api/keys/validate')
      ])

      const comfyData = await comfyRes.json()
      const keysData = await keysRes.json()

      setStatus({
        comfyui: { 
          online: comfyData.running === true, 
          url: 'http://127.0.0.1:8188' 
        },
        flux: keysData.flux,
        v0: keysData.v0
      })
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const handleComfyUIAction = async (action: 'start' | 'stop') => {
    setActionLoading(action)
    try {
      const endpoint = action === 'start' ? '/api/system/comfy/start' : '/api/system/comfy/stop'
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await fetchStatus()
      } else {
        alert(data.message || data.error)
      }
    } catch (error) {
      alert(`Failed to ${action} ComfyUI`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!status) return null

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* ComfyUI Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              ComfyUI
            </CardTitle>
            {status.comfyui.online ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>Local image & video generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => handleComfyUIAction('start')}
              disabled={status.comfyui.online || actionLoading === 'start'}
            >
              {actionLoading === 'start' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Start'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleComfyUIAction('stop')}
              disabled={!status.comfyui.online || actionLoading === 'stop'}
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Stop'
              )}
            </Button>
          </div>
          {status.comfyui.online && (
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
              <a href={status.comfyui.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3 w-3" />
                Open ComfyUI GUI
              </a>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Models: SDXL, SD 3.5, SVD
          </p>
        </CardContent>
      </Card>

      {/* FLUX API Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              FLUX Ultra
            </CardTitle>
            {status.flux.valid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <CardDescription>Cloud ultra-quality image generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-mono text-xs">BFL_API_KEY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              {status.flux.valid ? (
                <span className="text-green-500 text-xs">✓ Valid</span>
              ) : (
                <span className="text-red-500 text-xs">✗ {status.flux.error}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
            <a href="https://docs.bfl.ai" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
              API Documentation
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            ⚠️ Requires confirmation for paid calls
          </p>
        </CardContent>
      </Card>

      {/* v0 Platform API Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              v0 Platform API
            </CardTitle>
            {status.v0.valid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <CardDescription>AI code generation for React/Next.js</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-mono text-xs">V0_API_KEY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              {status.v0.valid ? (
                <span className="text-green-500 text-xs">✓ Valid</span>
              ) : (
                <span className="text-red-500 text-xs">✗ {status.v0.error}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" asChild>
            <a href="https://v0.dev/docs/v0-platform-api" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3 w-3" />
              API Documentation
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Generate UI from natural language prompts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
