import { NextResponse } from 'next/server'
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client'

// Initialize default metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'orchestrator_' })

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'orchestrator_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

const httpRequestDuration = new Histogram({
  name: 'orchestrator_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
})

// Additional custom metrics
new Counter({
  name: 'orchestrator_comfy_api_calls_total',
  help: 'Total number of ComfyUI API calls',
  labelNames: ['endpoint', 'status'],
})

new Counter({
  name: 'orchestrator_flux_generations_total',
  help: 'Total number of FLUX generations',
  labelNames: ['model', 'status'],
})

export async function GET() {
  try {
    const metrics = await register.metrics()
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to collect metrics',
      },
      { status: 500 }
    )
  }
}
