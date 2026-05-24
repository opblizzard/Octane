import { useEffect, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, asArray, asRecord, preferStoredSnapshot, unwrapData } from './ui'

export default function V5AscensionNode() {
  const pageState = useV5CommandStore((state) => state.pageState.oan ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [stages, setStages] = useState<unknown>(pageState.stages ?? null)
  const [decrees, setDecrees] = useState<unknown>(pageState.decrees ?? null)
  const [ethics, setEthics] = useState<unknown>(pageState.ethics ?? null)
  const stageList = asArray<Record<string, unknown>>(unwrapData(stages))
  const decreeList = asArray<Record<string, unknown>>(unwrapData(decrees))
  const ethicsList = asArray<Record<string, unknown>>(unwrapData(ethics))
  const currentStage = stageList.find((s) => Boolean(s.completed) === false) ?? stageList[0]

  const refresh = async () => {
    const [nextStages, nextDecrees, nextEthics] = await Promise.all([
      apiGet('/api/oan/stages'),
      apiGet('/api/oan/decrees'),
      apiGet('/api/oan/ethics/log'),
    ])
    const s = preferStoredSnapshot(nextStages, pageState.stages ?? nextStages)
    const d = preferStoredSnapshot(nextDecrees, pageState.decrees ?? nextDecrees)
    const e = preferStoredSnapshot(nextEthics, pageState.ethics ?? nextEthics)
    setStages(s)
    setDecrees(d)
    setEthics(e)
    savePageState('oan', { stages: s, decrees: d, ethics: e })
    recordHistory({ page: 'oan', action: 'refresh-oan', output: { stages: s, decrees: d, ethics: e }, note: 'OAN state refreshed' })
  }

  useEffect(() => {
    setCurrentPage('oan')
    void refresh()
  }, [])

  const advance = async () => {
    const response = await apiPost('/api/oan/stage/advance', { reason: 'manual promotion' })
    savePageState('oan', { lastAdvance: response })
    recordHistory({ page: 'oan', action: 'advance-stage', input: { reason: 'manual promotion' }, note: 'Operator stage advance requested' })
    await refresh()
  }

  const signOath = async () => {
    const response = await apiPost('/api/oan/oath/sign', { operator: 'ui' })
    savePageState('oan', { lastOath: response })
    recordHistory({ page: 'oan', action: 'sign-oath', input: { operator: 'ui' }, note: 'Sovereign oath signature requested' })
    await refresh()
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        <MetricCard label="Current Stage" value={Number(currentStage?.stage ?? 0)} accent="var(--accent)" />
        <MetricCard label="Completed Stages" value={stageList.filter((s) => Boolean(s.completed)).length} accent="#10b981" />
        <MetricCard label="Decrees" value={decreeList.length} accent="#a855f7" />
        <MetricCard label="Ethics Checks" value={ethicsList.length} accent="#f59e0b" />
      </div>

      <Panel title="Operator Ascension Node" subtitle="OAN">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void advance()}>Advance Stage</Button>
          <Button variant="outline" onClick={() => void signOath()}>Sign Oath</Button>
          <Button variant="secondary" onClick={() => void refresh()}>Refresh</Button>
        </div>
      </Panel>

      <div className="oct-grid-3">
        <Panel title="Stages" scrollable>
          <div className="flex flex-col gap-2">
            {stageList.length === 0 && <div className="text-[11px] text-[var(--muted)]">No ascension stages available</div>}
            {stageList.map((stage, idx) => (
              <div key={`${String(stage.stage ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                <div className="text-[10px] text-[var(--text)]">Stage {String(stage.stage ?? idx + 1)} · {String(stage.name ?? 'Untitled')}</div>
                <div className="text-[9px] text-[var(--muted)]">{String(stage.description ?? '')}</div>
                <div className="text-[9px] mt-1" style={{ color: Boolean(stage.completed) ? '#10b981' : '#f59e0b' }}>
                  {Boolean(stage.completed) ? 'Completed' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Decrees" scrollable>
          {decreeList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {decreeList.slice(0, 24).map((decree, idx) => (
                <div key={`${String(decree.id ?? decree.decreId ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                  <div className="text-[10px] text-[var(--text)]">{String(decree.title ?? 'Decree')}</div>
                  <div className="text-[9px] text-[var(--muted)]">{String(decree.body ?? decree.rationale ?? '')}</div>
                </div>
              ))}
            </div>
          ) : (
            <KeyValueTable value={asRecord(unwrapData(decrees))} />
          )}
        </Panel>
        <Panel title="Ethics Log" scrollable>
          {ethicsList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {ethicsList.slice(0, 24).map((entry, idx) => (
                <div key={`${String(entry.checkId ?? idx)}`} className="rounded border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5">
                  <div className="text-[10px] text-[var(--text)]">{String(entry.action ?? 'Action')}</div>
                  <div className="text-[9px]" style={{ color: String(entry.verdict ?? '').toUpperCase() === 'PERMITTED' ? '#10b981' : '#f59e0b' }}>
                    {String(entry.verdict ?? 'UNKNOWN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <KeyValueTable value={asRecord(unwrapData(ethics))} />
          )}
        </Panel>
      </div>
    </div>
  )
}
