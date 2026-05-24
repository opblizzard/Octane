export { MetricsRoom } from './metrics-room'
export { AISession } from './ai-session'

interface Env {
  AI: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> }
  KV: KVNamespace
  METRICS_ROOM: DurableObjectNamespace
  AI_SESSION: DurableObjectNamespace
  ANALYTICS: AnalyticsEngineDataset
}

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}
interface AnalyticsEngineDataset {
  writeDataPoint(data: { indexes?: string[]; doubles?: number[]; blobs?: string[] }): void
}
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId
  get(id: DurableObjectId): DurableObjectStub
}
interface DurableObjectId { toString(): string }
interface DurableObjectStub { fetch(req: Request): Promise<Response> }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function cors(res: Response): Response {
  const h = new Headers(res.headers)
  Object.entries(CORS_HEADERS).forEach(([k, v]) => h.set(k, v))
  return new Response(res.body, { status: res.status, headers: h })
}

function json(data: unknown, status = 200): Response {
  return cors(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  }))
}

function buildAISystemPrompt(context?: Record<string, unknown>): string {
  const contextBlock = context
    ? `\n\nRuntime context:\n${JSON.stringify(context, null, 2)}`
    : ''

  return [
    'You are Ion AI for Octane, a highly capable assistant running on Cloudflare Workers AI.',
    'Answer the user\'s actual request directly and intelligently.',
    'Adapt to the task: explain, write, summarize, debug, brainstorm, plan, or generate creative content as needed.',
    'Use Octane platform context only when it is relevant; otherwise do not force platform jargon into general requests.',
    'Be accurate, concise by default, and specific when the user asks for detail.',
  ].join(' ') + contextBlock
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    // WebSocket: metrics
    if (pathname === '/ws/metrics') {
      const id = env.METRICS_ROOM.idFromName('global')
      const obj = env.METRICS_ROOM.get(id)
      return obj.fetch(request)
    }

    // WebSocket: AI session
    if (pathname.startsWith('/ws/ai/')) {
      const sessionId = pathname.slice(8) || 'default'
      const id = env.AI_SESSION.idFromName(sessionId)
      const obj = env.AI_SESSION.get(id)
      return obj.fetch(request)
    }

    // Health
    if (pathname === '/api/health') {
      return json({ status: 'ok', version: '4.0.0', edition: 'chaos-governor', ts: Date.now() })
    }

    // Metrics snapshot
    if (pathname === '/api/metrics') {
      const snap = {
        ts: Date.now(),
        cpu: 20 + Math.random() * 60,
        memory: 40 + Math.random() * 40,
        requests: Math.floor(80 + Math.random() * 120),
        latency_p50: Math.floor(20 + Math.random() * 60),
        latency_p95: Math.floor(80 + Math.random() * 200),
        regions: ['IAD', 'LAX', 'DFW', 'ORD', 'LHR', 'NRT'].map(r => ({
          id: r, latency: Math.floor(10 + Math.random() * 150), status: Math.random() > 0.05 ? 'healthy' : 'degraded',
        })),
      }
      env.ANALYTICS?.writeDataPoint({ indexes: ['metrics'], doubles: [snap.cpu, snap.memory], blobs: ['snapshot'] })
      return json(snap)
    }

    // AI inference (chaos-aware)
    if (pathname === '/api/ai' && request.method === 'POST') {
      try {
        const body = await request.json() as Record<string, unknown>
        const {
          messages,
          message,
          prompt,
          context,
          model,
          temperature = 0.7,
          topP = 0.9,
          topK = 40,
          maxTokens = 1024,
        } = body

        const promptText = String(message || prompt || '').trim()
        const normalizedMessages = Array.isArray(messages)
          ? messages
              .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
              .map(entry => ({
                role: String(entry.role || 'user'),
                content: String(entry.content || ''),
              }))
              .filter(entry => entry.content.trim().length > 0)
              .slice(-20)
          : []

        const msgs = normalizedMessages.length > 0
          ? normalizedMessages
          : promptText
            ? [{ role: 'user', content: promptText }]
            : []

        if (msgs.length === 0) {
          return json({ error: 'message or messages required' }, 400)
        }

        const systemMsg = {
          role: 'system',
          content: buildAISystemPrompt(context && typeof context === 'object' ? context as Record<string, unknown> : undefined),
        }

        const response = await (env.AI.run as Function)(String(model || '@cf/meta/llama-3.1-8b-instruct'), {
          messages: [systemMsg, ...msgs],
          temperature: Math.min(2.0, Number(temperature)),
          top_p: Math.min(0.99, Number(topP)),
          top_k: Math.min(100, Number(topK)),
          max_tokens: Math.min(4096, Number(maxTokens)),
          stream: false,
        })

        if (response && typeof response === 'object') {
          const payload = response as Record<string, unknown>
          const content = payload.response ?? payload.content ?? payload.text
          if (typeof content === 'string' && content.trim()) {
            return json({
              role: 'assistant',
              content,
              model: String(model || '@cf/meta/llama-3.1-8b-instruct'),
              ts: Date.now(),
            })
          }
        }

        return json({ error: 'AI returned an empty response' }, 502)
      } catch (e) {
        return json({ error: String(e) }, 500)
      }
    }

    // Image generation
    if (pathname === '/api/imagegen' && request.method === 'POST') {
      try {
        const body = await request.json() as Record<string, unknown>
        const {
          prompt,
          negative_prompt,
          negative,
          num_steps,
          steps,
          guidance,
          cfg_scale,
          width = 1024,
          height = 1024,
          seed,
          model,
        } = body
        const selectedModel = String(model || '@cf/stabilityai/stable-diffusion-xl-base-1.0')

        if (!String(prompt || '').trim()) {
          return json({ error: 'prompt required' }, 400)
        }

        const runInputs: Record<string, unknown> = {
          prompt: String(prompt),
          negative_prompt: String(negative_prompt || negative || ''),
          num_steps: Math.min(20, Number(num_steps ?? steps ?? 20)),
          guidance: Number(guidance ?? cfg_scale ?? 7.5),
          width: Number(width),
          height: Number(height),
        }
        if (seed !== undefined) runInputs.seed = Number(seed)

        const result = await (env.AI.run as Function)(selectedModel, runInputs)

        if (result instanceof ReadableStream) {
          return cors(new Response(result, { headers: { 'Content-Type': 'image/png' } }))
        }

        if (result instanceof ArrayBuffer || ArrayBuffer.isView(result)) {
          return cors(new Response(result as BodyInit, { headers: { 'Content-Type': 'image/png' } }))
        }

        if (result && typeof result === 'object' && 'image' in (result as Record<string, unknown>)) {
          const b64 = String((result as Record<string, unknown>).image || '')
          const binary = atob(b64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          return cors(new Response(bytes, { headers: { 'Content-Type': 'image/png' } }))
        }

        return json({ error: 'Unexpected image response format from AI binding' }, 500)
      } catch (e) {
        return json({ error: String(e) }, 500)
      }
    }

    return json({ error: 'Not found' }, 404)
  },
}
