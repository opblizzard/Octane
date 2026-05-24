import { create } from 'zustand'

export type AlertLevel = 'info' | 'warn' | 'crit'

export interface Alert {
  id:        string
  level:     AlertLevel
  message:   string
  source:    string
  ts:        number
  acked:     boolean
}
export type OperatorAlert = Alert

export interface WorkerInstance {
  id:       string
  colo:     string
  status:   'active' | 'idle' | 'draining'
  requests: number
  cpuMs:    number
  wallMs:   number
  startedAt: number
  cpu:      number
  mem:      number
  req:      number
}

export interface OperatorState {
  workers:       WorkerInstance[]
  alerts:        Alert[]
  deployId:      string
  deployTs:      number
  version:       string
  kvNamespace:   string
  doCount:       number
  doConnections: number
  globalReqSec:  number
  globalErrPct:  number
  cfPlan:        string
  gitSha:        string
  buildTime:     number
  kvUsagePct:    number

  ackAlert:      (id: string)          => void
  clearAlerts:   ()                    => void
  clearAcked:    ()                    => void
  addAlert:      (a: Omit<Alert,'id'|'acked'>) => void
  updateWorkers: (w: WorkerInstance[]) => void
  startPolling:  ()                    => void
  stopPolling:   ()                    => void
}

let _alertSeq = 0
const COLOS = ['EWR','LAX','DFW','ORD','SJC','LHR']

function mockWorkers(): WorkerInstance[] {
  return COLOS.slice(0, 4).map((c, i) => ({
    id:       `worker-${i}`,
    colo:     c,
    status:   i === 0 ? 'active' : i === 3 ? 'idle' : 'active',
    requests: Math.floor(100 + Math.random() * 400),
    cpuMs:    parseFloat((2 + Math.random() * 12).toFixed(2)),
    wallMs:   parseFloat((5 + Math.random() * 20).toFixed(2)),
    startedAt: Date.now() - Math.floor(Math.random() * 3600000),
    cpu:  parseFloat((20 + Math.random() * 60).toFixed(1)),
    mem:  parseFloat((30 + Math.random() * 50).toFixed(1)),
    req:  Math.floor(50 + Math.random() * 200),
  }))
}

export const useOperatorStore = create<OperatorState>((set, get) => ({
  workers:       mockWorkers(),
  alerts: [
    { id: 'a1', level: 'info', message: 'Worker deployed successfully', source: 'deploy', ts: Date.now() - 120000, acked: false },
    { id: 'a2', level: 'warn', message: 'P99 latency spike detected', source: 'metrics', ts: Date.now() - 60000, acked: false },
  ],
  deployId:      `oct-${Date.now().toString(36).toUpperCase()}`,
  deployTs:      Date.now() - 5 * 60000,
  version:       '4.0.0',
  kvNamespace:   'METRICS_KV',
  doCount:       2,
  doConnections: 7,
  globalReqSec:  142.5,
  globalErrPct:  0.34,
  cfPlan:        'Workers Paid',
  gitSha:        'a1b2c3d',
  buildTime:     Date.now() - 5 * 60000,
  kvUsagePct:    12.4,

  ackAlert: (id) => set(s => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, acked: true } : a),
  })),

  clearAlerts: () => set({ alerts: [] }),
  clearAcked: () => set(s => ({ alerts: s.alerts.filter(a => !a.acked) })),

  addAlert: (a) => set(s => ({
    alerts: [...s.alerts.slice(-19), { ...a, id: `a-${_alertSeq++}`, acked: false }],
  })),

  updateWorkers: (w) => set({ workers: w }),
  startPolling: () => {},
  stopPolling: () => {},
}))

if (typeof window !== 'undefined') {
  setInterval(() => {
    useOperatorStore.setState(s => ({
      globalReqSec: Math.max(0, s.globalReqSec + (Math.random()-0.5)*10),
      globalErrPct: Math.max(0, Math.min(5, s.globalErrPct + (Math.random()-0.5)*0.1)),
      workers: s.workers.map(w => ({
        ...w,
        cpu: parseFloat((Math.max(0, Math.min(100, w.cpu + (Math.random()-0.5)*5))).toFixed(1)),
        mem: parseFloat((Math.max(0, Math.min(100, w.mem + (Math.random()-0.5)*2))).toFixed(1)),
        req: Math.floor(Math.max(0, w.req + (Math.random()-0.4)*10)),
      })),
    }))
  }, 2000)
}
