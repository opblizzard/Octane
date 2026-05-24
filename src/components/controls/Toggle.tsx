interface Props { value?:boolean; checked?:boolean; onChange:(v:boolean)=>void; label?:string; color?:string; accent?:string; size?:'sm'|'md'|'lg' }
export function Toggle({ value, checked, onChange, label, color, accent, size='md' }: Props) {
  const on = value ?? checked ?? false
  const resolvedColor = color ?? (accent ? `var(--oct-accent-${accent})` : 'var(--accent)')
  const dims = size === 'sm' ? { trackW: 28, trackH: 14, knob: 10, leftOn: 'calc(100% - 12px)', leftOff: '2px' }
    : size === 'lg' ? { trackW: 36, trackH: 18, knob: 14, leftOn: 'calc(100% - 16px)', leftOff: '2px' }
    : { trackW: 32, trackH: 16, knob: 12, leftOn: 'calc(100% - 14px)', leftOff: '2px' }
  return (
    <button onClick={()=>onChange(!on)} className="flex items-center gap-2 select-none group">
      <div className="relative rounded-full transition-colors" style={{ width:dims.trackW, height:dims.trackH, background:on?resolvedColor:'var(--border)' }}>
        <div className="absolute top-0.5 rounded-full bg-white shadow transition-all" style={{ width:dims.knob, height:dims.knob, left:on?dims.leftOn:dims.leftOff }}/>
      </div>
      {label && <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--text)]">{label}</span>}
    </button>
  )
}
