import { ReactNode } from 'react'
import clsx from 'clsx'
type Variant = 'primary'|'secondary'|'ghost'|'danger'|'outline'
interface Props { children?:ReactNode; variant?:Variant; onClick?:()=>void; disabled?:boolean; loading?:boolean; className?:string; size?:'xs'|'sm'|'md'; icon?:ReactNode }
const V:Record<Variant,string>={
  primary:'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90',
  secondary:'bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--border2)]',
  ghost:'bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
  danger:'bg-transparent text-[#ef4444] border border-[#ef4444] hover:bg-[#ef444420]',
  outline:'bg-transparent text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)]/10',
}
export function Button({ children, variant='primary', onClick, disabled, loading, className, size='md', icon }: Props) {
  return (
    <button onClick={onClick} disabled={disabled||loading}
      className={clsx('inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all select-none',
        size==='xs'?'px-1.5 py-0.5 text-[9px]':size==='sm'?'px-2 py-1 text-[10px]':'px-3 py-1.5 text-[11px]',
        V[variant], (disabled||loading)&&'opacity-40 cursor-not-allowed', className)}>
      {loading && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>}
      {icon && !loading && icon}
      {children}
    </button>
  )
}
