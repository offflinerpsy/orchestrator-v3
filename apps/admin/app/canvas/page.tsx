'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface CanvasFile {
  name: string
  ext: string
  size: number
  mtimeMs: number
  url: string
}

interface CanvasResponse {
  items: CanvasFile[]
  total: number
  page: number
  limit: number
}

export default function CanvasPage() {
  const [files, setFiles] = useState<CanvasFile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 30

  useEffect(() => {
    async function fetchCanvas() {
      setLoading(true)
      try {
        const res = await fetch(`/api/canvas/list?page=${page}&limit=${limit}`)
        if (res.ok) {
          const data: CanvasResponse = await res.json()
          setFiles(data.items)
          setTotal(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch canvas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCanvas()
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Canvas Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Generated images from F:\Drop\out
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{total} total files</Badge>
            <Badge variant="default">Page {page} of {totalPages}</Badge>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading images...</p>
            </CardContent>
          </Card>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No images yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generated images will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {files.map(file => (
                <Card key={file.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-mono truncate mb-1">{file.name}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                      <a
                        href={file.url}
                        download={file.name}
                        className="text-muted-foreground hover:text-foreground"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(file.mtimeMs).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Recent Success */}
        <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              ✓ Recent Successful Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-green-900 dark:text-green-300">
              • sdxl_00002_.png (2.09 MB) — "futuristic cyberpunk city at night, neon lights, rain"
            </p>
            <p className="text-green-900 dark:text-green-300">
              • sdxl_00001_.png (1.75 MB) — "mountain sunset"
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
