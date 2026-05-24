import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { SparkLine } from '@components/charts/SparkLine'
import { useRef, useEffect } from 'react'

export function EntropyMeter() {
  const { entropy, chaos } = useChaosStore()
  const color = getChaosColor(chaos)
  const history = useRef<number[]>(Array(40).fill(entropy))

  useEffect(() => {
    history.current = [...history.current.slice(-39), entropy]
  }, [entropy])

  const pct = Math.round(entropy * 100)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Entropy</span>
        <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
      </div>
      <SparkLine data={history.current} color={color} height={36}/>
      <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width:`${pct}%`, background:color, boxShadow:`0 0 8px ${color}` }}/>
      </div>
    </div>
  )
}
