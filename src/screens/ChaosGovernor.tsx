import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { Panel } from '@components/primitives/Panel'
import { ChaosGauge } from '@components/chaos/ChaosGauge'
import { EntropyMeter } from '@components/chaos/EntropyMeter'
import { StabilizerPanel } from '@components/chaos/StabilizerPanel'
import { DerivedParams } from '@components/chaos/DerivedParams'
import { ChaosPresets } from '@components/chaos/ChaosPresets'
import { Fader } from '@components/controls/Fader'
import { Toggle } from '@components/controls/Toggle'

export default function ChaosGovernor() {
  const { chaos, entropy, locked, derivedParams, setChaos, lockChaos } = useChaosStore()
  const color = getChaosColor(chaos)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-md border border-[var(--border)] bg-[var(--surface)]"
           style={{ borderColor: `${color}40`, boxShadow: `0 0 24px ${color}10` }}>
        <div>
          <div className="text-[13px] font-bold tracking-wider" style={{ color }}>CHAOS GOVERNOR</div>
          <div className="text-[9px] text-[var(--muted)] mt-0.5">Unified stochastic control layer — full-spectrum intelligence command</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[9px] text-[var(--muted)]">ENTROPY</div>
            <div className="text-[18px] font-bold" style={{ color }}>{(entropy*100).toFixed(1)}%</div>
          </div>
          <Toggle value={!locked} onChange={v => lockChaos(!v)} label={locked ? 'LOCKED' : 'ACTIVE'} color={color}/>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:flex-1 min-h-0">
        {/* Gauge column */}
        <div className="flex flex-col gap-3 w-full md:w-64 md:shrink-0">
          <Panel title="Chaos Dial" accent={color}>
            <div className="flex flex-col items-center gap-3 py-2">
              <ChaosGauge />
              <Fader value={chaos} min={0} max={1} onChange={setChaos} length={180} color={color} label="FINE ADJUST"/>
            </div>
          </Panel>
          <Panel title="Entropy" accent={color}>
            <EntropyMeter />
          </Panel>
        </div>

        {/* Center: presets + derived */}
        <div className="flex flex-col gap-3 w-full md:flex-1 min-h-0">
          <Panel title="Presets">
            <ChaosPresets />
          </Panel>
          <Panel title="Derived Inference Parameters" accent={color} className="flex-1 min-h-0" scrollable>
            <DerivedParams />
          </Panel>
          {/* Strategy badge */}
          <div className="p-3 rounded-md border bg-[var(--surface2)] flex items-center justify-between"
               style={{ borderColor: `${color}30` }}>
            <div>
              <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider mb-0.5">Active Reasoning Strategy</div>
              <div className="text-[13px] font-bold uppercase tracking-widest" style={{ color }}>{derivedParams.reasoningStrategy}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-[var(--muted)]">Parallel Paths</div>
              <div className="text-[20px] font-bold" style={{ color }}>{derivedParams.parallelPaths}</div>
            </div>
          </div>
        </div>

        {/* Right: stabilizers */}
        <div className="w-full md:w-72 md:shrink-0">
          <Panel title="Stabilizers" subtitle="5 ACTIVE" accent={color} className="h-full" scrollable>
            <StabilizerPanel />
          </Panel>
        </div>
      </div>
    </div>
  )
}
