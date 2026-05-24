import React from 'react'
import { clsx } from 'clsx'

export type ConnectorStatus = 'ok' | 'warn' | 'crit' | 'idle'

interface ConnectorNodeProps {
  label:      string
  status?:    'ok' | 'warn' | 'crit' | 'idle'
  accent?:    'cyan' | 'amber' | 'violet' | 'rose' | 'emerald'
  icon?:      React.ReactNode
  value?:     string | number
  className?: string
  pulse?:     boolean
}

const accentVar: Record<string, string> = {
  cyan:    'var(--oct-accent-cyan)',
  amber:   'var(--oct-accent-amber)',
  violet:  'var(--oct-accent-violet)',
  rose:    'var(--oct-accent-rose)',
  emerald: 'var(--oct-accent-emerald)',
}

const statusVar: Record<string, string> = {
  ok:   'var(--oct-status-ok)',
  warn: 'var(--oct-status-warn)',
  crit: 'var(--oct-status-crit)',
  idle: 'var(--oct-status-idle)',
}

export function ConnectorNode({ label, status, accent = 'cyan', icon, value, className, pulse }: ConnectorNodeProps) {
  const c = status ? statusVar[status] : accentVar[accent]
  return (
    <div
      className={clsx('flex flex-col items-center gap-1.5 p-2 rounded-md', className)}
      style={{ border: `1px solid ${c}44`, background: `${c}08` }}
    >
      {/* Indicator */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full"
        style={{ border: `1.5px solid ${c}66`, background: `${c}12` }}>
        {icon || <div className="w-2 h-2 rounded-full" style={{ background: c }} />}
        <span
          className={clsx('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full', pulse && 'animate-pulse')}
          style={{ background: status ? statusVar[status] : c, border: '1px solid var(--oct-surface-panel)' }}
        />
      </div>
      <span className="text-[9px] uppercase tracking-wide text-center leading-tight"
        style={{ color: 'var(--oct-text-muted)' }}>
        {label}
      </span>
      {value !== undefined && (
        <span className="text-[10px] font-mono" style={{ color: c }}>{value}</span>
      )}
    </div>
  )
}
