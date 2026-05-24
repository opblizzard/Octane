// OctaneClient — SDK wrapper for Octane CF Worker API
// AI and ImageGen stores handle fetching directly; this client is available for custom extensions.

import { getAPIBaseUrl, resolveWsUrl } from './runtime'

const BASE = getAPIBaseUrl()

export class OctaneClient {
  constructor(private base = BASE) {}

  async health() {
    return fetch(`${this.base}/api/health`).then(r => r.json())
  }

  async getMetrics() {
    return fetch(`${this.base}/api/metrics`).then(r => r.json())
  }

  async sendAI(messages: {role:string;content:string}[], params: Record<string, unknown>) {
    return fetch(`${this.base}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, ...params }),
    })
  }

  async generateImage(body: Record<string, unknown>) {
    return fetch(`${this.base}/api/imagegen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  openMetricsSocket(onMessage: (data: unknown) => void) {
    const ws = new WebSocket(this.base ? `${this.base.replace('http','ws')}/ws/metrics` : resolveWsUrl('/ws/metrics'))
    ws.onmessage = e => { try { onMessage(JSON.parse(e.data)) } catch {} }
    return ws
  }

  openAISocket(sessionId: string, onChunk: (text: string) => void) {
    const ws = new WebSocket(this.base ? `${this.base.replace('http','ws')}/ws/ai/${sessionId}` : resolveWsUrl(`/ws/ai/${sessionId}`))
    ws.onmessage = e => { try { const d = JSON.parse(e.data); if(d.response) onChunk(d.response) } catch {} }
    return ws
  }
}

export const octaneClient = new OctaneClient()

export interface CFMetrics {
  p50Lat: number; p95Lat: number; p99Lat: number
  cpuMs: number; reqPerSec: number; errorRate: number; colo: string
}
export interface AIMessage { role: 'user'|'assistant'|'system'; content: string }
export interface ImageGenRequest {
  prompt: string; width?: number; height?: number
  steps?: number; guidance?: number; seed?: number
}
