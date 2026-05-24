import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asArray, asRecord, preferStoredSnapshot, unwrapData } from './ui'

const FLOWS = [
  'PRIMARY_SIGNAL',
  'INTER_EXISTENTIAL_BRIDGE',
  'EMERGENCY_CONTAINMENT',
  'OPERATOR_ASCENSION',
]

export default function V5FlowModels() {
  const pageState = useV5CommandStore((state) => state.pageState.flows ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [flows, setFlows] = useState<unknown>(pageState.flows ?? null)
  const [active, setActive] = useState<unknown>(pageState.active ?? null)
  const [lastRun, setLastRun] = useState<unknown>(pageState.lastRun ?? null)
  const flowList = asArray<Record<string, unknown>>(unwrapData(flows))
  const activeList = asArray<Record<string, unknown>>(unwrapData(active))
  const lastRunData = asRecord(unwrapData(lastRun))

  const refresh = async () => {
    const [nextFlows, nextActive] = await Promise.all([
      apiGet('/api/flows'),
      apiGet('/api/flows/active'),
    ])
    const f = preferStoredSnapshot(nextFlows, pageState.flows ?? nextFlows)
    const a = preferStoredSnapshot(nextActive, pageState.active ?? nextActive)
    setFlows(f)
    setActive(a)
    savePageState('flows', { flows: f, active: a, lastRun })
    recordHistory({ page: 'flows', action: 'refresh-flows', output: { flows: f, active: a }, note: 'Flow state refreshed' })
  }

  useEffect(() => {
    setCurrentPage('flows')
    void refresh()
  }, [])

  const runFlow = async (flow: string) => {
    const out = await apiPost('/api/flows/execute', { flow, initiatedBy: 'v5-ui' })
    setLastRun(out)
    savePageState('flows', { lastRun: out })
    recordHistory({ page: 'flows', action: 'run-flow', input: { flow, initiatedBy: 'v5-ui' }, output: out, note: 'Flow executed from v5 flow panel' })
    await refresh()
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Flow Models" value={flowList.length || FLOWS.length} accent="var(--accent)" />
        <MetricCard label="Active" value={activeList.length} accent="#10b981" />
        <MetricCard label="Last Flow" value={String(lastRunData.flow ?? '-')} accent="#a855f7" />
        <MetricCard label="Last State" value={String(lastRunData.state ?? '-')} accent="#f59e0b" />
      </div>

      <Panel title="Flow Models" subtitle="orchestrator">
        <div className="flex flex-wrap gap-2">
          {FLOWS.map((flow) => (
            <Button key={flow} onClick={() => void runFlow(flow)}>{flow}</Button>
          ))}
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
        </div>
      </Panel>

      <div className="oct-grid-3">
        <Panel title="Registered Flows" scrollable>
          <div className="flex flex-col gap-2">
            {(flowList.length > 0 ? flowList : FLOWS.map((f) => ({ flow: f } as Record<string, unknown>))).map((flow, idx) => {
              const flowRec = flow as Record<string, unknown>
              return (
              <div key={`${String(flowRec.flow ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 text-[10px]">
                <div className="text-[var(--text)]">{String(flowRec.flow ?? flowRec.id ?? flowRec.name ?? 'Flow')}</div>
                <div className="text-[var(--muted)] text-[9px]">{String(flowRec.state ?? 'available')}</div>
              </div>
            )})}
          </div>
        </Panel>
        <Panel title="Active Executions" scrollable>
          {activeList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeList.slice(0, 20).map((item, idx) => (
                <div key={`${String(item.executionId ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 text-[10px]">
                  <div className="text-[var(--text)]">{String(item.flow ?? item.name ?? 'Execution')}</div>
                  <div className="text-[var(--muted)] text-[9px]">{String(item.state ?? 'running')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--muted)]">No active executions</div>
          )}
        </Panel>
        <Panel title="Last Run" scrollable><KeyValueTable value={lastRunData} /></Panel>
      </div>
    </div>
  )
}
