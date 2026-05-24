interface Option { value:string; label:string }
interface Props { value:string; options:Option[]; onChange:(v:string)=>void; label?:string; className?:string; accent?:string }
export function Select({ value, options, onChange, label, className }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className||''}`}>
      {label && <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{label}</span>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] text-[11px] rounded px-2 py-1 outline-none focus:border-[var(--accent)] cursor-pointer">
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
