import React from 'react'

export interface SignalPathNode {
  id:      string
  label:   string
  active?: boolean
  accent?: 'cyan' | 'amber' | 'violet' | 'rose' | 'emerald'
}

interface SignalPathProps {
  nodes:    SignalPathNode[]
  vertical?: boolean
  className?: string
}

const accentVar: Record<string, string> = {
  cyan:    'var(--oct-accent-cyan)',
  amber:   'var(--oct-accent-amber)',
  violet:  'var(--oct-accent-violet)',
  rose:    'var(--oct-accent-rose)',
  emerald: 'var(--oct-accent-emerald)',
}

export function SignalPath({ nodes, vertical = false, className }: SignalPathProps) {
  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-0 ${className ?? ''}`}>
      {nodes.map((node, i) => {
        const c = accentVar[node.accent ?? 'cyan']
        return (
          <React.Fragment key={node.id}>
            {i > 0 && (
              <div
                className={vertical ? 'w-[1px] h-4' : 'h-[1px] w-6 flex-shrink-0'}
                style={{ background: nodes[i - 1].active && node.active ? c : 'var(--oct-border-subtle)' }}
              />
            )}
            <div
              className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wide flex-shrink-0"
              style={{
                background: node.active ? `${c}18` : 'var(--oct-surface-raised)',
                border:     `1px solid ${node.active ? c + '66' : 'var(--oct-border-subtle)'}`,
                color:      node.active ? c : 'var(--oct-text-muted)',
              }}
            >
              {node.label}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
