import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { SparkLine } from '@components/charts/SparkLine'
import { useSystemStore } from '@state/system'
import { useChaosStore } from '@state/chaos'

export default function MasterOutput() {
  const { history, totalRequests } = useSystemStore()
  const { chaos, entropy } = useChaosStore()
  const hist = history.slice(-60)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Output Rate"  value={(hist[hist.length-1]?.req||0).toFixed(0)} unit="req/s" accent="var(--accent)"/>
        <MetricCard label="Total Output" value={totalRequests.toLocaleString()} accent="#10b981"/>
        <MetricCard label="Chaos Mod"    value={(chaos*100).toFixed(0)} unit="%" accent="var(--chaos-color)"/>
        <MetricCard label="Entropy Out"  value={(entropy*100).toFixed(0)} unit="%" accent="#a855f7"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Panel title="Output Stream — CPU">
          <SparkLine data={hist.map(p=>p.cpu)} color="var(--accent)" height={80} showTooltip/>
        </Panel>
        <Panel title="Output Stream — Network">
          <SparkLine data={hist.map(p=>p.net)} color="#10b981" height={80} showTooltip/>
        </Panel>
      </div>
      <Panel title="Output Bus">
        <div className="flex flex-col gap-3 py-1">
          {[
            { label:'AI Token Stream', value:entropy*80+20,  color:'var(--accent)'  },
            { label:'Image Pipeline',  value:chaos*60+10,    color:'#a855f7'        },
            { label:'Metrics Egress',  value:70+Math.sin(Date.now()/1000)*10, color:'#10b981' },
            { label:'WebSocket Push',  value:85,             color:'#f59e0b'        },
          ].map(b=>(
            <ProgressBar key={b.label} value={b.value} color={b.color} height={10} label={b.label} showValue/>
          ))}
        </div>
      </Panel>
    </div>
  )
}
