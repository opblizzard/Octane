// MetricsRoom Durable Object — broadcasts live metrics to all connected WebSocket clients
interface Env {}

interface WebSocketWithMeta extends WebSocket {
  __alive?: boolean
}

export class MetricsRoom {
  private clients = new Set<WebSocketWithMeta>()
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade')
    if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocketWithMeta, WebSocketWithMeta]
    server.__alive = true

    server.accept()

    server.addEventListener('close', () => {
      server.__alive = false
      this.clients.delete(server)
    })
    server.addEventListener('error', () => {
      server.__alive = false
      this.clients.delete(server)
    })

    this.clients.add(server)

    // Start tick if needed
    if (!this.tickInterval) {
      this.tickInterval = setInterval(() => this.broadcast(), 2000)
    }

    // Send initial snapshot
    server.send(JSON.stringify(this.snapshot()))

    return new Response(null, { status: 101, webSocket: client })
  }

  private snapshot() {
    return {
      type: 'metrics',
      ts: Date.now(),
      cpu: parseFloat((20 + Math.random() * 60).toFixed(2)),
      memory: parseFloat((40 + Math.random() * 40).toFixed(2)),
      requests: Math.floor(80 + Math.random() * 120),
      latency: Math.floor(20 + Math.random() * 100),
      connections: this.clients.size,
    }
  }

  private broadcast() {
    const data = JSON.stringify(this.snapshot())
    for (const ws of this.clients) {
      if (ws.__alive) {
        try { ws.send(data) } catch { ws.__alive = false; this.clients.delete(ws) }
      } else {
        this.clients.delete(ws)
      }
    }
    if (this.clients.size === 0 && this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
  }
}

interface DurableObjectState {
  storage: { get(key: string): Promise<unknown> }
}
class WebSocketPair {
  [key: number]: WebSocket
  constructor() {
    // CF Workers runtime provides this natively
  }
}
