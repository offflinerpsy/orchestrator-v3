'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Server,
  Zap,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface SystemStatusData {
  overall: 'healthy' | 'degraded' | 'error'
  timestamp: string
  services: {
    comfy: {
      installed: boolean
      status: string
      running: boolean
      apiOnline: boolean
      models: number
    }
  }
  environment: {
    allowGeneration: boolean
    fluxKeyConfigured: boolean
    v0KeyConfigured: boolean
    nodeEnv: string
    logLevel: string
  }
  endpoints: {
    comfyUrl: string
    dataDir: string
  }
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/status', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setStatus(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading system status...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            System Status Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchStatus} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  const overallIcon =
    status.overall === 'healthy' ? (
      <CheckCircle className="h-6 w-6 text-green-500" />
    ) : status.overall === 'degraded' ? (
      <AlertCircle className="h-6 w-6 text-yellow-500" />
    ) : (
      <XCircle className="h-6 w-6 text-red-500" />
    )

  const overallColor =
    status.overall === 'healthy'
      ? 'text-green-500'
      : status.overall === 'degraded'
      ? 'text-yellow-500'
      : 'text-red-500'

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {overallIcon}
              <div>
                <CardTitle className={overallColor}>
                  System {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
                </CardTitle>
                <CardDescription>
                  Last check: {new Date(status.timestamp).toLocaleTimeString()}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={fetchStatus}
              variant="outline"
              size="icon"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* ComfyUI Service */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5" />
                ComfyUI
              </CardTitle>
              {status.services.comfy.running && status.services.comfy.apiOnline ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>Local generation backend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <Badge
                variant={status.services.comfy.running ? 'default' : 'secondary'}
              >
                {status.services.comfy.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API:</span>
              <Badge
                variant={status.services.comfy.apiOnline ? 'default' : 'destructive'}
              >
                {status.services.comfy.apiOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            {status.services.comfy.models > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Models:</span>
                <span className="font-mono text-xs">{status.services.comfy.models} checkpoints</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FLUX API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5" />
                FLUX Ultra
              </CardTitle>
              {status.environment.fluxKeyConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <CardDescription>Cloud image generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Key:</span>
              <Badge
                variant={status.environment.fluxKeyConfigured ? 'default' : 'destructive'}
              >
                {status.environment.fluxKeyConfigured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generation:</span>
              <Badge
                variant={status.environment.allowGeneration ? 'default' : 'secondary'}
              >
                {status.environment.allowGeneration ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {!status.environment.allowGeneration && (
              <p className="text-xs text-muted-foreground">
                Set ALLOW_GENERATION=true to enable
              </p>
            )}
          </CardContent>
        </Card>

        {/* v0 Platform API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                v0 Platform
              </CardTitle>
              {status.environment.v0KeyConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <CardDescription>AI code generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Key:</span>
              <Badge
                variant={status.environment.v0KeyConfigured ? 'default' : 'destructive'}
              >
                {status.environment.v0KeyConfigured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              React/Next.js component generation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Environment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Node Env:</span>
              <span className="font-mono text-xs">{status.environment.nodeEnv}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Log Level:</span>
              <span className="font-mono text-xs">{status.environment.logLevel}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">ComfyUI URL:</span>
              <span className="font-mono text-xs">{status.endpoints.comfyUrl}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Data Dir:</span>
              <span className="font-mono text-xs truncate">{status.endpoints.dataDir}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
