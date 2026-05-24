import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { Button } from '@components/controls/Button'
import { useSystemStore } from '@state/system'
import { useChaosStore } from '@state/chaos'
import { useState } from 'react'

export default function Diagnostics() {
  const { regions } = useSystemStore()
  const { chaos, entropy, stabilizers } = useChaosStore()
  const [running, setRunning] = useState(false)

  const checks = [
    { name:'CF Worker Health',   status: 'healthy' as const, latency:8 },
    { name:'AI Model Endpoint',  status: 'healthy' as const, latency:24 },
    { name:'KV Namespace',       status: 'healthy' as const, latency:3 },
    { name:'Durable Objects',    status: entropy > 0.8 ? 'degraded' as const : 'healthy' as const, latency:12 },
    { name:'Analytics Engine',   status: 'healthy' as const, latency:5 },
    { name:'Image Gen API',      status: chaos > 0.9 ? 'degraded' as const : 'healthy' as const, latency:18 },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="System Health" value="98.2" unit="%" accent="#10b981"/>
        <MetricCard label="Active Alerts" value={entropy > 0.8 ? 2 : 0} accent="#ef4444"/>
        <MetricCard label="Error Budget"  value="99.7" unit="%" accent="#f59e0b"/>
        <MetricCard label="MTTR"          value="4.2" unit="min" accent="var(--accent)"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Panel title="Service Health Checks">
          <div className="flex flex-col gap-2">
            {checks.map(c => (
              <div key={c.name} className="flex items-center justify-between p-2 bg-[var(--surface2)] rounded border border-[var(--border)]">
                <StatusBadge status={c.status} label={c.name} pulse/>
                <span className="text-[10px] text-[var(--muted)]">{c.latency}ms</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Stabilizer Diagnostics">
          <div className="flex flex-col gap-2">
            {stabilizers.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-[var(--surface2)] rounded border border-[var(--border)]">
                <StatusBadge status={s.active ? 'active' : 'idle'} label={s.name}/>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted)]">{(s.value*100).toFixed(0)}%</span>
                  <span className="text-[9px]" style={{color: s.value > s.threshold ? '#10b981' : '#ef4444'}}>
                    {s.value > s.threshold ? '✓' : '⚠'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Diagnostic Tools">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" loading={running} onClick={()=>{setRunning(true);setTimeout(()=>setRunning(false),2000)}}>Run Health Check</Button>
          <Button variant="secondary">Flush KV Cache</Button>
          <Button variant="secondary">Restart DO Instances</Button>
          <Button variant="secondary">Export Diagnostics</Button>
          <Button variant="danger">Force Recovery Mode</Button>
        </div>
      </Panel>
    </div>
  )
}
