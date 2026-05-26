import { useMemo } from 'react'
import { MessageSquare, History, Database, Bot } from 'lucide-react'
import { Button } from '@components/controls/Button'
import { useV5CommandStore } from '@state/v5-command'
import { useAIStore } from '@state/ai'

function summarize(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `${value.length} item(s)`
  if (typeof value === 'object') return `${Object.keys(value as Record<string, unknown>).length} field(s)`
  return String(value)
}

export function V5CommandDock() {
  const {
    currentPage,
    pageState,
    history,
    selectedHistoryId,
    aiDraft,
    selectHistory,
    setAIDraft,
    askIonAI,
    clearHistory,
  } = useV5CommandStore()
  const { status, connected, messages } = useAIStore()

  const currentState = pageState[currentPage] ?? {}
  const selectedEntry = history.find((entry) => entry.id === selectedHistoryId) ?? null
  const currentFields = useMemo(() => Object.entries(currentState).slice(0, 10), [currentState])

  return (
    <aside className="hidden xl:flex xl:w-[320px] shrink-0 border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
      <div className="flex flex-col gap-3 p-3 w-full">
        <div className="rounded border border-[var(--border)] bg-[var(--surface2)] p-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[var(--accent)]">
            <Database size={12} />
            V6 Command State
          </div>
          <div className="mt-2 text-[10px] text-[var(--muted)]">Current page: {currentPage}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {currentFields.length === 0 && <div className="text-[10px] text-[var(--muted)]">No persisted inputs yet</div>}
            {currentFields.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-2 text-[10px] border-b border-[var(--border)] pb-1">
                <span className="text-[var(--muted)] uppercase tracking-wide">{key}</span>
                <span className="text-[var(--text)] text-right max-w-[170px] break-all">{summarize(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface2)] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[var(--accent)]">
              <History size={12} />
              Command History
            </div>
            <Button variant="ghost" size="xs" onClick={clearHistory}>Clear</Button>
          </div>
          <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {history.length === 0 && <div className="text-[10px] text-[var(--muted)]">No history recorded yet</div>}
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => selectHistory(entry.id)}
                className={`rounded border px-2 py-1.5 text-left ${selectedHistoryId === entry.id ? 'border-[var(--accent)] bg-[var(--bg)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
              >
                <div className="text-[10px] text-[var(--text)]">{entry.action}</div>
                <div className="text-[9px] text-[var(--muted)]">{entry.page} · {new Date(entry.ts).toLocaleTimeString('en', { hour12: false })}</div>
                {entry.note && <div className="text-[9px] text-[var(--muted)] mt-1">{entry.note}</div>}
              </button>
            ))}
          </div>
          {selectedEntry && (
            <div className="mt-2 rounded border border-[var(--border)] bg-[var(--bg)] p-2 text-[9px] text-[var(--muted)]">
              <div>Input: {summarize(selectedEntry.input)}</div>
              <div className="mt-1">Output: {summarize(selectedEntry.output)}</div>
            </div>
          )}
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface2)] p-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[var(--accent)]">
            <Bot size={12} />
            Ion AI Bridge
          </div>
          <div className="mt-2 text-[10px] text-[var(--muted)]">Status: {connected ? 'connected' : status}</div>
          <div className="text-[10px] text-[var(--muted)]">Messages: {messages.length}</div>
          <textarea
            value={aiDraft}
            onChange={(event) => setAIDraft(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[10px] text-[var(--text)] outline-none"
            placeholder="Ask Ion AI to analyze the current command state, use selected history, or plan the next action."
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => void askIonAI()} icon={<MessageSquare size={12} />}>Ask Ion AI</Button>
          </div>
        </div>
      </div>
    </aside>
  )
}