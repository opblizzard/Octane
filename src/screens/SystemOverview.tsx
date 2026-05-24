import { useSystemStore } from '@state/system'
import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { TimeSeriesChart } from '@components/charts/TimeSeriesChart'

export default function SystemOverview() {
  const { regions, history, totalRequests, uptime } = useSystemStore()
  const latest = history[history.length - 1] || { cpu: 0, mem: 0, net: 0, req: 0 }
  const chartData = history.slice(-60).map((p, i) => ({ i, cpu: p.cpu, mem: p.mem, net: p.net }))

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="CPU Usage"    value={latest.cpu.toFixed(1)} unit="%" trend="up"  accent="var(--accent)"/>
        <MetricCard label="Memory"       value={latest.mem.toFixed(1)} unit="%" trend="flat" accent="#10b981"/>
        <MetricCard label="Total Req"    value={totalRequests.toLocaleString()} trend="up"   accent="#a855f7"/>
        <MetricCard label="Uptime"       value={uptime} unit="%"                              accent="#10b981"/>
      </div>

      {/* Chart */}
      <Panel title="System Metrics — Live" subtitle="60s window" className="flex-1 min-h-0">
        <TimeSeriesChart data={chartData} height={160}
          series={[{ key:'cpu', color:'var(--accent)', label:'CPU' },{ key:'mem', color:'#10b981', label:'MEM' },{ key:'net', color:'#a855f7', label:'NET' }]}
          showGrid showLegend/>
      </Panel>

      {/* Edge regions */}
      <Panel title="Edge Regions" subtitle={`${regions.length} nodes`}>
        <div className="grid grid-cols-3 gap-2">
          {regions.map(r => (
            <div key={r.id} className="bg-[var(--surface2)] border border-[var(--border)] rounded p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text)]">{r.name}</span>
                <StatusBadge status={r.status} label={r.status}/>
              </div>
              <div className="text-[9px] text-[var(--muted)]">{r.location}</div>
              <div className="grid grid-cols-3 gap-1 text-center mt-1">
                <div><div className="text-[10px] font-mono text-[var(--accent)]">{r.latency}ms</div><div className="text-[8px] text-[var(--muted)]">p50</div></div>
                <div><div className="text-[10px] font-mono text-[#10b981]">{r.requests.toLocaleString()}</div><div className="text-[8px] text-[var(--muted)]">req</div></div>
                <div><div className="text-[10px] font-mono text-[#ef4444]">{r.errors}</div><div className="text-[8px] text-[var(--muted)]">err</div></div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
