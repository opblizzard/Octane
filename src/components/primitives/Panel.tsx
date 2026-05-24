import { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  title?: string; subtitle?: string; accent?: string
  footer?: ReactNode; children: ReactNode
  className?: string; scrollable?: boolean; noPad?: boolean
}
export function Panel({ title, subtitle, accent='var(--accent)', footer, children, className, scrollable, noPad }: Props) {
  return (
    <div className={clsx('flex flex-col rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden', className)}
         style={{ boxShadow:`0 0 0 1px rgba(0,245,255,0.04)` }}>
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background:accent, boxShadow:`0 0 6px ${accent}` }} />
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color:accent }}>{title}</span>
          </div>
          {subtitle && <span className="text-[10px] text-[var(--muted)]">{subtitle}</span>}
        </div>
      )}
      <div className={clsx('flex-1 min-h-0', scrollable && 'overflow-y-auto', !noPad && 'p-3')}>
        {children}
      </div>
      {footer && <div className="px-3 py-2 border-t border-[var(--border)] shrink-0">{footer}</div>}
    </div>
  )
}
