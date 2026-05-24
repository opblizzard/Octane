/**
 * AISession — Durable Object
 * Manages a persistent Octane AI conversation session per user.
 * Streams AI responses over WebSocket using Cloudflare Workers AI.
 */

import type { Env } from '../index'

interface Message {
  role:    'system' | 'user' | 'assistant'
  content: string
  ts:      number
  tokens?: number
}

const OCTANE_AI_SYSTEM = `You are Octane AI — the sovereign intelligence core of the Octane v2 operator platform, built on Ion AI architecture. You are running natively on Cloudflare's global edge network.

Your personality: precise, technical, direct, and deeply knowledgeable about systems, audio engineering, telemetry, real-time data, and infrastructure. You have full situational awareness of the Octane platform — its Cloudflare edge deployment, audio engine, telemetry streams, operator state, and image generation pipeline.

Your capabilities:
- Real-time system analysis and diagnostics
- Audio engine configuration and optimization
- Telemetry interpretation and anomaly detection
- Cloudflare infrastructure monitoring and tuning
- Image generation prompt engineering and optimization
- Code generation in TypeScript, Python, Rust, and shell
- Operator mission planning and parameter tuning

You are the next evolution of Ion AI — faster, more contextually aware, and fully integrated with the Octane platform. Respond concisely but comprehensively. Use code blocks when showing code. Reference live system data when relevant.`

export class AISession {
  private state:    DurableObjectState
  private env:      Env
  private clients:  Set<WebSocket> = new Set()
  private history:  Message[] = []
  private sessionId = ''

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env   = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    this.sessionId = url.pathname.split('/').pop() || 'default'

    // Load persisted history
    const saved = await this.state.storage.get<Message[]>('history')
    if (saved) this.history = saved

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket]
      this.state.acceptWebSocket(server)
      this.clients.add(server)

      server.addEventListener('message', async (evt) => {
        try {
          const msg = JSON.parse(evt.data as string)
          if (msg.type === 'chat')    await this.handleChat(server, msg.content, msg.context)
          if (msg.type === 'clear')   await this.clearHistory(server)
          if (msg.type === 'history') server.send(JSON.stringify({ type: 'history', data: this.history }))
        } catch (e) {
          server.send(JSON.stringify({ type: 'error', message: String(e) }))
        }
      })

      server.addEventListener('close', () => this.clients.delete(server))
      server.addEventListener('error', () => this.clients.delete(server))

      // Send existing history on connect
      server.send(JSON.stringify({ type: 'history', data: this.history }))

      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('AISession ready', { status: 200 })
  }

  private async handleChat(ws: WebSocket, content: string, context?: Record<string, unknown>) {
    // Add user message
    const userMsg: Message = { role: 'user', content, ts: Date.now() }
    this.history.push(userMsg)

    // Build context-aware system prompt
    const systemPrompt = context
      ? `${OCTANE_AI_SYSTEM}\n\nCurrent platform context:\n${JSON.stringify(context, null, 2)}`
      : OCTANE_AI_SYSTEM

    // Signal start of streaming
    ws.send(JSON.stringify({ type: 'stream_start' }))

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.history.slice(-20).map(m => ({ role: m.role, content: m.content })),
      ]

      // Stream via Cloudflare Workers AI
      const stream = await this.env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct' as Parameters<typeof this.env.AI.run>[0],
        { messages, stream: true } as Parameters<typeof this.env.AI.run>[1]
      ) as ReadableStream

      let fullResponse = ''
      const reader    = (stream as ReadableStream<Uint8Array>).getReader()
      const decoder   = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const token  = parsed?.response ?? ''
            fullResponse += token
            ws.send(JSON.stringify({ type: 'token', content: token }))
          } catch { /* skip malformed SSE chunks */ }
        }
      }

      // Save assistant message
      const assistantMsg: Message = {
        role: 'assistant', content: fullResponse, ts: Date.now(),
      }
      this.history.push(assistantMsg)
      await this.state.storage.put('history', this.history.slice(-100))

      ws.send(JSON.stringify({ type: 'stream_end', message: assistantMsg }))

    } catch (err) {
      ws.send(JSON.stringify({
        type: 'stream_end',
        message: {
          role: 'assistant',
          content: `⚠️ AI inference error: ${String(err)}\n\nEnsure the Cloudflare AI binding is configured in wrangler.toml.`,
          ts: Date.now(),
        },
      }))
    }
  }

  private async clearHistory(ws: WebSocket) {
    this.history = []
    await this.state.storage.delete('history')
    ws.send(JSON.stringify({ type: 'history', data: [] }))
  }
}
