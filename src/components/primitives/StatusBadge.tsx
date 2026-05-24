import clsx from 'clsx'
export type Status = 'healthy'|'active'|'running'|'degraded'|'warning'|'down'|'error'|'idle'|'complete'|'ok'|'warn'|'crit'|'info'
const COLOR:Record<Status,string> = {
  healthy:'#10b981', active:'#10b981', running:'#00f5ff', complete:'#10b981', ok:'#10b981',
  degraded:'#f59e0b', warning:'#f59e0b', warn:'#f59e0b', info:'#00f5ff',
  down:'#ef4444', error:'#ef4444', crit:'#ef4444', idle:'#8fa3bc'
}
export function StatusBadge({ status, label, pulse=true, size='md' }: { status:Status; label?:string; pulse?:boolean; size?:'sm'|'md'|'lg' }) {
  const c = COLOR[status] || '#8fa3bc'
  const dot = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'
  const textClass = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx(dot, 'rounded-full shrink-0', pulse && (status==='running'||status==='active'||status==='info') && 'animate-pulse')}
            style={{ background:c, boxShadow:`0 0 6px ${c}` }} />
      {label && <span className={textClass} style={{ color:c }}>{label}</span>}
    </span>
  )
}
