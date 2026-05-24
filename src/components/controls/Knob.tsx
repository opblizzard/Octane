import { useRef, useCallback } from 'react'
interface Props { value:number; min:number; max:number; onChange:(v:number)=>void; size?:number|'sm'|'md'|'lg'; label?:string; color?:string; accent?:string; format?:(v:number)=>string; displayFn?:(v:number)=>string; unit?:string }
const SIZE_MAP: Record<string,number> = { sm:36, md:52, lg:72 }
export function Knob({ value, min, max, onChange, size=56, label, color, accent, format, displayFn }: Props) {
  const resolvedSize = typeof size === 'string' ? (SIZE_MAP[size] ?? 56) : size
  const resolvedColor = color ?? (accent ? `var(--oct-accent-${accent})` : 'var(--accent)')
  const display = displayFn ?? format
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false); const startY = useRef(0); const startVal = useRef(0)
  const pct = (value-min)/(max-min)
  const START = -135; const RANGE = 270
  const angle = START + pct*RANGE
  const r = resolvedSize*0.38; const cx = resolvedSize/2; const cy = resolvedSize/2
  const rad = (a:number) => a*Math.PI/180
  const arcPath = (startDeg:number,endDeg:number,radius:number) => {
    const s={x:cx+radius*Math.cos(rad(startDeg)),y:cy+radius*Math.sin(rad(startDeg))}
    const e={x:cx+radius*Math.cos(rad(endDeg)),y:cy+radius*Math.sin(rad(endDeg))}
    const lg=Math.abs(endDeg-startDeg)>180?1:0
    return `M${s.x},${s.y} A${radius},${radius},0,${lg},1,${e.x},${e.y}`
  }
  const onMouseDown = useCallback((e:React.MouseEvent)=>{
    dragging.current=true; startY.current=e.clientY; startVal.current=value
    const onMove=(ev:MouseEvent)=>{ if(!dragging.current)return; const dy=startY.current-ev.clientY; const nv=Math.max(min,Math.min(max,startVal.current+dy*(max-min)/100)); onChange(nv) }
    const onUp=()=>{ dragging.current=false; window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp) }
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp)
  },[value,min,max,onChange])
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg ref={ref} width={resolvedSize} height={resolvedSize} onMouseDown={onMouseDown} className="cursor-ns-resize">
        <path d={arcPath(START+90,START+90+RANGE,-0)} stroke="transparent" fill="none"/>
        <circle cx={cx} cy={cy} r={r} fill="var(--surface2)" stroke="var(--border)" strokeWidth="1"/>
        <path d={arcPath(START+90,START+90+RANGE,r+2)} stroke="var(--border)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d={arcPath(START+90,START+90+pct*RANGE,r+2)} stroke={resolvedColor} strokeWidth="3" fill="none" strokeLinecap="round" style={{filter:`drop-shadow(0 0 4px ${resolvedColor})`}}/>
        <line x1={cx} y1={cy} x2={cx+r*0.65*Math.cos(rad(angle-90))} y2={cy+r*0.65*Math.sin(rad(angle-90))} stroke={resolvedColor} strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {label && <span className="text-[9px] text-[var(--muted)] uppercase tracking-widest">{label}</span>}
      <span className="text-[10px]" style={{color:resolvedColor}}>{display?display(value):value.toFixed(2)}</span>
    </div>
  )
}
