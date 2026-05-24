import { useChaosStore } from '@state/chaos'
import { Toggle } from '@components/controls/Toggle'
import { ProgressBar } from '@components/primitives/ProgressBar'

export function StabilizerPanel() {
  const { stabilizers, toggleStabilizer } = useChaosStore()
  const COLORS = ['#00f5ff','#10b981','#f59e0b','#a855f7','#3b82f6']
  return (
    <div className="flex flex-col gap-2">
      {stabilizers.map((s, i) => (
        <div key={s.id} className="flex flex-col gap-1.5 p-2 rounded bg-[var(--surface2)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.active ? COLORS[i] : 'var(--border)', boxShadow: s.active ? `0 0 6px ${COLORS[i]}` : 'none' }}/>
              <span className="text-[10px] font-medium text-[var(--text)]">{s.name}</span>
            </div>
            <Toggle value={s.active} onChange={() => toggleStabilizer(s.id)} color={COLORS[i]}/>
          </div>
          <ProgressBar value={s.value * 100} color={COLORS[i]} height={3}/>
          <div className="flex justify-between text-[9px] text-[var(--muted)]">
            <span>{s.description}</span>
            <span>{(s.value * 100).toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}
