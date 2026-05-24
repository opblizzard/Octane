import { useRef, useCallback } from 'react'
const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
interface Props { value:number; min?:number; max?:number; onChange:(v:number)=>void; vertical?:boolean; orientation?:'vertical'|'horizontal'; length?:number; height?:number; color?:string; accent?:string; label?:string }
export function Fader({ value, min=0, max=1, onChange, vertical, orientation, length=120, height, color, accent, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isVertical = vertical ?? (orientation === 'vertical')
  const resolvedLength = height ?? length
  const resolvedColor = color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)')
  const pct = (value-min)/(max-min)
  const handleClick = useCallback((e:React.MouseEvent)=>{
    if(!ref.current)return
    const rect=ref.current.getBoundingClientRect()
    const p=isVertical?1-(e.clientY-rect.top)/rect.height:(e.clientX-rect.left)/rect.width
    onChange(Math.max(min,Math.min(max,min+Math.max(0,Math.min(1,p))*(max-min))))
  },[min,max,onChange,isVertical])
  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-[9px] text-[var(--muted)] uppercase tracking-widest">{label}</span>}
      <div ref={ref} onClick={handleClick} className="relative rounded-full bg-[var(--border)] cursor-pointer"
           style={isVertical?{width:6,height:resolvedLength}:{width:resolvedLength,height:6}}>
        <div className="absolute rounded-full transition-all" style={isVertical?
          {left:0,right:0,bottom:0,height:`${pct*100}%`,background:resolvedColor,boxShadow:`0 0 8px ${resolvedColor}60`}:
          {top:0,bottom:0,left:0,width:`${pct*100}%`,background:resolvedColor,boxShadow:`0 0 8px ${resolvedColor}60`}}/>
        <div className="absolute w-3 h-3 rounded-full bg-[var(--text)] border-2 shadow" style={{
          borderColor:resolvedColor, boxShadow:`0 0 6px ${resolvedColor}`,
          ...(isVertical?{left:'50%',transform:'translate(-50%,50%)',bottom:`${pct*100}%`}:{top:'50%',transform:'translate(-50%,-50%)',left:`${pct*100}%`})}}/>
      </div>
      <span className="text-[9px]" style={{color:resolvedColor}}>{value.toFixed(2)}</span>
    </div>
  )
}
