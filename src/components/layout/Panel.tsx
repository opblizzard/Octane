import React from 'react'
import { clsx } from 'clsx'

interface PanelProps {
  title?:       string
  headerRight?: React.ReactNode
  footer?:      React.ReactNode
  children:     React.ReactNode
  className?:   string
  accent?:      'cyan' | 'amber' | 'violet' | 'rose' | 'emerald'
  noPad?:       boolean
  scrollable?:  boolean
  flex?:        boolean
  style?:       React.CSSProperties
}

const accentMap: Record<string, string> = {
  cyan:    'border-[var(--oct-accent-cyan)] shadow-[0_0_12px_1px_var(--oct-accent-cyan)22]',
  amber:   'border-[var(--oct-accent-amber)] shadow-[0_0_12px_1px_var(--oct-accent-amber)22]',
  violet:  'border-[var(--oct-accent-violet)] shadow-[0_0_12px_1px_var(--oct-accent-violet)22]',
  rose:    'border-[var(--oct-accent-rose)] shadow-[0_0_12px_1px_var(--oct-accent-rose)22]',
  emerald: 'border-[var(--oct-accent-emerald)] shadow-[0_0_12px_1px_var(--oct-accent-emerald)22]',
}

export function Panel({ title, headerRight, footer, children, className, accent, noPad, scrollable, flex, style }: PanelProps) {
  return (
    <div
      style={style}
      className={clsx(
        'oct-panel flex flex-col rounded-md border',
        flex && 'flex-1',
        accent ? accentMap[accent] : 'border-[var(--oct-border-subtle)]',
        className,
      )}
    >
      {title && (
        <div className="oct-panel-header flex items-center justify-between min-h-[38px] px-3 py-1.5 border-b border-[var(--oct-border-subtle)] flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--oct-text-secondary)] truncate-safe">
            {title}
          </span>
          {headerRight && (
            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0 flex-wrap justify-end">
              {headerRight}
            </div>
          )}
        </div>
      )}

      <div
        className={clsx(
          'flex-1 min-h-0',
          !noPad && 'p-3',
          scrollable && 'oct-scroll',
        )}
      >
        {children}
      </div>

      {footer && (
        <div className="px-3 py-1.5 border-t border-[var(--oct-border-subtle)] flex-shrink-0">
          {footer}
        </div>
      )}
    </div>
  )
}
