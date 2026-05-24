import React, { useEffect } from 'react'
import { Radio, Globe, Clock, Activity } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { TimeSeriesChart } from '@components/charts/TimeSeriesChart'
import { LogFeed } from '@components/primitives/LogFeed'
import { useTelemetryStore } from '@state/telemetry'
import { useCFStore } from '@state/cloudflare'

export default function TelemetryConsole() {
  const tel = useTelemetryStore()
  const cf  = useCFStore()

  useEffect(() => {
    cf.connect()
    tel.startPolling()
    return () => tel.stopPolling()
  }, [])

  const latHistory = cf.history.map(s => ({ ts: s.timestamp, value: s.p50Lat }))
  const cfMeta     = tel.cfMeta as Record<string, string>

  const logs = tel.entries.slice(-50).map((e: { ts:number; region:string; path:string; status:number; latency:number }) => ({
    id:    `tel-${e.ts}-${e.path}`,
    ts:    e.ts,
    level: 'info' as const,
    msg:   `[${e.region}] ${e.path} ${e.status} · ${e.latency.toFixed(0)}ms · cpu ${cf.cpuMs.toFixed(1)}ms`,
  }))

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Radio size={14} className="text-emerald flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-emerald tracking-widest">TELEMETRY CONSOLE</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={cf.connected ? 'ok' : 'idle'} label={cf.connected ? `CF EDGE · ${cf.colo}` : 'LOCAL'}/>
          <StatusBadge status="ok" label={`${tel.entries.length} ENTRIES`}/>
        </div>
      </div>

      {/* KPIs */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="CF COLO"  value={cf.colo || '—'}      accent="emerald"/>
        <MetricCard label="P50 LAT"  value={`${cf.p50Lat || '—'}`} unit="ms" accent="cyan"/>
        <MetricCard label="P95 LAT"  value={`${cf.p95Lat || '—'}`} unit="ms" accent="amber"/>
        <MetricCard label="P99 LAT"  value={`${cf.p99Lat || '—'}`} unit="ms" accent="rose"/>
      </div>

      {/* Charts row */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="LATENCY TREND" accent="emerald" className="min-w-0">
          <TimeSeriesChart data={latHistory} unit="ms" accent="emerald" height={120}/>
        </Panel>
        <Panel title="CF REQUEST METADATA" accent="cyan" className="min-w-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {Object.entries(cfMeta).slice(0, 10).map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-2 min-w-0">
                <span className="oct-label text-muted flex-shrink-0">{String(k).toUpperCase()}</span>
                <span className="font-mono text-[9px] text-[var(--oct-text-primary)] truncate-safe text-right">{String(v)}</span>
              </div>
            ))}
            {Object.keys(cfMeta).length === 0 && (
              <span className="oct-label text-muted">Polling CF edge metadata…</span>
            )}
          </div>
        </Panel>
      </div>

      {/* Edge detail + log */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="EDGE METRICS" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label:'WALL MS',       value: `${cf.wallMs.toFixed(2)}ms`,              pct: Math.min(100, cf.wallMs/200*100),  accent:'violet' },
              { label:'CPU MS',        value: `${cf.cpuMs.toFixed(2)}ms`,               pct: Math.min(100, cf.cpuMs/50*100),    accent:'amber'  },
              { label:'BYTES IN',      value: `${(cf.bytesIn/1024).toFixed(1)}KB/s`,    pct: Math.min(100, cf.bytesIn/51200*100), accent:'cyan' },
              { label:'BYTES OUT',     value: `${(cf.bytesOut/1024).toFixed(1)}KB/s`,   pct: Math.min(100, cf.bytesOut/51200*100), accent:'emerald' },
              { label:'ACTIVE CONNS',  value: `${cf.activeConns}`,                       pct: Math.min(100, cf.activeConns/100*100), accent:'rose' },
              { label:'ERROR RATE',    value: `${(cf.errorRate*100).toFixed(2)}%`,       pct: Math.min(100, cf.errorRate*100),   accent:'rose' },
            ] as const).map(({ label, value, pct, accent }) => (
              <div key={label} className="flex flex-col gap-0.5 min-w-0">
                <div className="flex justify-between min-w-0">
                  <span className="oct-label text-muted">{label}</span>
                  <span className={`font-mono text-[9px] text-${accent}`}>{value}</span>
                </div>
                <ProgressBar value={pct} accent={accent as any}/>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="REQUEST LOG" accent="emerald" flex className="min-w-0">
          <LogFeed entries={logs} className="flex-1 min-h-0"/>
        </Panel>
      </div>

      {/* Region table */}
      {cf.edgeRegions.length > 0 && (
        <Panel title="EDGE REGION MAP" accent="amber" className="min-w-0">
          <div className="overflow-x-auto oct-scroll-x min-w-0">
            <table className="w-full text-[9px] font-mono min-w-[400px]">
              <thead>
                <tr className="border-b border-[var(--oct-border-subtle)]">
                  {['COLO','REGION','P50 LAT','REQ/S'].map(h => (
                    <th key={h} className="text-left py-1 pr-4 oct-label text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cf.edgeRegions.map(r => (
                  <tr key={r.colo} className="border-b border-[var(--oct-border-subtle)]/30 hover:bg-[var(--oct-surface-overlay)] transition-colors">
                    <td className="py-1 pr-4 text-cyan font-bold">{r.colo}</td>
                    <td className="py-1 pr-4 text-[var(--oct-text-secondary)]">{r.region}</td>
                    <td className="py-1 pr-4 text-amber">{r.latP50}ms</td>
                    <td className="py-1 pr-4 text-emerald">{(r.reqRate ?? 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}
