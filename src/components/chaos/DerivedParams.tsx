import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'

export function DerivedParams() {
  const { derivedParams, chaos } = useChaosStore()
  const color = getChaosColor(chaos)
  const rows = [
    { label:'Temperature',      value: derivedParams.temperature.toFixed(3),    unit:'',    bar: derivedParams.temperature/2.0 },
    { label:'Top-P',            value: derivedParams.topP.toFixed(3),            unit:'',    bar: derivedParams.topP },
    { label:'Top-K',            value: derivedParams.topK,                       unit:'',    bar: derivedParams.topK/100 },
    { label:'Parallel Paths',   value: derivedParams.parallelPaths,              unit:'',    bar: derivedParams.parallelPaths/8 },
    { label:'Memory Noise',     value: (derivedParams.memoryNoise*100).toFixed(0), unit:'%', bar: derivedParams.memoryNoise/0.6 },
    { label:'Self-Critique',    value: (derivedParams.selfCritiqueIntensity*100).toFixed(0), unit:'%', bar: derivedParams.selfCritiqueIntensity },
    { label:'Coherence Guard',  value: (derivedParams.coherenceGuard*100).toFixed(0), unit:'%', bar: derivedParams.coherenceGuard },
    { label:'Creativity Index', value: (derivedParams.creativityIndex*100).toFixed(0), unit:'%', bar: derivedParams.creativityIndex },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface2)] text-center" style={{ color }}>
        Strategy: <span className="font-bold uppercase tracking-wider">{derivedParams.reasoningStrategy}</span>
      </div>
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="text-[9px] text-[var(--muted)] w-28 shrink-0">{r.label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${r.bar*100}%`, background:color, transition:'width 0.3s ease' }}/>
          </div>
          <span className="text-[9px] font-mono w-12 text-right" style={{ color }}>{r.value}{r.unit}</span>
        </div>
      ))}
    </div>
  )
}
