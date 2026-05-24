import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asRecord, preferStoredSnapshot, unwrapData } from './ui'

export default function V5ExistenceLattice() {
  const pageState = useV5CommandStore((state) => state.pageState.elx ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const nodeId = String(pageState.nodeId ?? 'node-alpha')
  const payload = String(pageState.payload ?? '{"signal":"init"}')
  const [readResult, setReadResult] = useState<unknown>(pageState.readResult ?? null)
  const [snapshot, setSnapshot] = useState<unknown>(pageState.snapshot ?? null)
  const [coherence, setCoherence] = useState<unknown>(pageState.coherence ?? null)
  const readData = asRecord(unwrapData(readResult))
  const snapshotData = asRecord(unwrapData(snapshot))
  const coherenceData = asRecord(unwrapData(coherence))

  const refresh = async () => {
    const [nextSnapshot, nextCoherence] = await Promise.all([
      apiGet('/api/elx/snapshot'),
      apiGet('/api/elx/coherence'),
    ])
    const snap = preferStoredSnapshot(nextSnapshot, pageState.snapshot ?? nextSnapshot)
    const coh = preferStoredSnapshot(nextCoherence, pageState.coherence ?? nextCoherence)
    setSnapshot(snap)
    setCoherence(coh)
    savePageState('elx', { snapshot: snap, coherence: coh })
    recordHistory({ page: 'elx', action: 'refresh-lattice', output: { snapshot: snap, coherence: coh }, note: 'Lattice snapshot refreshed' })
  }

  useEffect(() => {
    setCurrentPage('elx')
    void refresh()
  }, [])

  const writeNode = async () => {
    let data: unknown = {}
    try {
      data = JSON.parse(payload)
    } catch {
      data = { raw: payload }
    }
    const response = await apiPost('/api/elx/write', { id: nodeId, data })
    setReadResult(response)
    savePageState('elx', { nodeId, payload, readResult: response })
    recordHistory({ page: 'elx', action: 'write-node', input: { id: nodeId, data }, output: response, note: 'Lattice node written' })
    await refresh()
  }

  const readNode = async () => {
    const response = await apiGet(`/api/elx/node/${encodeURIComponent(nodeId)}`)
    setReadResult(response)
    savePageState('elx', { nodeId, readResult: response })
    recordHistory({ page: 'elx', action: 'read-node', input: { id: nodeId }, output: response, note: 'Lattice node read' })
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Node Count" value={Number(snapshotData.nodeCount ?? 0)} accent="var(--accent)" />
        <MetricCard label="Total Weight" value={Number(snapshotData.totalWeight ?? 0)} accent="#10b981" />
        <MetricCard label="Coherence" value={Math.round(Number(snapshotData.coherence ?? coherenceData.coherence ?? 0) * 100)} unit="%" accent="#a855f7" />
        <MetricCard label="Snapshot" value={String(snapshotData.snapshotId ?? 'n/a')} accent="#f59e0b" />
      </div>

      <Panel title="Existence Lattice" subtitle="ELX">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={nodeId} onChange={(e) => savePageState('elx', { nodeId: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[180px]" placeholder="Node id" />
          <input value={payload} onChange={(e) => savePageState('elx', { payload: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[320px]" placeholder='{"signal":"init"}' />
          <Button onClick={() => void writeNode()}>Write Node</Button>
          <Button variant="outline" onClick={() => void readNode()}>Read Node</Button>
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
        </div>
      </Panel>
      <div className="oct-grid-3">
        <Panel title="Node Data" scrollable><KeyValueTable value={readData} /></Panel>
        <Panel title="Snapshot" scrollable><KeyValueTable value={snapshotData} /></Panel>
        <Panel title="Coherence" scrollable><KeyValueTable value={coherenceData} /></Panel>
      </div>
    </div>
  )
}
