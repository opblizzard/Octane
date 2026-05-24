import React from 'react'
import { useAIStore } from '@state/ai'
import { useSystemStore } from '@state/system'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { BarMeter } from '@components/charts/BarMeter'

export function AIModules() {
  const messages      = useAIStore(s => s.messages)
  const contextWindow = useAIStore(s => s.contextWindow)
  const maxContext    = useAIStore(s => s.maxContext)
  const model         = useAIStore(s => s.model)
  const status        = useAIStore(s => s.status)
  const cfMetrics     = useSystemStore(s => s.cfMetrics)

  const msgCount      = messages.filter(m => m.role !== 'system').length
  const ctxPct        = contextWindow / maxContext

  const connStatus: 'ok' | 'warn' | 'crit' | 'idle' =
    status === 'connected'  ? 'ok'
    : status === 'connecting' ? 'warn'
    : status === 'error'      ? 'crit'
    : 'idle'

  return (
    <div className="flex flex-col gap-3">
      {/* Connection status */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-md" style={{ background: 'var(--oct-surface-raised)', border: '1px solid var(--oct-border-subtle)' }}>
        <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>Connection</p>
        <StatusBadge status={connStatus} label={status.toUpperCase()} pulse={status === 'connecting'} />
        <p className="text-[9px] font-mono truncate" style={{ color: 'var(--oct-text-muted)' }}>
          {model.split('/').pop()}
        </p>
      </div>

      {/* Context window */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-md" style={{ background: 'var(--oct-surface-raised)', border: '1px solid var(--oct-border-subtle)' }}>
        <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>Context Window</p>
        <BarMeter
          value={ctxPct}
          orientation="horizontal"
          height={6}
          width="100%"
          accent={ctxPct > 0.8 ? 'rose' : 'cyan'}
          showValue
        />
        <p className="text-[9px] font-mono" style={{ color: 'var(--oct-text-muted)' }}>
          ~{contextWindow.toLocaleString()} / {maxContext.toLocaleString()} tokens
        </p>
      </div>

      {/* Session stats */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-md" style={{ background: 'var(--oct-surface-raised)', border: '1px solid var(--oct-border-subtle)' }}>
        <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>Session</p>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Messages" value={String(msgCount)} />
          <Stat label="Edge" value={cfMetrics.colo} />
          <Stat label="Latency" value={`${cfMetrics.latencyMs.toFixed(0)}ms`} />
          <Stat label="CPU" value={`${cfMetrics.cpuTimeMs.toFixed(1)}ms`} />
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-md" style={{ background: 'var(--oct-surface-raised)', border: '1px solid var(--oct-border-subtle)' }}>
        <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>Ion AI Capabilities</p>
        {['Edge Metrics Analysis', 'Code Debugging', 'System Diagnostics', 'Real-time Telemetry', 'Markdown Responses'].map(cap => (
          <div key={cap} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--oct-status-ok)' }} />
            <span className="text-[10px]" style={{ color: 'var(--oct-text-secondary)' }}>{cap}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase" style={{ color: 'var(--oct-text-muted)' }}>{label}</span>
      <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--oct-accent-cyan)' }}>{value}</span>
    </div>
  )
}
