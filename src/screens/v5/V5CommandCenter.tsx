import { useEffect, useMemo, useState } from 'react'
import { Panel } from '@components/primitives/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { Button } from '@components/controls/Button'
import { useV5CommandStore } from '@state/v5-command'
import { apiGet, apiPost } from './api'
import { KeyValueTable, StatusPill, asRecord, unwrapData } from './ui'

type HealthPayload = { data?: { engine?: string; version?: string; codename?: string } }
type MetricsPayload = { data?: { coherence?: number; activeFlows?: number; activeBridges?: number; latticeNodes?: number } }

export default function V5CommandCenter() {
  const pageState = useV5CommandStore((state) => state.pageState['command-center'] ?? {})
  const savePageState = useV5CommandStore((state) => state.savePageState)
  const recordHistory = useV5CommandStore((state) => state.recordHistory)
  const setCurrentPage = useV5CommandStore((state) => state.setCurrentPage)
  const [health, setHealth] = useState<HealthPayload | null>((pageState.health as HealthPayload | undefined) ?? null)
  const [metrics, setMetrics] = useState<MetricsPayload | null>((pageState.metrics as MetricsPayload | undefined) ?? null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState(String(pageState.lastAction ?? 'ready'))

  const refresh = async () => {
    setLoading(true)
    try {
      const [h, m] = await Promise.all([
        apiGet<HealthPayload>('/api/health'),
        apiGet<MetricsPayload>('/api/metrics'),
      ])
      setHealth(h)
      setMetrics(m)
      savePageState('command-center', { health: h, metrics: m, lastAction })
      recordHistory({ page: 'command-center', action: 'refresh', output: { health: h, metrics: m }, note: 'Command center state refreshed' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage('command-center')
    void refresh()
  }, [])

  const engineState = health?.data?.engine || 'UNKNOWN'
  const coherence = Math.round((metrics?.data?.coherence ?? 0) * 100)
  const healthData = asRecord(unwrapData(health))
  const metricData = asRecord(unwrapData(metrics))
  const subsystems = asRecord(healthData.subsystems)

  const cards = useMemo(() => ([
    { label: 'Engine', value: engineState },
    { label: 'Coherence', value: coherence, unit: '%' },
    { label: 'Active Flows', value: metrics?.data?.activeFlows ?? 0 },
    { label: 'Active Bridges', value: metrics?.data?.activeBridges ?? 0 },
  ]), [engineState, coherence, metrics?.data?.activeFlows, metrics?.data?.activeBridges])

  const ignite = async () => {
    setLastAction('igniting...')
    try {
      await apiPost('/api/engine/ignite', { initiatedBy: 'ui' })
      setLastAction('engine ignited')
      savePageState('command-center', { lastAction: 'engine ignited' })
      recordHistory({ page: 'command-center', action: 'ignite-engine', input: { initiatedBy: 'ui' }, note: 'Ignition requested from v5 command center' })
      await refresh()
    } catch (error) {
      setLastAction(error instanceof Error ? error.message : String(error))
    }
  }

  const contain = async () => {
    setLastAction('containment...')
    try {
      await apiPost('/api/engine/contain', { initiatedBy: 'ui' })
      setLastAction('containment acknowledged')
      savePageState('command-center', { lastAction: 'containment acknowledged' })
      recordHistory({ page: 'command-center', action: 'contain-engine', input: { initiatedBy: 'ui' }, note: 'Containment requested from v5 command center' })
      await refresh()
    } catch (error) {
      setLastAction(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="oct-screen">
      <div className="oct-grid-4">
        {cards.map((card) => (
          <MetricCard key={card.label} label={card.label} value={card.value as number | string} unit={card.unit} accent="var(--accent)" />
        ))}
      </div>

      <Panel title="Engine Controls" subtitle="v5 command center">
        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={() => void ignite()} loading={loading}>Ignite Engine</Button>
          <Button variant="outline" onClick={() => void contain()} loading={loading}>Emergency Contain</Button>
          <Button variant="secondary" onClick={() => void refresh()} loading={loading}>Refresh State</Button>
          <span className="text-[10px] text-[var(--muted)] self-center">Last action: {lastAction}</span>
          <StatusPill tone={engineState === 'DORMANT' ? 'warn' : 'ok'}>{engineState}</StatusPill>
        </div>
      </Panel>

      <div className="oct-grid-2">
        <Panel title="Health Snapshot" scrollable>
          <KeyValueTable value={healthData} />
          {Object.keys(subsystems).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(subsystems).map(([name, value]) => (
                <StatusPill key={name} tone={String(value).toUpperCase() === 'HEALTHY' ? 'ok' : 'warn'}>
                  {name}: {String(value)}
                </StatusPill>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Metrics Snapshot" scrollable>
          <KeyValueTable value={metricData} />
        </Panel>
      </div>
    </div>
  )
}
