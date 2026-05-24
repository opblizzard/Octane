import { useRef, useCallback } from 'react'
import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'

export function ChaosGauge() {
  const { chaos, locked, setChaos } = useChaosStore()
  const color = getChaosColor(chaos)
  const dragging = useRef(false)
  const ref = useRef<SVGSVGElement>(null)

  const SIZE = 220; const CX = SIZE/2; const CY = SIZE/2; const R = 88
  const START = 135; const ARC = 270
  const rad = (d: number) => d * Math.PI / 180

  function arcPoint(deg: number, r = R) {
    return { x: CX + r * Math.cos(rad(deg)), y: CY + r * Math.sin(rad(deg)) }
  }
  function arcPath(start: number, end: number, r: number) {
    const s = arcPoint(start, r); const e = arcPoint(end, r)
    const lg = Math.abs(end - start) > 180 ? 1 : 0
    return `M${s.x},${s.y} A${r},${r},0,${lg},1,${e.x},${e.y}`
  }

  const angleDeg = START + chaos * ARC
  const needle = arcPoint(angleDeg, R * 0.72)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked) return
    dragging.current = true
    const update = (ev: MouseEvent) => {
      if (!ref.current || !dragging.current) return
      const rect = ref.current.getBoundingClientRect()
      const dx = ev.clientX - rect.left - CX; const dy = ev.clientY - rect.top - CY
      let angle = Math.atan2(dy, dx) * 180 / Math.PI
      if (angle < 0) angle += 360
      let relative = angle - START
      if (relative < 0) relative += 360
      if (relative > ARC + 30) relative = relative > 315 ? 0 : ARC
      const v = Math.max(0, Math.min(1, relative / ARC))
      setChaos(v)
    }
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', update); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', update); window.addEventListener('mouseup', up)
  }, [locked, setChaos])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={ref} width={SIZE} height={SIZE} className={locked ? 'cursor-not-allowed' : 'cursor-pointer select-none'}
           onMouseDown={handleMouseDown}>
        {/* Outer ring */}
        <circle cx={CX} cy={CY} r={R+8} fill="none" stroke="var(--border)" strokeWidth="1" strokeOpacity="0.5"/>
        {/* Track */}
        <path d={arcPath(START, START+ARC, R)} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"/>
        {/* Fill */}
        <path d={arcPath(START, START+chaos*ARC, R)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
        {/* Tick marks */}
        {[0,0.25,0.5,0.75,1].map(v => {
          const a = START + v * ARC; const p1 = arcPoint(a, R+14); const p2 = arcPoint(a, R+20)
          return <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={getChaosColor(v)} strokeWidth="2" strokeOpacity="0.7"/>
        })}
        {/* Center */}
        <circle cx={CX} cy={CY} r={R*0.52} fill="var(--surface)" stroke="var(--border)" strokeWidth="1"/>
        {/* Needle */}
        <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="2.5" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
        <circle cx={CX} cy={CY} r={5} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
        {/* Value text */}
        <text x={CX} y={CY+22} textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="monospace">
          {Math.round(chaos * 100)}%
        </text>
        <text x={CX} y={CY+38} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">
          CHAOS LEVEL
        </text>
        {/* Labels */}
        {[{ v:0,l:'0' },{ v:0.5,l:'0.5' },{ v:1,l:'1.0' }].map(({v,l})=>{
          const a = START+v*ARC; const p = arcPoint(a, R+30)
          return <text key={l} x={p.x} y={p.y} textAnchor="middle" fill={getChaosColor(v)} fontSize="8" fontFamily="monospace">{l}</text>
        })}
      </svg>
      {locked && <span className="text-[10px] text-[#f59e0b]">⚠ CHAOS LOCKED</span>}
    </div>
  )
}
