import { ReactNode } from 'react'

type AnyRecord = Record<string, unknown>

export function unwrapData<T = unknown>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as AnyRecord)) {
    return ((payload as AnyRecord).data as T)
  }
  return payload as T
}

export function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {}
}

export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  const rec = asRecord(value)
  if (Array.isArray(rec.items)) return rec.items as T[]
  if (Array.isArray(rec.list)) return rec.list as T[]
  return []
}

export function hasMeaningfulContent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    const record = value as AnyRecord
    const entries = Object.entries(record)
    if (entries.length === 0) return false
    return entries.some(([, nested]) => hasMeaningfulContent(nested))
  }
  return true
}

export function preferStoredSnapshot<T>(fetched: T, stored: T): T {
  return hasMeaningfulContent(fetched) ? fetched : stored
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function KeyValueTable({
  value,
  emptyLabel = 'No data available',
  maxRows = 24,
}: {
  value: unknown
  emptyLabel?: string
  maxRows?: number
}) {
  const entries = Object.entries(asRecord(value)).slice(0, maxRows)
  if (entries.length === 0) {
    return <div className="text-[11px] text-[var(--muted)]">{emptyLabel}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <tbody>
          {entries.map(([key, raw]) => (
            <tr key={key} className="border-b border-[var(--border)] align-top">
              <td className="py-1.5 pr-3 text-[var(--muted)] uppercase tracking-wide">{key}</td>
              <td className="py-1.5 text-[var(--text)] font-mono break-all">{formatValue(raw)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' }) {
  const colors = {
    neutral: 'text-[var(--muted)] border-[var(--border)] bg-[var(--surface2)]',
    ok: 'text-[#10b981] border-[#10b98155] bg-[#10b98110]',
    warn: 'text-[#f59e0b] border-[#f59e0b55] bg-[#f59e0b10]',
  }

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] uppercase tracking-wider ${colors[tone]}`}>
      {children}
    </span>
  )
}
