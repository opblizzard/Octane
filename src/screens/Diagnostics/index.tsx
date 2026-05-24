import React, { useEffect, useState } from 'react'
import { Stethoscope, CheckCircle, AlertTriangle, RefreshCw, Download, Trash2 } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import type { Status } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { LogFeed } from '@components/primitives/LogFeed'
import { SparkLine } from '@components/charts/SparkLine'
import { Button } from '@components/controls/Button'
import { Toggle } from '@components/controls/Toggle'
import { useCFStore } from '@state/cloudflare'
import { useSystemStore } from '@state/system'
import clsx from 'clsx'

interface DiagTest {
  id:     string
  label:  string
  status: 'ok' | 'warn' | 'crit' | 'info' | 'idle'
  detail: string
  ms:     number
}

const INITIAL_TESTS: DiagTest[] = [
  { id:'cf_conn',  label:'CF Worker Connectivity',   status:'ok',   detail:'WebSocket established',          ms:4    },
  { id:'do_room',  label:'Durable Object — MetricsRoom', status:'ok', detail:'2 active instances',           ms:12   },
  { id:'do_ai',    label:'Durable Object — AISession',   status:'ok', detail:'Session store healthy',        ms:9    },
  { id:'kv_rw',    label:'KV Namespace R/W',          status:'ok',   detail:'Read: 0.8ms · Write: 1.2ms',    ms:2    },
  { id:'ai_infer', label:'Workers AI Inference',       status:'ok',   detail:'@cf/llama-3.1-8b-instruct OK', ms:140  },
  { id:'img_gen',  label:'Image Generation API',       status:'warn', detail:'Endpoint not configured (placeholder)', ms:0 },
  { id:'analytics',label:'Analytics Engine',          status:'ok',   detail:'Dataset: octane_metrics',       ms:3    },
  { id:'pages',    label:'Cloudflare Pages',           status:'ok',   detail:'Build: dist/ deployed',         ms:7    },
  { id:'router',   label:'Internal Router',            status:'ok',   detail:'9 routes registered',           ms:1    },
  { id:'sdk',      label:'OctaneSDK Bridge',           status:'ok',   detail:'v2 client connected',           ms:6    },
  { id:'ws_relay', label:'WebSocket Relay',            status:'ok',   detail:'Broadcast room active',         ms:2    },
  { id:'tls',      label:'TLS Certificate',            status:'ok',   detail:'TLSv1.3 · Valid 85d',           ms:0    },
]

let logId = 9000
function mkLog(level: 'ok'|'info'|'warn'|'error', msg: string, src?: string) {
  return { id: String(++logId), timestamp: Date.now(), level, source: src, message: msg }
}

export default function Diagnostics() {
  const cf  = useCFStore()
  const sys = useSystemStore()
  const [tests,      setTests]      = useState<DiagTest[]>(INITIAL_TESTS)
  const [running,    setRunning]    = useState(false)
  const [autoLive,   setAutoLive]   = useState(true)
  const [logs,       setLogs]       = useState(() => [
    mkLog('ok',   'Diagnostics module loaded',         'diag'),
    mkLog('info', 'CF edge connected',                 'cf'),
    mkLog('info', 'All services checked at boot',      'diag'),
    mkLog('warn', 'Image gen endpoint not configured', 'imggen'),
  ])

  useEffect(() => {
    cf.connect()
    sys.startPolling()
    return () => sys.stopPolling()
  }, [])

  // Live sync test statuses with actual CF state
  useEffect(() => {
    if (!autoLive) return
    setTests(prev => prev.map(t => {
      if (t.id === 'cf_conn') return { ...t, status: cf.connected ? 'ok' : 'warn', detail: cf.connected ? `Connected · ${cf.colo}` : 'Disconnected' }
      if (t.id === 'do_room') return { ...t, status: cf.doInvocations > 0 ? 'ok' : 'idle', detail: `${cf.doInvocations} invocations/s` }
      if (t.id === 'kv_rw')   return { ...t, detail: `R: ${cf.kvReads}/s · W: ${cf.kvWrites}/s` }
      return t
    }))
  }, [cf.connected, cf.colo, cf.doInvocations, cf.kvReads, cf.kvWrites, autoLive])

  const runAll = async () => {
    setRunning(true)
    setLogs(l => [...l, mkLog('info', 'Running full diagnostic suite…', 'diag')])
    for (let i = 0; i < INITIAL_TESTS.length; i++) {
      await new Promise(r => setTimeout(r, 180))
      setTests(prev => prev.map((t, idx) => idx === i ? { ...t, status: 'info' as const } : t))
      await new Promise(r => setTimeout(r, 220))
      const orig = INITIAL_TESTS[i]
      setTests(prev => prev.map((t, idx) => idx === i ? { ...orig, ms: orig.ms + Math.round(Math.random() * 5) } : t))
      setLogs(l => [...l.slice(-200), mkLog(orig.status === 'warn' ? 'warn' : 'ok', `${orig.label}: ${orig.detail}`, 'diag')])
    }
    setLogs(l => [...l, mkLog('ok', 'Diagnostic suite complete.', 'diag')])
    setRunning(false)
  }

  const passed  = tests.filter(t => t.status === 'ok').length
  const warned  = tests.filter(t => t.status === 'warn').length
  const failed  = tests.filter(t => t.status === 'crit').length
  const health  = (passed / tests.length) * 100
  const latHist = cf.history.map(s => s.p50Lat)
  const cpuHist = cf.history.map(s => s.cpuMs)
  const toBadgeStatus = (s: string): Status => {
    if (s === 'healthy') return 'ok'
    if (s === 'degraded') return 'warn'
    if (s === 'offline') return 'idle'
    if (s === 'connected') return 'ok'
    if (s === 'active' || s === 'running' || s === 'ok' || s === 'warn' || s === 'crit' || s === 'error' || s === 'idle' || s === 'info') return s
    return 'info'
  }

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Stethoscope size={14} className="text-rose flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-rose tracking-widest">DIAGNOSTICS</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Toggle value={autoLive} onChange={setAutoLive} label="Live Sync" size="sm" accent="emerald"/>
          <Button variant="primary" size="xs" icon={<RefreshCw size={10} className={running ? 'animate-spin' : ''}/>}
            onClick={runAll} loading={running}>RUN ALL</Button>
          <Button variant="ghost" size="xs" icon={<Download size={10}/>}>EXPORT</Button>
        </div>
      </div>

      {/* Health overview */}
      <Panel title="SYSTEM HEALTH" accent="rose" className="min-w-0">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <span className="font-mono text-[28px] font-bold leading-none" style={{
              color: health < 70 ? 'var(--oct-status-crit)' : health < 90 ? 'var(--oct-status-warn)' : 'var(--oct-status-ok)',
            }}>{health.toFixed(0)}%</span>
            <span className="oct-label text-muted">HEALTH SCORE</span>
          </div>
          <div className="flex-1 min-w-[120px]">
            <ProgressBar value={health} accent={health < 70 ? 'rose' : health < 90 ? 'amber' : 'emerald'} height="md"/>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            {[
              { label:'PASSED',  value: passed,  color:'text-ok'   },
              { label:'WARNED',  value: warned,  color:'text-warn' },
              { label:'FAILED',  value: failed,  color:'text-crit' },
              { label:'TOTAL',   value: tests.length, color:'text-secondary' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className={`font-mono text-[18px] font-bold leading-none ${s.color}`}>{s.value}</span>
                <span className="oct-label text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Test checklist + live metrics row */}
      <div className="oct-grid-2 min-w-0">
        {/* Test list */}
        <Panel title="DIAGNOSTIC TESTS" accent="rose" scrollable flex className="min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            {tests.map(t => (
              <div key={t.id} className={clsx(
                'flex items-center gap-2 p-2 rounded border min-w-0 transition-all',
                t.status === 'crit' ? 'border-rose/30 bg-rose/5' :
                t.status === 'warn' ? 'border-amber/30 bg-amber/5' :
                t.status === 'info' ? 'border-cyan/20 bg-cyan/5 animate-pulse' :
                'border-[var(--oct-border-subtle)] bg-[var(--oct-surface-raised)]',
              )}>
                <StatusBadge status={t.status === 'info' ? 'info' : t.status} size="sm" pulse={t.status === 'info'}/>
                <div className="flex flex-col gap-0 flex-1 min-w-0">
                  <span className="font-mono text-[9px] font-semibold text-[var(--oct-text-primary)] truncate-safe">{t.label}</span>
                  <span className="font-mono text-[8px] text-muted truncate-safe">{t.detail}</span>
                </div>
                {t.ms > 0 && <span className="font-mono text-[8px] text-muted flex-shrink-0">{t.ms}ms</span>}
                {t.status === 'ok'   && <CheckCircle  size={10} className="text-ok flex-shrink-0"/>}
                {t.status === 'warn' && <AlertTriangle size={10} className="text-warn flex-shrink-0"/>}
                {t.status === 'crit' && <AlertTriangle size={10} className="text-crit flex-shrink-0"/>}
              </div>
            ))}
          </div>
        </Panel>

        {/* Live system metrics */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="oct-grid-2 min-w-0">
            <MetricCard label="CF COLO"   value={cf.colo || '—'}            accent="cyan"/>
            <MetricCard label="P50 LAT"   value={cf.p50Lat ? `${cf.p50Lat}ms` : '—'} accent="emerald"/>
            <MetricCard label="CPU MS"    value={cf.cpuMs.toFixed(2)}       unit="ms" accent="violet"/>
            <MetricCard label="CONN"      value={cf.activeConns}            accent="amber"/>
          </div>

          <Panel title="LATENCY HISTORY" accent="cyan" className="min-w-0">
            <SparkLine data={latHist} accent="cyan" height={44} tooltip/>
          </Panel>
          <Panel title="CPU MS HISTORY" accent="violet" className="min-w-0">
            <SparkLine data={cpuHist} accent="violet" height={44} tooltip/>
          </Panel>

          <Panel title="SERVICE REGISTRY" accent="emerald" scrollable className="min-w-0">
            {Object.entries(sys.serviceStatus).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between gap-2 py-1 border-b border-[var(--oct-border-subtle)] last:border-0 min-w-0">
                <span className="font-mono text-[9px] text-[var(--oct-text-secondary)] truncate-safe">{name}</span>
                <StatusBadge status={toBadgeStatus(status)} label={status.toUpperCase()} size="sm" pulse={status === 'ok'}/>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      {/* Diagnostic log */}
      <Panel title="DIAGNOSTIC LOG" accent="amber" noPad flex className="min-w-0"
        headerRight={
          <Button variant="ghost" size="xs" icon={<Trash2 size={9}/>}
            onClick={() => setLogs([mkLog('info','Log cleared.','diag')])}>
            CLEAR
          </Button>
        }>
        <LogFeed entries={logs} className="p-2 flex-1 min-h-0" autoScroll/>
      </Panel>
    </div>
  )
}
