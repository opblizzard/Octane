import React, { useEffect } from 'react'
import { Shield, Bell, Server, AlertTriangle, CheckCircle } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { SparkLine } from '@components/charts/SparkLine'
import { useOperatorStore } from '@state/operator'
import { useCFStore } from '@state/cloudflare'
import clsx from 'clsx'

const alertColors = { info: 'text-cyan', warn: 'text-amber', crit: 'text-rose' }
const alertIcons  = { info: CheckCircle, warn: AlertTriangle, crit: AlertTriangle }

export default function OperatorDashboard() {
  const op = useOperatorStore()
  const cf = useCFStore()

  useEffect(() => {
    cf.connect()
    op.startPolling()
    return () => op.stopPolling()
  }, [])

  const unacked = op.alerts.filter(a => !a.acked)

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={14} className="text-violet flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-violet tracking-widest">OPERATOR DASHBOARD</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={cf.connected ? 'ok' : 'idle'} label={`CF · ${cf.colo || '—'}`}/>
          <StatusBadge status={unacked.some(a => a.level === 'crit') ? 'crit' : unacked.some(a => a.level === 'warn') ? 'warn' : 'ok'}
            label={`${unacked.length} ALERTS`}/>
        </div>
      </div>

      {/* Deploy info */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="DEPLOY ID"  value={op.deployId.toUpperCase()} accent="violet"/>
        <MetricCard label="WORKERS"    value={op.workers.length} accent="cyan"/>
        <MetricCard label="REQ / SEC"  value={op.globalReqSec.toFixed(1)} unit="rps" accent="amber"/>
        <MetricCard label="ERROR %"    value={op.globalErrPct.toFixed(2)} unit="%" accent="rose"
          trend={op.globalErrPct > 1 ? 'up' : 'flat'}/>
      </div>

      {/* Worker instances + alerts row */}
      <div className="oct-grid-2 min-w-0">
        {/* Worker instances */}
        <Panel title="WORKER INSTANCES" accent="cyan" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {op.workers.map(wk => (
              <div key={wk.id} className="flex flex-col gap-1.5 p-2 rounded border border-[var(--oct-border-subtle)] bg-[var(--oct-surface-raised)] min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Server size={10} className="text-cyan flex-shrink-0"/>
                    <span className="oct-label font-bold truncate-safe">{wk.id.toUpperCase()}</span>
                    <span className="oct-label text-muted flex-shrink-0">{wk.colo}</span>
                  </div>
                  <StatusBadge status={wk.status === 'active' ? 'ok' : wk.status === 'draining' ? 'warn' : 'idle'}
                    label={wk.status.toUpperCase()}/>
                </div>
                <div className="grid grid-cols-3 gap-2 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="oct-label text-muted">CPU</span>
                    <ProgressBar value={wk.cpu} accent={wk.cpu > 80 ? 'rose' : 'cyan'}/>
                    <span className="font-mono text-[7px] text-cyan">{wk.cpu.toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="oct-label text-muted">MEM</span>
                    <ProgressBar value={wk.mem} accent="violet"/>
                    <span className="font-mono text-[7px] text-violet">{wk.mem.toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="oct-label text-muted">REQ/S</span>
                    <span className="font-mono text-[9px] text-amber">{wk.req}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Alerts */}
        <Panel title="ALERT FEED" accent="rose" flex className="min-w-0">
          <div className="flex flex-col gap-1 flex-1 overflow-y-auto oct-scroll min-w-0">
            {op.alerts.length === 0 && (
              <span className="oct-label text-muted">No alerts.</span>
            )}
            {[...op.alerts].reverse().map(alert => {
              const Icon = alertIcons[alert.level]
              return (
                <div key={alert.id} className={clsx(
                  'flex items-start gap-1.5 p-1.5 rounded border transition-opacity min-w-0',
                  alert.acked ? 'opacity-30 border-[var(--oct-border-subtle)]' :
                    alert.level === 'crit' ? 'border-[var(--oct-status-crit)]/30 bg-[color:var(--oct-status-crit)]/5' :
                    alert.level === 'warn' ? 'border-[var(--oct-status-warn)]/30 bg-[color:var(--oct-status-warn)]/5' :
                    'border-[var(--oct-border-subtle)] bg-[var(--oct-surface-raised)]',
                )}>
                  <Icon size={9} className={clsx('flex-shrink-0 mt-0.5', alertColors[alert.level])}/>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className={clsx('font-mono text-[9px] truncate-safe', alertColors[alert.level])}>
                      {alert.message}
                    </span>
                    <span className="font-mono text-[7px] text-muted">
                      {new Date(alert.ts).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                  {!alert.acked && (
                    <button onClick={() => op.ackAlert(alert.id)}
                      className="flex-shrink-0 text-[7px] font-mono text-muted hover:text-cyan transition-colors px-1">
                      ACK
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={op.clearAcked}
            className="mt-1 oct-label text-muted hover:text-rose transition-colors self-end">
            CLEAR ACKED
          </button>
        </Panel>
      </div>

      {/* CF infra detail row */}
      <div className="oct-grid-3 min-w-0">
        <Panel title="CF PLAN / BUILD" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            {([
              { label:'PLAN',      value: op.cfPlan },
              { label:'GIT SHA',   value: op.gitSha },
              { label:'BUILD',     value: new Date(op.buildTime).toLocaleString() },
              { label:'DO COUNT',  value: String(op.doCount) },
              { label:'KV USAGE',  value: `${op.kvUsagePct.toFixed(1)}%` },
            ] as const).map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2 min-w-0">
                <span className="oct-label text-muted flex-shrink-0">{label}</span>
                <span className="font-mono text-[9px] text-[var(--oct-text-primary)] truncate-safe text-right">{value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="GLOBAL HEALTH" accent="emerald" className="min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="oct-label text-muted">REQ/S</span>
              <span className="font-mono text-[10px] text-emerald">{op.globalReqSec.toFixed(1)}</span>
            </div>
            <ProgressBar value={Math.min(100, op.globalReqSec / 1000 * 100)} accent="emerald"/>
            <div className="flex justify-between items-center">
              <span className="oct-label text-muted">ERROR %</span>
              <span className="font-mono text-[10px]" style={{ color: op.globalErrPct > 1 ? 'var(--oct-status-crit)' : 'var(--oct-status-ok)' }}>
                {op.globalErrPct.toFixed(2)}%
              </span>
            </div>
            <ProgressBar value={Math.min(100, op.globalErrPct * 10)} accent={op.globalErrPct > 1 ? 'rose' : 'emerald'}/>
            <div className="flex justify-between items-center">
              <span className="oct-label text-muted">P50 LAT</span>
              <span className="font-mono text-[10px] text-cyan">{cf.p50Lat || '—'}ms</span>
            </div>
          </div>
        </Panel>

        <Panel title="QUICK ACTIONS" accent="amber" className="min-w-0">
          <div className="flex flex-col gap-1.5">
            {([
              { label: 'Flush KV Cache',   accent: 'amber' },
              { label: 'Reset DO State',   accent: 'rose'  },
              { label: 'Redeploy Worker',  accent: 'cyan'  },
              { label: 'Export Metrics',   accent: 'violet'},
              { label: 'Clear Alert Log',  accent: 'emerald'},
            ] as const).map(({ label, accent }) => (
              <button key={label}
                onClick={() => op.alerts.length > 0 && op.clearAcked()}
                className={`w-full text-left px-2 py-1 rounded border border-[var(--oct-border-subtle)]
                  bg-[var(--oct-surface-raised)] font-mono text-[9px] text-muted
                  hover:border-[var(--oct-accent-${accent})] hover:text-${accent} transition-colors`}>
                ▸ {label}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
