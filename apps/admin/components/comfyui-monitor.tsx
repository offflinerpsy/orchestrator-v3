'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ComfyUIStatus {
  online: boolean
  stats?: any
  models?: { checkpoints: number; controlnet: number; ipadapter: number }
}

export function ComfyUIMonitor() {
  const [status, setStatus] = useState<ComfyUIStatus>({ online: false })
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/comfyui/status')
      const data = await response.json()
      setStatus(data)
    } catch { setStatus({ online: false }) } finally { setLoading(false) }
  }

  useEffect(() => { checkStatus(); const i = setInterval(checkStatus, 10000); return () => clearInterval(i) }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.online ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
          ComfyUI Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {status.online ? 'Online' : 'Offline'}
        </div>
        {!status.online && (
          <div className="text-xs text-muted-foreground">
            Проверьте, что ComfyUI запущен на 127.0.0.1:8188 (endpoint: /system_stats).
          </div>
        )}
        {status.models && <div className="text-xs">Models: {status.models.checkpoints} checkpoints</div>}
        <div>
          <Button size="sm" variant="outline" disabled={loading} onClick={checkStatus}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recheck'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
