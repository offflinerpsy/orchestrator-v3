/**
 * Orchestrator V6 — Home Page
 * «IGNITE» — автозапуск всего стека одной кнопкой
 * Services control panel with toggle cards for ComfyUI/FLUX/v0
 * Quick launch to Builder UI
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceCards } from '@/components/service-cards'
import { IgniteButton } from '@/components/ignite-button'
import { 
  Sparkles, 
  Server,
  ExternalLink,
  ArrowRight,
  Zap
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Orchestrator V6</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Ultra Builder — Your AI-powered design & code generation suite
          </p>
          
          {/* Кнопка IGNITE — запуск всего стека */}
          <div className="flex justify-center gap-4 mb-6">
            <IgniteButton />
            <Link href="/builder">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Open Builder
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Services Status Cards */}
        <ServiceCards />

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/builder">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Open Builder
                </Button>
              </Link>
              <Link href="/status">
                <Button variant="outline" className="w-full justify-start">
                  <Server className="mr-2 h-4 w-4" />
                  System Status
                </Button>
              </Link>
              <Link href="/site/import">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Import from Tilda
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <a href="/docs/v0-ux-notes.md" className="block hover:underline text-muted-foreground">
                → v0 UX Patterns
              </a>
              <a href="/docs/links.md" className="block hover:underline text-muted-foreground">
                → API Resources
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="block hover:underline text-muted-foreground">
                → GitHub Repository
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
