import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { TimeSeriesChart } from '@components/charts/TimeSeriesChart'
import { OctaneRadarChart } from '@components/charts/RadarChart'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { useRef, useEffect, useState } from 'react'

interface EntropyPoint { i: number; entropy: number; chaos: number; coherence: number; noise: number }

export default function EntropyMonitor() {
  const { chaos, entropy, derivedParams, stabilizers } = useChaosStore()
  const color = getChaosColor(chaos)
  const [history, setHistory] = useState<EntropyPoint[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      i, entropy: 0.3 + Math.random() * 0.1, chaos: 0.3,
      coherence: 0.7 + Math.random() * 0.1, noise: Math.random() * 0.1
    }))
  )
  const tick = useRef(60)

  useEffect(() => {
    const id = setInterval(() => {
      setHistory(h => [...h.slice(-119), {
        i: tick.current++,
        entropy, chaos,
        coherence: derivedParams.coherenceGuard,
        noise: derivedParams.memoryNoise,
      }])
    }, 1000)
    return () => clearInterval(id)
  }, [entropy, chaos, derivedParams])

  const radarData = [
    { subject: 'Entropy',   value: entropy * 100 },
    { subject: 'Chaos',     value: chaos * 100 },
    { subject: 'Coherence', value: derivedParams.coherenceGuard * 100 },
    { subject: 'Noise',     value: derivedParams.memoryNoise * 100 },
    { subject: 'Critique',  value: derivedParams.selfCritiqueIntensity * 100 },
    { subject: 'Creativity',value: derivedParams.creativityIndex * 100 },
  ]

  const entropyStatus = entropy > 0.8 ? 'CRITICAL' : entropy > 0.6 ? 'ELEVATED' : entropy > 0.4 ? 'MODERATE' : 'STABLE'
  const statusColor = entropy > 0.8 ? '#ef4444' : entropy > 0.6 ? '#f59e0b' : entropy > 0.4 ? '#3b82f6' : '#10b981'

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 p-3 rounded-md border bg-[var(--surface)]"
           style={{ borderColor: `${statusColor}40`, boxShadow: `0 0 16px ${statusColor}10` }}>
        <div>
          <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider">Entropy Status</div>
          <div className="text-[16px] font-bold" style={{ color: statusColor }}>{entropyStatus}</div>
        </div>
        <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${entropy*100}%`, background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}/>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-[var(--muted)]">Current</div>
          <div className="text-[20px] font-bold" style={{ color: statusColor }}>{(entropy*100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Entropy"    value={(entropy*100).toFixed(1)} unit="%" accent={statusColor}/>
        <MetricCard label="Coherence"  value={(derivedParams.coherenceGuard*100).toFixed(0)} unit="%" accent="#10b981"/>
        <MetricCard label="Mem Noise"  value={(derivedParams.memoryNoise*100).toFixed(0)} unit="%" accent="#f59e0b"/>
        <MetricCard label="Creativity" value={(derivedParams.creativityIndex*100).toFixed(0)} unit="%" accent={color}/>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:flex-1 min-h-0">
        {/* Time series */}
        <div className="flex flex-col gap-3 w-full md:flex-1 min-h-0">
          <Panel title="Entropy History — Real-time" subtitle="1s resolution" className="flex-1 min-h-0">
            <TimeSeriesChart data={history.slice(-60)} height={180} showGrid
              series={[
                { key:'entropy',   color:statusColor,    label:'Entropy'   },
                { key:'coherence', color:'#10b981',       label:'Coherence' },
                { key:'noise',     color:'#f59e0b',       label:'Noise'     },
              ]}/>
          </Panel>
          <Panel title="Stabilizer Thresholds">
            <div className="flex flex-col gap-2">
              {stabilizers.map((s, i) => {
                const COLORS = ['#00f5ff','#10b981','#f59e0b','#a855f7','#3b82f6']
                const danger = s.value < s.threshold
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[9px] text-[var(--muted)] w-32 truncate">{s.name}</span>
                    <div className="flex-1 relative">
                      <ProgressBar value={s.value*100} color={danger?'#ef4444':COLORS[i]} height={6}/>
                      {/* Threshold marker */}
                      <div className="absolute top-0 bottom-0 w-px bg-[#ef4444]" style={{ left:`${s.threshold*100}%`, opacity:0.7 }}/>
                    </div>
                    <span className="text-[8px] w-8 text-right" style={{ color: danger?'#ef4444':COLORS[i] }}>{(s.value*100).toFixed(0)}%</span>
                    {danger && <span className="text-[8px] text-[#ef4444]">⚠</span>}
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* Radar */}
        <div className="w-full md:w-64 md:shrink-0">
          <Panel title="Entropy Radar" className="h-full">
            <OctaneRadarChart data={radarData} color={color} height={220}/>
            <div className="mt-2 flex flex-col gap-1.5">
              {radarData.map(d=>(
                <div key={d.subject} className="flex justify-between text-[9px]">
                  <span className="text-[var(--muted)]">{d.subject}</span>
                  <span style={{color}}>{d.value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
