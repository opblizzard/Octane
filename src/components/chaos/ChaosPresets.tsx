import { useChaosStore } from '@state/chaos'
import clsx from 'clsx'

export function ChaosPresets() {
  const { presets, activePreset, applyPreset } = useChaosStore()
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map(p => (
        <button key={p.id} onClick={() => applyPreset(p.id)}
          className={clsx('p-2.5 rounded-md border text-left transition-all', activePreset===p.id ? 'border-current' : 'border-[var(--border)] hover:border-[var(--border2)]')}
          style={activePreset===p.id ? { borderColor:p.color, background:`${p.color}12`, boxShadow:`0 0 12px ${p.color}30` } : {}}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background:p.color, boxShadow: activePreset===p.id ? `0 0 8px ${p.color}` : 'none' }}/>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:p.color }}>{p.name}</span>
            <span className="text-[9px] text-[var(--muted)] ml-auto">{p.chaos.toFixed(1)}</span>
          </div>
          <p className="text-[9px] text-[var(--muted)] leading-relaxed">{p.description}</p>
        </button>
      ))}
    </div>
  )
}
