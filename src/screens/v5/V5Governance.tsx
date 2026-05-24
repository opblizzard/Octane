import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asArray, asRecord, preferStoredSnapshot, unwrapData } from './ui'

export default function V5Governance() {
  const pageState = useV5CommandStore((state) => state.pageState.governance ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [charter, setCharter] = useState<unknown>(pageState.charter ?? null)
  const [lifecycle, setLifecycle] = useState<unknown>(pageState.lifecycle ?? null)
  const [decrees, setDecrees] = useState<unknown>(pageState.decrees ?? null)
  const title = String(pageState.title ?? 'Operational Directive')
  const body = String(pageState.body ?? 'Preserve coherence and operator safety.')
  const charterData = asRecord(unwrapData(charter))
  const lifecycleData = asRecord(unwrapData(lifecycle))
  const decreeList = asArray<Record<string, unknown>>(unwrapData(decrees))

  const refresh = async () => {
    const [nextCharter, nextLifecycle, nextDecrees] = await Promise.all([
      apiGet('/api/governance/charter'),
      apiGet('/api/governance/lifecycle'),
      apiGet('/api/governance/decrees'),
    ])
    const c = preferStoredSnapshot(nextCharter, pageState.charter ?? nextCharter)
    const l = preferStoredSnapshot(nextLifecycle, pageState.lifecycle ?? nextLifecycle)
    const d = preferStoredSnapshot(nextDecrees, pageState.decrees ?? nextDecrees)
    setCharter(c)
    setLifecycle(l)
    setDecrees(d)
    savePageState('governance', { charter: c, lifecycle: l, decrees: d, title, body })
    recordHistory({ page: 'governance', action: 'refresh-governance', output: { charter: c, lifecycle: l, decrees: d }, note: 'Governance state refreshed' })
  }

  useEffect(() => {
    setCurrentPage('governance')
    void refresh()
  }, [])

  const issue = async () => {
    const response = await apiPost('/api/governance/decree', { title, body, issuedBy: 'operator-ui' })
    savePageState('governance', { title, body, lastIssuedDecree: response })
    recordHistory({ page: 'governance', action: 'issue-decree', input: { title, body, issuedBy: 'operator-ui' }, output: response, note: 'Governance decree issued' })
    await refresh()
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Charter Articles" value={asArray(charterData.articles).length} accent="var(--accent)" />
        <MetricCard label="Governance Phase" value={String(lifecycleData.phase ?? '-')} accent="#10b981" />
        <MetricCard label="Decrees" value={decreeList.length} accent="#a855f7" />
        <MetricCard label="Version" value={String(lifecycleData.version ?? '5.0.0')} accent="#f59e0b" />
      </div>

      <Panel title="Governance" subtitle="charter and decrees">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={title} onChange={(e) => savePageState('governance', { title: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[220px]" placeholder="Decree title" />
          <input value={body} onChange={(e) => savePageState('governance', { body: e.target.value })} className="bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[11px] min-w-[360px]" placeholder="Decree body" />
          <Button onClick={() => void issue()}>Issue Decree</Button>
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
        </div>
      </Panel>

      <div className="oct-grid-3">
        <Panel title="Charter" scrollable>
          {asArray<Record<string, unknown>>(charterData.articles).length > 0 ? (
            <div className="flex flex-col gap-2">
              {asArray<Record<string, unknown>>(charterData.articles).map((article, idx) => (
                <div key={`${String(article.id ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                  <div className="text-[10px] text-[var(--text)]">Article {String(article.id ?? idx + 1)} · {String(article.title ?? 'Untitled')}</div>
                  <div className="text-[9px] text-[var(--muted)]">{String(article.body ?? article.summary ?? '')}</div>
                </div>
              ))}
            </div>
          ) : (
            <KeyValueTable value={charterData} />
          )}
        </Panel>
        <Panel title="Lifecycle" scrollable><KeyValueTable value={lifecycleData} /></Panel>
        <Panel title="Decrees" scrollable>
          {decreeList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {decreeList.slice(0, 24).map((decree, idx) => (
                <div key={`${String(decree.id ?? decree.decreId ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                  <div className="text-[10px] text-[var(--text)]">{String(decree.title ?? 'Decree')}</div>
                  <div className="text-[9px] text-[var(--muted)]">{String(decree.body ?? '')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[var(--muted)]">No decrees issued</div>
          )}
        </Panel>
      </div>
    </div>
  )
}
