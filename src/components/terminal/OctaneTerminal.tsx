import { useState, useRef, useCallback } from 'react'
import { Terminal, ChevronDown, ChevronUp, X } from 'lucide-react'
import clsx from 'clsx'

interface Line { id:string; ts:number; type:'info'|'warn'|'error'|'cmd'|'out'|'debug'|'input'|'output'|'success'; text:string }
interface Props { lines:Line[]; onCommand?:(cmd:string)=>void; defaultOpen?:boolean; title?:string; prompt?:string; placeholder?:string }
const C:Record<string,string>={ info:'text-[var(--muted)]', warn:'text-[#f59e0b]', error:'text-[#ef4444]', cmd:'text-[var(--accent)]', out:'text-[#10b981]', output:'text-[#10b981]', debug:'text-[#a855f7]', input:'text-[var(--accent)]', success:'text-[#10b981]' }

export function makeTerminalLine(type: Line['type'], text: string): Line {
  return { id: `tl-${Date.now()}-${Math.random().toString(36).slice(2)}`, ts: Date.now(), type, text }
}

export function OctaneTerminal({ lines, onCommand, defaultOpen=false, title='TERMINAL', prompt='$', placeholder='enter command...' }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const linesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    if (!input.trim()) return
    setHistory(h => [input, ...h].slice(0, 50))
    setHistIdx(-1)
    onCommand?.(input.trim())
    setInput('')
  }, [input, onCommand])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key==='Enter') { submit(); return }
    if (e.key==='ArrowUp') { const ni=Math.min(histIdx+1,history.length-1); setHistIdx(ni); setInput(history[ni]||'') }
    if (e.key==='ArrowDown') { const ni=Math.max(histIdx-1,-1); setHistIdx(ni); setInput(ni===-1?'':history[ni]||'') }
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg)] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 cursor-pointer select-none"
           onClick={()=>setOpen(o=>!o)}>
        <div className="flex items-center gap-2">
          <Terminal size={10} className="text-[var(--accent)]"/>
          <span className="text-[9px] tracking-widest uppercase text-[var(--accent)]">{title}</span>
          <span className="text-[9px] text-[var(--border2)]">{lines.length} lines</span>
        </div>
        {open ? <ChevronDown size={10} className="text-[var(--muted)]"/> : <ChevronUp size={10} className="text-[var(--muted)]"/>}
      </div>
      {/* Body */}
      {open && (
        <div className="flex flex-col" style={{ height:160 }}>
          <div ref={linesRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[10px] leading-relaxed space-y-0.5">
            {lines.map(l => (
              <div key={l.id} className={clsx('flex gap-2', C[l.type])}>
                <span className="text-[var(--border2)] shrink-0">{new Date(l.ts).toLocaleTimeString('en',{hour12:false})}</span>
                <span className="break-all">{l.text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[var(--border)]">
            <span className="text-[var(--accent)] text-[10px]">{prompt}❯</span>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
              className="flex-1 bg-transparent text-[10px] text-[var(--text)] outline-none placeholder-[var(--border2)] font-mono"
              placeholder={placeholder}/>
            <button onClick={()=>setInput('')}><X size={10} className="text-[var(--border2)] hover:text-[var(--muted)]"/></button>
          </div>
        </div>
      )}
    </div>
  )
}
