import React from 'react'
import { useImageGenStore } from '@state/imagegen'
import type { RenderPhase } from '@state/imagegen'

const PHASES: { id: RenderPhase; label: string }[] = [
  { id: 'queued',   label: 'Queue'   },
  { id: 'encoding', label: 'Encode'  },
  { id: 'sampling', label: 'Sample'  },
  { id: 'decoding', label: 'Decode'  },
  { id: 'done',     label: 'Done'    },
]

const phaseOrder: Record<RenderPhase, number> = {
  idle: -1, queued: 0, encoding: 1, sampling: 2, diffusing: 2, decoding: 3, upscaling: 4, done: 5, complete: 5, error: -1,
}

export function RenderMeter() {
  const renderPhase    = useImageGenStore(s => s.renderPhase)
  const renderProgress = useImageGenStore(s => s.renderProgress)
  const renderMsg      = useImageGenStore(s => s.renderMsg)
  const isGenerating   = useImageGenStore(s => s.isGenerating)

  const currentIdx = phaseOrder[renderPhase] ?? -1
  const isError    = renderPhase === 'error'

  return (
    <div className="flex flex-col gap-2">
      {/* Phase indicators */}
      <div className="flex items-center gap-1">
        {PHASES.map(({ id, label }, i) => {
          const done    = phaseOrder[id] < currentIdx
          const active  = id === renderPhase
          const pending = phaseOrder[id] > currentIdx || currentIdx === -1

          const bg = isError ? 'var(--oct-status-crit)22'
            : done   ? 'var(--oct-status-ok)22'
            : active ? 'var(--oct-accent-cyan)22'
            : 'var(--oct-surface-raised)'

          const border = isError ? 'var(--oct-status-crit)66'
            : done   ? 'var(--oct-status-ok)66'
            : active ? 'var(--oct-accent-cyan)66'
            : 'var(--oct-border-subtle)'

          const color = isError ? 'var(--oct-status-crit)'
            : done   ? 'var(--oct-status-ok)'
            : active ? 'var(--oct-accent-cyan)'
            : 'var(--oct-text-muted)'

          return (
            <React.Fragment key={id}>
              <div
                className="flex-1 text-center rounded py-1"
                style={{ background: bg, border: `1px solid ${border}`, color, fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}
              >
                {done ? '✓' : active ? '●' : '○'} {label}
              </div>
              {i < PHASES.length - 1 && (
                <div className="w-3 h-[1px]" style={{ background: done || active ? 'var(--oct-accent-cyan)44' : 'var(--oct-border-subtle)' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'var(--oct-surface-raised)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:      `${Math.round(renderProgress * 100)}%`,
            background: isError ? 'var(--oct-status-crit)' : 'var(--oct-accent-cyan)',
          }}
        />
      </div>

      {/* Status message */}
      <p className="text-[10px] font-mono text-center" style={{ color: isError ? 'var(--oct-status-crit)' : 'var(--oct-text-muted)' }}>
        {renderMsg || (isGenerating ? 'Processing…' : 'Ready')}
      </p>
    </div>
  )
}
