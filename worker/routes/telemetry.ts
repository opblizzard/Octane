import type { Env } from '../index'
import { jsonResponse } from '../middleware/cors'

export async function handleTelemetry(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cf = request.cf ?? {}

  const snapshot = {
    ts:        Date.now(),
    colo:      cf.colo      ?? 'DEV',
    country:   cf.country   ?? 'US',
    continent: cf.continent ?? 'NA',
    city:      cf.city      ?? 'Local',
    region:    cf.region    ?? 'Dev',
    timezone:  cf.timezone  ?? 'America/New_York',
    asn:       cf.asn       ?? 0,
    asOrganization: (cf as Record<string,unknown>).asOrganization ?? 'Development',
    httpProtocol:   cf.httpProtocol ?? 'HTTP/1.1',
    tlsVersion:     cf.tlsVersion   ?? 'TLSv1.3',
    clientTrustScore: (cf as Record<string,unknown>).clientTrustScore ?? 99,
  }

  // Write to Analytics Engine if available
  try {
    env.ANALYTICS.writeDataPoint({
      blobs:   [snapshot.colo, snapshot.country],
      doubles: [Date.now()],
      indexes: ['telemetry'],
    })
  } catch { /* not available in dev */ }

  return jsonResponse(snapshot)
}
