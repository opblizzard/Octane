import { useToastStore } from '@state/toast'
import clsx from 'clsx'
const COLORS = { info:'border-[var(--accent)] text-[var(--accent)]', success:'border-[#10b981] text-[#10b981]', warning:'border-[#f59e0b] text-[#f59e0b]', error:'border-[#ef4444] text-[#ef4444]' }
export function Toast() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} onClick={()=>dismiss(t.id)}
          className={clsx('pointer-events-auto px-4 py-2 rounded-md border bg-[var(--surface)] text-[11px] cursor-pointer transition-all', COLORS[t.type])}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
