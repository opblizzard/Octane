import React, { useEffect } from 'react'
import { Activity, Cpu, Globe, Zap, Database, Radio, AlertTriangle } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import type { Status } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { TimeSeriesChart } from '@components/charts/TimeSeriesChart'
import { SparkLine } from '@components/charts/SparkLine'
import { useCFStore } from '@state/cloudflare'
import { useSystemStore } from '@state/system'

export default function SystemOverview() {
    const toBadgeStatus = (s: string): Status => {
      if (s === 'healthy') return 'ok'
      if (s === 'degraded') return 'warn'
      if (s === 'offline') return 'idle'
      if (s === 'connected') return 'ok'
      if (s === 'active' || s === 'running' || s === 'ok' || s === 'warn' || s === 'crit' || s === 'error' || s === 'idle' || s === 'info') return s
      return 'info'
    }
  const cf = useCFStore()
  const sys = useSystemStore()

  useEffect(() => {
    cf.connect()
    sys.startPolling()
    return () => sys.stopPolling()
  }, [])

  const latHistory  = cf.history.map(s => ({ ts: s.timestamp, value: s.p50Lat }))
  const reqHistory  = cf.history.map(s => ({ ts: s.timestamp, value: s.reqPerSec }))
  const errHistory  = cf.history.map(s => ({ ts: s.timestamp, value: s.errorRate * 100 }))
  const cpuHistory  = cf.history.map(s => ({ ts: s.timestamp, value: s.cpuMs }))

  const errPct   = cf.errorRate * 100
  const memMB    = cf.memBytes / 1024 / 1024
  const bwKBs    = (cf.bytesIn + cf.bytesOut) / 1024

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={14} className="text-cyan flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-cyan tracking-widest truncate-safe">SYSTEM OVERVIEW</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={cf.connected ? 'ok' : 'idle'} label={cf.connected ? `CF · ${cf.colo}` : 'LOCAL'}/>
          <StatusBadge status={errPct > 5 ? 'crit' : errPct > 1 ? 'warn' : 'ok'} label={`ERR ${errPct.toFixed(1)}%`}/>
        </div>
      </div>

      {/* Top KPI row */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="P50 LATENCY" value={cf.p50Lat ? `${cf.p50Lat}` : '—'} unit="ms" accent="cyan"
          trend={latHistory.length > 1 ? (cf.p50Lat > latHistory[latHistory.length-2]?.value ? 'up' : 'down') : undefined}/>
        <MetricCard label="REQ / SEC"   value={cf.reqPerSec.toFixed(1)} unit="rps" accent="amber"/>
        <MetricCard label="CPU TIME"    value={cf.cpuMs.toFixed(1)} unit="ms" accent="violet"/>
        <MetricCard label="ACTIVE CONN" value={cf.activeConns} accent="emerald"/>
      </div>

      {/* Charts row */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="LATENCY TREND (P50)" accent="cyan" className="min-w-0">
          <TimeSeriesChart data={latHistory} unit="ms" accent="cyan" height={120}/>
        </Panel>
        <Panel title="REQUESTS / SEC" accent="amber" className="min-w-0">
          <TimeSeriesChart data={reqHistory} unit="rps" accent="amber" height={120}/>
        </Panel>
      </div>

      {/* Edge metrics row */}
      <div className="oct-grid-3 min-w-0">
        <Panel title="EDGE PERFORMANCE" accent="cyan" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label:'P50 LAT', value:`${cf.p50Lat}ms`, accent:'var(--oct-accent-cyan)' },
              { label:'P95 LAT', value:`${cf.p95Lat}ms`, accent:'var(--oct-accent-amber)' },
              { label:'P99 LAT', value:`${cf.p99Lat}ms`, accent:'var(--oct-status-crit)' },
              { label:'WALL MS', value:`${cf.wallMs.toFixed(1)}ms` },
              { label:'CPU MS',  value:`${cf.cpuMs.toFixed(1)}ms` },
            ]).map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between gap-2 min-w-0">
                <span className="oct-label text-muted">{label}</span>
                <span className="font-mono text-[10px] font-bold flex-shrink-0" style={accent ? { color: accent } : undefined}>{value}</span>
              </div>
            ))}
            <SparkLine data={latHistory.map(d => d.value)} accent="cyan" height={32}/>
          </div>
        </Panel>

        <Panel title="BANDWIDTH" accent="emerald" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label:'BYTES IN',  value:`${(cf.bytesIn/1024).toFixed(1)} KB/s`,  pct: Math.min(100, cf.bytesIn/10240*100) },
              { label:'BYTES OUT', value:`${(cf.bytesOut/1024).toFixed(1)} KB/s`, pct: Math.min(100, cf.bytesOut/10240*100) },
              { label:'TOTAL BW',  value:`${bwKBs.toFixed(1)} KB/s`,              pct: Math.min(100, bwKBs/20480*100) },
            ] as const).map(({ label, value, pct }) => (
              <div key={label} className="flex flex-col gap-0.5 min-w-0">
                <div className="flex justify-between">
                  <span className="oct-label text-muted">{label}</span>
                  <span className="font-mono text-[9px] text-emerald">{value}</span>
                </div>
                <ProgressBar value={pct} accent="emerald"/>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--oct-border-subtle)]">
              <span className="oct-label text-muted">MEM</span>
              <span className="font-mono text-[10px] text-violet">{memMB.toFixed(1)} MB</span>
            </div>
            <ProgressBar value={Math.min(100, memMB / 128 * 100)} accent="violet"/>
          </div>
        </Panel>

        <Panel title="EDGE REGIONS" accent="violet" className="min-w-0">
          {cf.edgeRegions.length === 0 ? (
            <div className="flex flex-col gap-2 min-w-0">
              {sys.serviceStatus && Object.entries(sys.serviceStatus).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="oct-label text-muted truncate-safe">{name}</span>
                  <StatusBadge status={toBadgeStatus(status)} label={status.toUpperCase()}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 min-w-0">
              {cf.edgeRegions.slice(0,6).map(r => (
                <div key={r.colo} className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <Globe size={8} className="text-violet flex-shrink-0"/>
                    <span className="oct-label font-bold flex-shrink-0">{r.colo}</span>
                    <span className="oct-label text-muted truncate-safe">{r.region}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[8px] text-amber">{r.latP50}ms</span>
                    <span className="font-mono text-[8px] text-cyan">{(r.reqRate ?? 0).toFixed(0)}rps</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* CF infra row */}
      <div className="oct-grid-4 min-w-0">
        <Panel title="KV STORE" accent="amber" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between"><span className="oct-label text-muted">READS</span><span className="font-mono text-[10px] text-cyan">{cf.kvReads}</span></div>
            <div className="flex justify-between"><span className="oct-label text-muted">WRITES</span><span className="font-mono text-[10px] text-amber">{cf.kvWrites}</span></div>
            <SparkLine data={cpuHistory.map(d => d.value)} accent="amber" height={24}/>
          </div>
        </Panel>
        <Panel title="DURABLE OBJECTS" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between"><span className="oct-label text-muted">INVOCATIONS</span><span className="font-mono text-[10px] text-violet">{cf.doInvocations}</span></div>
            <div className="flex justify-between"><span className="oct-label text-muted">ACTIVE</span><span className="font-mono text-[10px] text-emerald">2</span></div>
          </div>
        </Panel>
        <Panel title="ERROR RATE" accent="rose" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[16px] font-bold" style={{ color: errPct > 1 ? 'var(--oct-status-crit)' : 'var(--oct-status-ok)' }}>
              {errPct.toFixed(2)}%
            </span>
            <SparkLine data={errHistory.map(d => d.value)} accent="rose" height={24}/>
          </div>
        </Panel>
        <Panel title="REQUESTS TOTAL" accent="cyan" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[16px] font-bold text-cyan">{cf.reqPerSec.toFixed(1)}<span className="text-[10px] text-muted ml-1">rps</span></span>
            <SparkLine data={reqHistory.map(d => d.value)} accent="cyan" height={24}/>
          </div>
        </Panel>
      </div>
    </div>
  )
}
