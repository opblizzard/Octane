import { useRef, useState } from 'react'
const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
interface Props { data:number[]; color?:string; accent?:string; height?:number; showTooltip?:boolean; tooltip?:boolean }

function buildPolyline(data: number[], W = 200, H = 40): string {
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = H * 0.08
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = pad + ((1 - (v - min) / range) * (H - pad * 2))
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export function SparkLine({ data, color, accent, height=40, showTooltip=false, tooltip }: Props) {
  const resolvedColor = color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)')
  const useTooltip = showTooltip || !!tooltip
  const [hovered, setHovered] = useState<{ x: number; y: number; value: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 200
  const H = height
  const points = buildPolyline(data, W, H)

  const handleMouseMove = useTooltip ? (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length < 2) return
    const rect = svgRef.current.getBoundingClientRect()
    const rx = (e.clientX - rect.left) / rect.width
    const idx = Math.round(rx * (data.length - 1))
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pad = H * 0.08
    const cx = (clamped / (data.length - 1)) * W
    const cy = pad + ((1 - (data[clamped] - min) / range) * (H - pad * 2))
    setHovered({ x: cx, y: cy, value: data[clamped] })
  } : undefined

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={useTooltip ? () => setHovered(null) : undefined}
      >
        <defs>
          <filter id={`spark-glow-${resolvedColor.replace(/[^a-zA-Z0-9]/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${resolvedColor})` }}
          />
        )}
        {useTooltip && hovered && (
          <circle cx={hovered.x} cy={hovered.y} r={3} fill={resolvedColor} stroke="var(--surface)" strokeWidth={1.5}/>
        )}
      </svg>
      {useTooltip && hovered && (
        <div style={{
          position: 'absolute',
          left: `${(hovered.x / W) * 100}%`,
          top: 0,
          transform: 'translate(-50%, -110%)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '2px 5px',
          fontSize: 10,
          color: 'var(--text)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {hovered.value.toFixed(1)}
        </div>
      )}
    </div>
  )
}
