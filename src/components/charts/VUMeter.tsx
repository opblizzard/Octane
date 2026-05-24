const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
interface Props { left?:number; right?:number; valueL?:number; valueR?:number; peak?:number; height?:number; segments?:number; accent?:string }
export function VUMeter({ left, right, valueL, valueR, peak: _peak, height=80, segments=16, accent: _accent }: Props) {
  const l = valueL ?? left ?? 0
  const r = valueR ?? right ?? 0
  const bars = Array.from({length:segments},(_,i)=>{
    const thr = i/segments
    const active = (ch:number)=>ch>thr
    const color = (i:number)=>i>segments*0.85?'#ef4444':i>segments*0.7?'#f59e0b':'#10b981'
    return { thr, color:color(i), activeL:active(l), activeR:active(r) }
  }).reverse()
  return (
    <div className="flex gap-1 items-end" style={{height}}>
      {[bars.map(b=>b.activeL),bars.map(b=>b.activeR)].map((ch,ci)=>(
        <div key={ci} className="flex flex-col gap-0.5 flex-1">
          {bars.map((b,i)=>(
            <div key={i} className="w-full rounded-sm transition-all" style={{
              height:`${100/segments}%`, background:ch[i]?b.color:'var(--border)',
              boxShadow:ch[i]?`0 0 4px ${b.color}`:'none', opacity:ch[i]?1:0.3 }}/>
          ))}
        </div>
      ))}
    </div>
  )
}
