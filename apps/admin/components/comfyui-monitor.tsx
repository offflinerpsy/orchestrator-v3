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
      <CardContent>
        <div className="text-sm">{status.online ? 'Online' : 'Offline'}</div>
        {status.models && <div className="text-xs mt-2">Models: {status.models.checkpoints} checkpoints</div>}
      </CardContent>
    </Card>
  )
}
