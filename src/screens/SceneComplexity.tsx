import { useSystemStore } from '@state/system'
import { Panel } from '@components/primitives/Panel'
import { OctaneRadarChart } from '@components/charts/RadarChart'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { MetricCard } from '@components/primitives/MetricCard'
import { useChaosStore } from '@state/chaos'

export default function SceneComplexity() {
  const { history } = useSystemStore()
  const { chaos, derivedParams } = useChaosStore()
  const latest = history[history.length-1] || { cpu:0, mem:0, net:0, req:0 }

  const radarData = [
    { subject:'Render', value: latest.cpu },
    { subject:'Physics', value: latest.mem * 0.6 },
    { subject:'AI Load', value: chaos * 100 },
    { subject:'Network', value: latest.net },
    { subject:'Memory', value: latest.mem },
    { subject:'Entropy', value: derivedParams.creativityIndex * 100 },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Scene Score"   value={(latest.cpu*0.4+latest.mem*0.3+chaos*30).toFixed(0)} accent="var(--accent)"/>
        <MetricCard label="Render Load"   value={latest.cpu.toFixed(0)} unit="%" accent="#10b981"/>
        <MetricCard label="Entropy Ops"   value={(chaos*derivedParams.parallelPaths).toFixed(1)} accent="#a855f7"/>
        <MetricCard label="AI Complexity" value={derivedParams.reasoningStrategy.toUpperCase()} accent="var(--chaos-color)"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Panel title="Scene Radar">
          <OctaneRadarChart data={radarData} color="var(--accent)" height={240}/>
        </Panel>
        <Panel title="Subsystem Load">
          <div className="flex flex-col gap-3 py-2">
            {radarData.map((d,i)=>{
              const colors=['var(--accent)','#10b981','var(--chaos-color)','#a855f7','#f59e0b','#3b82f6']
              return <ProgressBar key={d.subject} value={d.value} color={colors[i]} height={8} label={d.subject} showValue/>
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}
