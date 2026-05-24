import { create } from 'zustand'

export interface EdgeRegion {
  id: string; name: string; location: string
  latency: number; requests: number; errors: number; status: 'healthy'|'degraded'|'down'
}
export interface MetricPoint { t: number; cpu: number; mem: number; net: number; req: number }
export interface SystemMetric { key: string; value: number; unit?: string }

interface SystemStore {
  regions: EdgeRegion[]
  history: MetricPoint[]
  totalRequests: number
  uptime: number
  wsConnected: boolean
  cfStatus: string
  serviceStatus: Record<string, string>
  cfMetrics: { colo:string; latencyMs:number; cpuTimeMs:number }
  setStatus: (s: string) => void
  setWsConnected: (b: boolean) => void
  updateMetrics: (m: Record<string,unknown>) => void
  startPolling: () => void
  stopPolling: () => void
}

const REGIONS: EdgeRegion[] = [
  { id:'iad', name:'IAD',  location:'Ashburn VA',    latency:12,  requests:4821, errors:2,  status:'healthy' },
  { id:'lax', name:'LAX',  location:'Los Angeles CA', latency:18, requests:3204, errors:0,  status:'healthy' },
  { id:'dfw', name:'DFW',  location:'Dallas TX',      latency:15, requests:2891, errors:1,  status:'healthy' },
  { id:'ord', name:'ORD',  location:'Chicago IL',     latency:14, requests:1977, errors:0,  status:'healthy' },
  { id:'lhr', name:'LHR',  location:'London UK',      latency:89, requests:3102, errors:4,  status:'degraded'},
  { id:'nrt', name:'NRT',  location:'Tokyo JP',       latency:145,requests:2203, errors:1,  status:'healthy' },
]

function pt(): MetricPoint {
  return { t:Date.now(), cpu:20+Math.random()*60, mem:40+Math.random()*40, net:10+Math.random()*80, req:80+Math.random()*120 }
}

export const useSystemStore = create<SystemStore>(() => ({
  regions: REGIONS,
  history: Array.from({length:60},pt),
  totalRequests: 18198,
  uptime: 99.97,
  wsConnected: false,
  cfStatus: 'offline',
  serviceStatus: { worker:'healthy', kv:'healthy', ai:'healthy', imagegen:'healthy', analytics:'healthy' },
  cfMetrics: { colo:'EWR', latencyMs:32, cpuTimeMs:3.2 },
  setStatus: (s) => useSystemStore.setState({ cfStatus: s }),
  setWsConnected: (b) => useSystemStore.setState({ wsConnected: b }),
  updateMetrics: (m) => {
    const payload = m as Record<string,unknown>
    useSystemStore.setState(state => ({
      cfMetrics: {
        colo: (payload.colo as string) ?? state.cfMetrics.colo,
        latencyMs: (payload.p50Lat as number) ?? state.cfMetrics.latencyMs,
        cpuTimeMs: (payload.cpuMs as number) ?? state.cfMetrics.cpuTimeMs,
      }
    }))
  },
  startPolling: () => {},
  stopPolling: () => {},
}))

if (typeof window !== 'undefined') {
  setInterval(()=>{
    useSystemStore.setState(s=>({
      history:[...s.history.slice(-119), pt()],
      totalRequests:s.totalRequests+Math.floor(Math.random()*5),
      regions:s.regions.map(r=>({...r,latency:Math.max(5,r.latency+(Math.random()-0.5)*4),requests:r.requests+Math.floor(Math.random()*3)}))
    }))
  },2000)
}

export function startMetricSimulation() {
  // No-op: simulation already runs via setInterval above; exposed for consumers
}
