import type { PressureCenter } from './types'

type PressureLegendProps = {
  centers: PressureCenter[]
}

export function PressureLegend({ centers }: PressureLegendProps) {
  if (centers.length === 0) return null
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Pressure Centers</div>
      {centers.map((center) => (
        <div key={`${center.type}-${center.lat}-${center.lng}`} className="text-[10px] text-[var(--muted)]">
          {center.type}: {Math.round(center.value)} hPa
        </div>
      ))}
    </div>
  )
}
