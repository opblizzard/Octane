import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { Button } from '@components/controls/Button'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet } from './api'
import { KeyValueTable, preferStoredSnapshot } from './ui'

type Metrics = { data?: { coherence?: number; activeFlows?: number; activeBridges?: number; latticeNodes?: number; totalSignals?: number; operatorStage?: number } }

export default function V5Metrics() {
  const pageState = useV5CommandStore((state) => state.pageState.metrics ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [metrics, setMetrics] = useState<Metrics | null>((pageState.metrics as Metrics | undefined) ?? null)

  const refresh = async () => {
    const fetched = await apiGet<Metrics>('/api/metrics')
    const value = preferStoredSnapshot(fetched, (pageState.metrics as Metrics | undefined) ?? fetched)
    setMetrics(value)
    savePageState('metrics', { metrics: value })
    recordHistory({ page: 'metrics', action: 'refresh-metrics', output: value, note: 'Metrics feed refreshed' })
  }

  useEffect(() => {
    setCurrentPage('metrics')
    void refresh()
  }, [])

  const d = metrics?.data || {}

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Coherence" value={Math.round((d.coherence ?? 0) * 100)} unit="%" accent="var(--accent)" />
        <MetricCard label="Signals" value={d.totalSignals ?? 0} accent="#10b981" />
        <MetricCard label="Active Flows" value={d.activeFlows ?? 0} accent="#a855f7" />
        <MetricCard label="Operator Stage" value={d.operatorStage ?? 0} accent="#f59e0b" />
      </div>
      <Panel title="v5 Metrics Feed" subtitle="edge telemetry">
        <div className="flex gap-2 mb-3">
          <Button onClick={() => void refresh()}>Refresh</Button>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <div>
            <div className="flex justify-between text-[10px] text-[var(--muted)]"><span>Coherence</span><span>{Math.round((d.coherence ?? 0) * 100)}%</span></div>
            <div className="h-1.5 rounded bg-[var(--border)] mt-1 overflow-hidden"><div className="h-full bg-[var(--accent)]" style={{ width: `${Math.round((d.coherence ?? 0) * 100)}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-[var(--muted)]"><span>Flow Load</span><span>{Math.min(100, (d.activeFlows ?? 0) * 10)}%</span></div>
            <div className="h-1.5 rounded bg-[var(--border)] mt-1 overflow-hidden"><div className="h-full bg-[#a855f7]" style={{ width: `${Math.min(100, (d.activeFlows ?? 0) * 10)}%` }} /></div>
          </div>
        </div>
        <KeyValueTable value={d} />
      </Panel>
    </div>
  )
}
