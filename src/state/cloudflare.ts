import { create } from 'zustand'
import { useSystemStore, startMetricSimulation } from './system'
import { resolveWsUrl } from '@sdk/runtime'

export interface EdgeRegion {
  id: string; name: string; colo?: string; location: string
  region?: string; latP50?: number; reqRate?: number
  latency: number; requests: number; errors: number; status: 'healthy'|'degraded'|'down'
}
export interface CFMetricsSnapshot {
  timestamp: number; colo: string
  p50Lat: number; p95Lat: number; p99Lat: number
  cpuMs: number; reqPerSec: number; errorRate: number
}

export interface CloudflareState {
  wsUrl:       string
  connected:   boolean
  colo:        string
  accountId:   string
  scriptName:  string
  environment: string
  p50Lat:      number
  p95Lat:      number
  p99Lat:      number
  cpuMs:       number
  reqPerSec:   number
  errorRate:   number
  doInvocations: number
  kvReads:     number
  kvWrites:    number
  activeConns: number
  memBytes:    number
  bytesIn:     number
  bytesOut:    number
  wallMs:      number
  history:     CFMetricsSnapshot[]
  edgeRegions: EdgeRegion[]
  connect:     () => void
  disconnect:  () => void
}

const EDGE_REGIONS: EdgeRegion[] = [
  { id:'iad', name:'IAD', colo:'IAD', location:'Ashburn VA',     region:'Ashburn VA',      latency:12,  latP50:12,  requests:4821, reqRate:482.1, errors:2, status:'healthy'  },
  { id:'lax', name:'LAX', colo:'LAX', location:'Los Angeles CA', region:'Los Angeles CA',  latency:18,  latP50:18,  requests:3204, reqRate:320.4, errors:0, status:'healthy'  },
  { id:'dfw', name:'DFW', colo:'DFW', location:'Dallas TX',      region:'Dallas TX',       latency:15,  latP50:15,  requests:2891, reqRate:289.1, errors:1, status:'healthy'  },
  { id:'ord', name:'ORD', colo:'ORD', location:'Chicago IL',     region:'Chicago IL',      latency:14,  latP50:14,  requests:1977, reqRate:197.7, errors:0, status:'healthy'  },
  { id:'lhr', name:'LHR', colo:'LHR', location:'London UK',      region:'London UK',       latency:89,  latP50:89,  requests:3102, reqRate:310.2, errors:4, status:'degraded' },
  { id:'nrt', name:'NRT', colo:'NRT', location:'Tokyo JP',       region:'Tokyo JP',        latency:145, latP50:145, requests:2203, reqRate:220.3, errors:1, status:'healthy'  },
]

function mkSnapshot(colo='EWR'): CFMetricsSnapshot {
  return {
    timestamp: Date.now(), colo,
    p50Lat: 20 + Math.random()*60, p95Lat: 80 + Math.random()*120, p99Lat: 200 + Math.random()*300,
    cpuMs: 1 + Math.random()*8, reqPerSec: 60 + Math.random()*200, errorRate: Math.random()*2,
  }
}

export const useCloudflareStore = create<CloudflareState>((set, get) => ({
  wsUrl:       resolveWsUrl('/ws/metrics'),
  connected:   false,
  colo:        'EWR',
  accountId:   'oct-cf-account',
  scriptName:  'octane-worker',
  environment: 'production',
  p50Lat: 32, p95Lat: 98, p99Lat: 240, cpuMs: 3.2, reqPerSec: 120, errorRate: 0.4,
  doInvocations: 14, kvReads: 88, kvWrites: 12,
  activeConns: 42, memBytes: 96 * 1024 * 1024, bytesIn: 48_000, bytesOut: 61_000, wallMs: 6.4,
  history: Array.from({length:60}, () => mkSnapshot()),
  edgeRegions: EDGE_REGIONS,

  connect: () => {
    const { wsUrl } = get()
    useSystemStore.getState().setStatus('connecting')

    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        set({ connected: true, colo: 'EWR' })
        useSystemStore.getState().setStatus('connected')
        useSystemStore.getState().setWsConnected(true)
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'metrics') {
            useSystemStore.getState().updateMetrics(data.payload)
          }
          if (data.colo) set({ colo: data.colo })
        } catch { /* ignore parse errors */ }
      }

      ws.onerror = () => {
        set({ connected: false })
        useSystemStore.getState().setStatus('degraded')
        useSystemStore.getState().setWsConnected(false)
        // Fall back to simulation
        startMetricSimulation()
      }

      ws.onclose = () => {
        set({ connected: false })
        useSystemStore.getState().setStatus('offline')
        useSystemStore.getState().setWsConnected(false)
        startMetricSimulation()
      }
    } catch {
      set({ connected: false })
      useSystemStore.getState().setStatus('offline')
      startMetricSimulation()
    }
  },

  disconnect: () => {
    set({ connected: false })
    useSystemStore.getState().setStatus('offline')
    useSystemStore.getState().setWsConnected(false)
  },
}))

// Alias for backwards compat and imports expecting useCFStore
export const useCFStore = useCloudflareStore

// Simulate metric updates when not connected to real WS
if (typeof window !== 'undefined') {
  setInterval(() => {
    const snap = mkSnapshot(useCloudflareStore.getState().colo)
    useCloudflareStore.setState(s => ({
      p50Lat: snap.p50Lat, p95Lat: snap.p95Lat, p99Lat: snap.p99Lat,
      cpuMs: snap.cpuMs, reqPerSec: snap.reqPerSec, errorRate: snap.errorRate,
      activeConns: Math.max(0, Math.round(s.activeConns + (Math.random() - 0.5) * 6)),
      memBytes: Math.max(16 * 1024 * 1024, s.memBytes + (Math.random() - 0.5) * 2 * 1024 * 1024),
      bytesIn: Math.max(0, s.bytesIn + (Math.random() - 0.5) * 8000),
      bytesOut: Math.max(0, s.bytesOut + (Math.random() - 0.5) * 9000),
      wallMs: Math.max(0.1, s.wallMs + (Math.random() - 0.5) * 0.8),
      doInvocations: Math.max(0, s.doInvocations + (Math.random() - 0.5) * 2),
      kvReads: Math.max(0, s.kvReads + (Math.random() - 0.5) * 8),
      kvWrites: Math.max(0, s.kvWrites + (Math.random() - 0.5) * 3),
      history: [...s.history.slice(-119), snap],
    }))
  }, 2000)
}
