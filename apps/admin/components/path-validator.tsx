'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PathStatus {
  path: string
  location: string
  exists: boolean
  writable?: boolean
}

export function PathValidator() {
  const [paths, setPaths] = useState<PathStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [guardStatus, setGuardStatus] = useState<string>('')

  const checkPaths = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/paths/validate')
      const data = await response.json()
      setPaths(data.paths || [])
      setGuardStatus(data.guardStatus || '')
    } catch (error) {
      console.error('Failed to validate paths:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkPaths()
  }, [])

  const allValid = paths.every(p => p.exists)

  return (
    <Card>
      <CardHeader>
        <CardTitle className=\"flex items-center gap-2\">
          {loading ? (
            <Loader2 className=\"h-5 w-5 animate-spin\" />
          ) : allValid ? (
            <CheckCircle className=\"h-5 w-5 text-green-500\" />
          ) : (
            <AlertCircle className=\"h-5 w-5 text-yellow-500\" />
          )}
          Path Validation
        </CardTitle>
        <CardDescription>
          Проверка путей из paths.json и конфигурации ComfyUI
        </CardDescription>
      </CardHeader>
      <CardContent className=\"space-y-4\">
        <div className=\"space-y-2\">
          {paths.map((item) => (
            <div key={item.path} className=\"flex items-center justify-between p-2 rounded-lg border\">
              <div className=\"flex-1\">
                <div className=\"font-medium text-sm\">{item.path}</div>
                <div className=\"text-xs text-muted-foreground\">{item.location}</div>
              </div>
              {item.exists ? (
                <CheckCircle className=\"h-4 w-4 text-green-500\" />
              ) : (
                <XCircle className=\"h-4 w-4 text-red-500\" />
              )}
            </div>
          ))}
        </div>

        {guardStatus && (
          <div className=\"p-3 rounded-lg bg-muted\">
            <div className=\"text-sm font-medium mb-1\">Guard Script Status:</div>
            <div className=\"text-xs text-muted-foreground whitespace-pre-wrap\">{guardStatus}</div>
          </div>
        )}

        <Button onClick={checkPaths} disabled={loading} className=\"w-full\">
          {loading ? <Loader2 className=\"h-4 w-4 animate-spin mr-2\" /> : null}
          Recheck Paths
        </Button>
      </CardContent>
    </Card>
  )
}
