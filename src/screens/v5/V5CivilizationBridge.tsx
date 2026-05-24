import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asArray, asRecord, preferStoredSnapshot, unwrapData } from './ui'

export default function V5CivilizationBridge() {
  const pageState = useV5CommandStore((state) => state.pageState.cbe ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [bridges, setBridges] = useState<unknown>(pageState.bridges ?? null)
  const fromCiv = String(pageState.fromCiv ?? 'Alpha')
  const toCiv = String(pageState.toCiv ?? 'Omega')
  const source = String(pageState.source ?? 'Signal transfer request')
  const activeBridgeId = String(pageState.activeBridgeId ?? '')
  const [result, setResult] = useState<unknown>(pageState.result ?? null)
  const bridgeData = unwrapData(bridges)
  const bridgeList = asArray<Record<string, unknown>>(bridgeData)
  const resultData = asRecord(unwrapData(result))

  const refresh = async () => {
    const fetched = await apiGet('/api/cbe/bridges')
    const list = preferStoredSnapshot(fetched, pageState.bridges ?? fetched)
    setBridges(list)
    savePageState('cbe', { bridges: list })
    recordHistory({ page: 'cbe', action: 'refresh-bridges', output: list, note: 'CBE bridge list refreshed' })
  }

  useEffect(() => {
    setCurrentPage('cbe')
    void refresh()
  }, [])

  const openBridge = async () => {
    const opened = await apiPost('/api/cbe/bridge/open', {
      fromCiv,
      toCiv,
      fromEpoch: 1000,
      toEpoch: 1200,
    })
    setResult(opened)
    savePageState('cbe', { result: opened, fromCiv, toCiv })
    recordHistory({ page: 'cbe', action: 'open-bridge', input: { fromCiv, toCiv }, output: opened, note: 'Bridge opened from v5 CBE panel' })
    const id = (opened as { data?: { id?: string } })?.data?.id
    if (id) savePageState('cbe', { activeBridgeId: id })
    await refresh()
  }

  const translate = async () => {
    if (!activeBridgeId) return
    const translated = await apiPost('/api/cbe/translate', { bridgeId: activeBridgeId, source })
    setResult(translated)
    savePageState('cbe', { result: translated, activeBridgeId, source })
    recordHistory({ page: 'cbe', action: 'translate-bridge', input: { bridgeId: activeBridgeId, source }, output: translated, note: 'Translation executed from v5 CBE panel' })
    await refresh()
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Active Bridges" value={bridgeList.length} accent="var(--accent)" />
        <MetricCard label="Selected Bridge" value={activeBridgeId || 'none'} accent="#10b981" />
        <MetricCard label="From" value={fromCiv} accent="#a855f7" />
        <MetricCard label="To" value={toCiv} accent="#f59e0b" />
      </div>

      <Panel title="Civilization Bridge Engine" subtitle="CBE">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={fromCiv} onChange={(e) => savePageState('cbe', { fromCiv: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px]" placeholder="From civilization" />
          <input value={toCiv} onChange={(e) => savePageState('cbe', { toCiv: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px]" placeholder="To civilization" />
          <Button onClick={() => void openBridge()}>Open Bridge</Button>
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-2">
          <input value={activeBridgeId} onChange={(e) => savePageState('cbe', { activeBridgeId: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[220px]" placeholder="Bridge ID" />
          <input value={source} onChange={(e) => savePageState('cbe', { source: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[240px]" placeholder="Source text" />
          <Button variant="outline" onClick={() => void translate()}>Translate</Button>
        </div>
      </Panel>
      <div className="oct-grid-2">
        <Panel title="Active Bridges" scrollable>
          {bridgeList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left py-1.5 pr-2">Bridge</th>
                    <th className="text-left py-1.5 pr-2">From</th>
                    <th className="text-left py-1.5 pr-2">To</th>
                    <th className="text-left py-1.5 pr-2">State</th>
                    <th className="text-left py-1.5">Coherence</th>
                  </tr>
                </thead>
                <tbody>
                  {bridgeList.slice(0, 40).map((bridge, idx) => (
                    <tr key={`${String(bridge.id ?? idx)}`} className="border-b border-[var(--border)]">
                      <td className="py-1.5 pr-2 font-mono">{String(bridge.id ?? '-')}</td>
                      <td className="py-1.5 pr-2">{String(bridge.fromCiv ?? '-')}</td>
                      <td className="py-1.5 pr-2">{String(bridge.toCiv ?? '-')}</td>
                      <td className="py-1.5 pr-2">{String(bridge.state ?? '-')}</td>
                      <td className="py-1.5">{String(bridge.coherence ?? '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <KeyValueTable value={bridgeData} />
          )}
        </Panel>
        <Panel title="Last Result" scrollable><KeyValueTable value={resultData} /></Panel>
      </div>
    </div>
  )
}
