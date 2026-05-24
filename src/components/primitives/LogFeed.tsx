import { useEffect, useRef } from 'react'
import clsx from 'clsx'
export type LogLevel = 'info'|'warn'|'error'|'cmd'|'out'|'debug'|'ok'|'success'
export interface LogLine { id:string; ts?:number; timestamp?:number; type?:LogLevel; level?:string; text?:string; message?:string; source?:string }
export type LogEntry = LogLine
const C: Record<string,string> = { info:'text-[var(--muted)]', warn:'text-[#f59e0b]', error:'text-[#ef4444]', cmd:'text-[var(--accent)]', out:'text-[#10b981]', debug:'text-[#a855f7]', ok:'text-[#10b981]', success:'text-[#10b981]' }
export function LogFeed({ lines, entries, maxH='200px', className }: { lines?:LogLine[]; entries?:LogLine[]; maxH?:string; className?:string; autoScroll?:boolean }) {
  const items = entries ?? lines ?? []
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if(ref.current) ref.current.scrollTop=ref.current.scrollHeight }, [items])
  return (
    <div ref={ref} className={clsx('overflow-y-auto font-mono text-[10px] leading-relaxed space-y-0.5', className)} style={{ maxHeight:maxH }}>
      {items.map(l => {
        const ts = l.ts ?? l.timestamp
        const typeKey = l.type ?? l.level ?? 'info'
        const text = l.text ?? l.message ?? ''
        return (
          <div key={l.id} className={clsx('flex gap-2', C[typeKey] ?? 'text-[var(--muted)]')}>
            {ts && <span className="text-[var(--border2)] shrink-0">{new Date(ts).toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
            {l.source && <span className="text-[var(--border2)] shrink-0">[{l.source}]</span>}
            <span className="break-all">{text}</span>
          </div>
        )
      })}
    </div>
  )
}
