import { create } from 'zustand'

export interface RequestLog {
  id: string; ts: number; path: string; method: string
  status: number; latency: number; region: string; size: number
}
export type TelemetryEntry = RequestLog
interface TelemetryStore {
  logs: RequestLog[]
  entries: RequestLog[]
  p50: number; p95: number; p99: number
  errorRate: number
  latencyHistory: number[]
  cfMeta: Record<string, string>
  startPolling: () => void
  stopPolling: () => void
}

const PATHS=['/api/ai','/api/imagegen','/api/metrics','/ws/metrics','/api/health']
const REGIONS=['IAD','LAX','DFW','ORD','NRT']
const METHODS=['GET','POST','GET','POST','GET']

function makeLog(): RequestLog {
  const i=Math.floor(Math.random()*PATHS.length)
  const lat=Math.random()<0.05?800+Math.random()*1200:20+Math.random()*180
  return { id:`l${Date.now()}${Math.random()}`, ts:Date.now(), path:PATHS[i], method:METHODS[i],
    status:Math.random()<0.03?500:200, latency:Math.round(lat), region:REGIONS[Math.floor(Math.random()*REGIONS.length)], size:Math.floor(200+Math.random()*2000) }
}

export const useTelemetryStore = create<TelemetryStore>(()=>({
  logs: Array.from({length:20},makeLog),
  entries: Array.from({length:20},makeLog),
  p50:48, p95:142, p99:380, errorRate:0.8,
  latencyHistory: Array.from({length:60},()=>20+Math.random()*180),
  cfMeta: { colo:'EWR', dc:'Ashburn VA', plan:'Workers Paid', version:'4.0.0' },
  startPolling: () => {},
  stopPolling: () => {},
}))

if (typeof window !== 'undefined') {
  setInterval(()=>{
    useTelemetryStore.setState((s: TelemetryStore)=>{
      const newLogs=[makeLog(),...s.logs].slice(0,60) as RequestLog[]
      const lats=newLogs.map(l=>l.latency).sort((a,b)=>a-b)
      return { logs:newLogs.slice(0,40), entries:newLogs.slice(0,40), latencyHistory:[...s.latencyHistory.slice(-59),lats[Math.floor(lats.length*0.5)]||50],
        p50:lats[Math.floor(lats.length*0.5)]||50, p95:lats[Math.floor(lats.length*0.95)]||200, p99:lats[Math.floor(lats.length*0.99)]||500,
        errorRate:parseFloat((newLogs.filter(l=>l.status>=500).length/newLogs.length*100).toFixed(2)) }
    })
  },1200)
}
