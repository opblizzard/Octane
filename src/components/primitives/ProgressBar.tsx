import clsx from 'clsx'
interface Segment { value:number; color:string; label?:string }
const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
interface Props { value?:number; segments?:Segment[]; color?:string; accent?:string; height?:number|string; className?:string; label?:string; showValue?:boolean }
export function ProgressBar({ value=0, segments, color, accent, height=6, className, label, showValue }: Props) {
  const resolvedColor = color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)')
  const resolvedHeight = typeof height === 'string' ? 4 : height
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {(label||showValue) && (
        <div className="flex justify-between text-[10px] text-[var(--muted)]">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden bg-[var(--border)]" style={{ height: resolvedHeight }}>
        {segments ? (
          <div className="flex h-full">
            {segments.map((s,i) => <div key={i} style={{ width:`${s.value}%`, background:s.color }} />)}
          </div>
        ) : (
          <div className="h-full rounded-full transition-all duration-300" style={{ width:`${Math.min(100,value)}%`, background:resolvedColor, boxShadow:`0 0 8px ${resolvedColor}40` }} />
        )}
      </div>
    </div>
  )
}
