// AISession Durable Object — chaos-aware streaming AI session with per-session state
interface Env {
  AI: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> }
}

interface DurableObjectState {
  storage: {
    get(key: string): Promise<unknown>
    put(key: string, value: unknown): Promise<void>
  }
}

export class AISession {
  private socket: WebSocket | null = null
  private chaosLevel = 0.3
  private messages: { role: string; content: string }[] = []

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade')
    if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

    server.accept()

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(String(event.data))

        if (data.type === 'config') {
          this.chaosLevel = data.chaos ?? this.chaosLevel
          server.send(JSON.stringify({ type: 'configured', chaos: this.chaosLevel }))
          return
        }

        if (data.type === 'message') {
          const userMsg = { role: 'user', content: String(data.content) }
          this.messages.push(userMsg)

          const temperature = 0.05 + this.chaosLevel * 1.95
          const topP = 0.60 + this.chaosLevel * 0.39
          const topK = Math.round(1 + this.chaosLevel * 99)

          const systemMsg = {
            role: 'system',
            content: `You are Ion AI v4 — Octane's sovereign intelligence core. Chaos level: ${(this.chaosLevel*100).toFixed(0)}%. Temperature: ${temperature.toFixed(2)}. Strategy: ${this.getStrategy()}. Respond with depth and precision.`,
          }

          const stream = await (this.env.AI.run as Function)('@cf/meta/llama-3.1-8b-instruct', {
            messages: [systemMsg, ...this.messages.slice(-10)],
            temperature: Math.min(2.0, temperature),
            top_p: Math.min(0.99, topP),
            top_k: Math.min(100, topK),
            stream: true,
          }) as ReadableStream

          const reader = stream.getReader()
          const decoder = new TextDecoder()
          let full = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data:')) {
                try {
                  const d = JSON.parse(line.slice(5))
                  if (d.response) {
                    full += d.response
                    server.send(JSON.stringify({ type: 'chunk', response: d.response }))
                  }
                } catch {}
              }
            }
          }

          this.messages.push({ role: 'assistant', content: full })
          server.send(JSON.stringify({ type: 'done', length: full.length }))
        }
      } catch (e) {
        server.send(JSON.stringify({ type: 'error', error: String(e) }))
      }
    })

    server.addEventListener('close', () => { this.socket = null })
    this.socket = server

    server.send(JSON.stringify({ type: 'ready', chaos: this.chaosLevel, session: true }))

    return new Response(null, { status: 101, webSocket: client })
  }

  private getStrategy(): string {
    const c = this.chaosLevel
    if (c <= 0.2) return 'deterministic'
    if (c <= 0.4) return 'chain-of-thought'
    if (c <= 0.6) return 'balanced'
    if (c <= 0.8) return 'divergent'
    return 'emergent'
  }
}

class WebSocketPair {
  [key: number]: WebSocket
}
