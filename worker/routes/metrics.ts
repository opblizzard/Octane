import type { Env } from '../index'
import { jsonResponse } from '../middleware/cors'

export async function handleMetrics(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url)

  // Return latest stored metrics from KV
  if (url.searchParams.get('history') === 'true') {
    const keys = await env.METRICS_KV.list({ prefix: 'metrics:', limit: 60 })
    const entries = await Promise.all(
      keys.keys.map(async k => {
        const val = await env.METRICS_KV.get(k.name, 'json')
        return val
      })
    )
    return jsonResponse({ history: entries.filter(Boolean).reverse() })
  }

  const latest = await env.METRICS_KV.get('metrics:latest', 'json')
  if (!latest) {
    return jsonResponse({
      ts: Date.now(), colo: 'DEV', cpuMs: 0, wallMs: 0,
      requestsPerSec: 0, activeConns: 0, errorRate: 0,
      p50Lat: 0, p95Lat: 0, p99Lat: 0,
    })
  }
  return jsonResponse(latest)
}
