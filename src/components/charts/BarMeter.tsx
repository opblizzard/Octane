const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
interface MeterDatum { label:string; value:number; unit?:string }
interface Props { value?:number; data?:MeterDatum[]; label?:string; color?:string; accent?:string; vertical?:boolean; orientation?:'vertical'|'horizontal'; segments?:number; height?:number|string; width?:string|number; showValue?:boolean; size?:number }
export function BarMeter({ value=0, data, label, color, accent, vertical, orientation, segments=20, height=100, width, showValue, size }: Props) {
  if (data?.length) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 w-full">
            <span className="text-[9px] text-[var(--muted)] w-14 shrink-0">{d.label}</span>
            <div className="h-2 rounded w-full bg-[var(--border)] overflow-hidden">
              <div className="h-full rounded transition-all" style={{ width:`${Math.max(0,Math.min(100,d.value))}%`, background: color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)') }}/>
            </div>
            <span className="text-[9px] text-[var(--muted)] w-10 text-right shrink-0">{d.value.toFixed(0)}{d.unit ?? ''}</span>
          </div>
        ))}
      </div>
    )
  }
  const resolvedColor = color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)')
  const isVertical = vertical ?? (orientation === 'vertical')
  const resolvedHeight = typeof height === 'string' ? 100 : (size ?? height)
  const active = Math.round(value*segments)
  const bars = Array.from({length:segments},(_,i)=>i<active)
  return (
    <div className={`flex ${isVertical?'flex-col-reverse':'flex-row'} gap-0.5 items-center`} style={isVertical?{height:resolvedHeight, width: width ?? undefined}:{width: width ?? undefined}}>
      {bars.map((on,i)=>(
        <div key={i} className="rounded-sm transition-all" style={isVertical?
          {width:'100%',flex:1,background:on?resolvedColor:'var(--border)',boxShadow:on?`0 0 4px ${resolvedColor}`:'none',opacity:on?1:0.3}:
          {height:16,flex:1,background:on?resolvedColor:'var(--border)',boxShadow:on?`0 0 4px ${resolvedColor}`:'none',opacity:on?1:0.3}}/>
      ))}
      {showValue && <span className="text-[9px] text-[var(--muted)]">{(value*100).toFixed(0)}%</span>}
      {label && <span className="text-[9px] text-[var(--muted)] mt-1">{label}</span>}
    </div>
  )
}
