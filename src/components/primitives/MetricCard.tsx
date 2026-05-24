import clsx from 'clsx'
interface Props { label:string; value:string|number; unit?:string; trend?:'up'|'down'|'flat'; sub?:string; accent?:string; className?:string }
export function MetricCard({ label, value, unit, trend, sub, accent='var(--accent)', className }: Props) {
  return (
    <div className={clsx('bg-[var(--surface2)] border border-[var(--border)] rounded-md p-3 flex flex-col gap-1', className)}>
      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold" style={{ color:accent }}>{value}</span>
        {unit && <span className="text-[10px] text-[var(--muted)]">{unit}</span>}
        {trend && <span className={clsx('text-[10px] ml-auto', trend==='up'?'text-[#10b981]':trend==='down'?'text-[#ef4444]':'text-[var(--muted)]')}>
          {trend==='up'?'↑':trend==='down'?'↓':'→'}
        </span>}
      </div>
      {sub && <span className="text-[10px] text-[var(--muted)]">{sub}</span>}
    </div>
  )
}
