import { useTelemetryStore } from '@state/telemetry'
import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { SparkLine } from '@components/charts/SparkLine'

export default function TelemetryConsole() {
  const { logs, p50, p95, p99, errorRate, latencyHistory } = useTelemetryStore()
  const STATUS_COLOR = (s: number) => s >= 500 ? '#ef4444' : s >= 400 ? '#f59e0b' : '#10b981'

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="p50 Latency" value={p50} unit="ms" accent="var(--accent)"/>
        <MetricCard label="p95 Latency" value={p95} unit="ms" accent="#f59e0b"/>
        <MetricCard label="p99 Latency" value={p99} unit="ms" accent="#ef4444"/>
        <MetricCard label="Error Rate"  value={errorRate} unit="%" accent="#ef4444"/>
      </div>

      <Panel title="Latency — Live" subtitle="p50 over time">
        <SparkLine data={latencyHistory} color="var(--accent)" height={60} showTooltip/>
      </Panel>

      <Panel title="Request Log" scrollable className="flex-1 min-h-0" noPad>
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
            <tr className="text-[var(--muted)] uppercase tracking-wider">
              {['Time','Method','Path','Status','Latency','Region','Size'].map(h=>(
                <th key={h} className="px-3 py-2 text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                <td className="px-3 py-1.5 text-[var(--muted)]">{new Date(l.ts).toLocaleTimeString('en',{hour12:false})}</td>
                <td className="px-3 py-1.5 text-[var(--accent)]">{l.method}</td>
                <td className="px-3 py-1.5 text-[var(--text)] font-mono">{l.path}</td>
                <td className="px-3 py-1.5 font-bold" style={{color:STATUS_COLOR(l.status)}}>{l.status}</td>
                <td className="px-3 py-1.5 text-[var(--text)]">{l.latency}ms</td>
                <td className="px-3 py-1.5 text-[var(--muted)]">{l.region}</td>
                <td className="px-3 py-1.5 text-[var(--muted)]">{l.size}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
