import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asArray, asRecord, preferStoredSnapshot, unwrapData } from './ui'

export default function V5StellarReach() {
  const pageState = useV5CommandStore((state) => state.pageState.src ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [state, setState] = useState<unknown>(pageState.state ?? null)
  const [conduits, setConduits] = useState<unknown>(pageState.conduits ?? null)
  const [bandwidth, setBandwidth] = useState<unknown>(pageState.bandwidth ?? null)
  const layer = String(pageState.layer ?? 'CIVILIZATIONAL')
  const [status, setStatus] = useState(String(pageState.status ?? 'ready'))
  const stateData = asRecord(unwrapData(state))
  const conduitsData = unwrapData(conduits)
  const bandwidthData = asRecord(unwrapData(bandwidth))
  const conduitList = asArray<Record<string, unknown>>(conduitsData)

  const refresh = async () => {
    const [nextState, nextConduits, nextBandwidth] = await Promise.all([
      apiGet('/api/src/state'),
      apiGet('/api/src/conduits'),
      apiGet('/api/src/bandwidth'),
    ])
    const a = preferStoredSnapshot(nextState, pageState.state ?? nextState)
    const b = preferStoredSnapshot(nextConduits, pageState.conduits ?? nextConduits)
    const c = preferStoredSnapshot(nextBandwidth, pageState.bandwidth ?? nextBandwidth)
    setState(a)
    setConduits(b)
    setBandwidth(c)
    savePageState('src', { state: a, conduits: b, bandwidth: c, status })
    recordHistory({ page: 'src', action: 'refresh-src', output: { state: a, conduits: b, bandwidth: c }, note: 'SRC telemetry refreshed' })
  }

  useEffect(() => {
    setCurrentPage('src')
    void refresh()
  }, [])

  const runReach = async () => {
    setStatus('reaching...')
    try {
      const response = await apiPost('/api/src/reach', { targetLayer: layer, note: 'triggered from v5 ui' })
      setStatus('reach complete')
      setConduits(response)
      savePageState('src', { layer, status: 'reach complete', lastReachResponse: response, conduits: response })
      recordHistory({ page: 'src', action: 'reach', input: { targetLayer: layer }, output: response, note: 'Stellar reach initiated' })
      await refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Status" value={String(stateData.status ?? 'IDLE')} accent="var(--accent)" />
        <MetricCard label="Active Conduits" value={Number((stateData.activeConduits ?? conduitList.length) || 0)} accent="#10b981" />
        <MetricCard label="Total Signals" value={Number(stateData.totalSignals ?? 0)} accent="#a855f7" />
        <MetricCard label="Peak Reach" value={Number(stateData.peakReach ?? 0)} accent="#f59e0b" />
      </div>

      <Panel title="Stellar Reach Conduit" subtitle="SRC">
        <div className="flex flex-wrap items-center gap-2">
          <select value={layer} onChange={(e) => savePageState('src', { layer: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px]">
            <option value="CIVILIZATIONAL">CIVILIZATIONAL</option>
            <option value="EPOCHAL">EPOCHAL</option>
            <option value="CONTEXTUAL">CONTEXTUAL</option>
            <option value="INTER_SEAM">INTER_SEAM</option>
          </select>
          <Button onClick={() => void runReach()}>Initiate Reach</Button>
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
          <span className="text-[10px] text-[var(--muted)]">{status}</span>
        </div>
      </Panel>

      <div className="oct-grid-3">
        <Panel title="State" scrollable><KeyValueTable value={stateData} /></Panel>
        <Panel title="Conduits" scrollable>
          {conduitList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {conduitList.slice(0, 25).map((conduit, idx) => (
                <div key={`${String(conduit.id ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                  <div className="text-[10px] text-[var(--text)] font-mono">{String(conduit.id ?? `conduit-${idx + 1}`)}</div>
                  <div className="text-[9px] text-[var(--muted)]">{String(conduit.state ?? conduit.status ?? 'active')}</div>
                </div>
              ))}
            </div>
          ) : (
            <KeyValueTable value={conduitsData} />
          )}
        </Panel>
        <Panel title="Bandwidth" scrollable><KeyValueTable value={bandwidthData} /></Panel>
      </div>
    </div>
  )
}
