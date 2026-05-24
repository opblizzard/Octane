import { useRef, useState } from 'react'
import { useAIStore } from '@state/ai'
import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { Toggle } from '@components/controls/Toggle'
import { OctaneTerminal } from '@components/terminal/OctaneTerminal'
import { Send, Trash2, Zap } from 'lucide-react'

export default function OctaneAI() {
  const { messages, streaming, streamBuffer, modules, terminalLines, sendMessage, clearMessages, addTerminalLine, toggleModule } = useAIStore()
  const { chaos } = useChaosStore()
  const color = getChaosColor(chaos)
  const [input, setInput] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  const onSend = async () => {
    if (!input.trim() || streaming) return
    const txt = input.trim()
    setInput('')
    await sendMessage(txt)
    setTimeout(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight }, 50)
  }

  const ROLE_COLOR: Record<string, string> = { user: 'var(--accent)', assistant: '#10b981', system: 'var(--muted)' }

  return (
    <div className="flex flex-col md:flex-row gap-3 min-h-full">
      {/* Left: Modules */}
      <div className="flex flex-col gap-3 w-full md:w-52 md:shrink-0">
        <Panel title="Ion AI Modules" accent={color}>
          <div className="flex flex-col gap-2">
            {modules.map(m => (
              <div key={m.id} className="flex flex-col gap-1 p-2 rounded bg-[var(--surface2)] border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium" style={{ color: m.active ? color : 'var(--muted)' }}>{m.name}</span>
                  <Toggle value={m.active} onChange={() => toggleModule(m.id)} color={color}/>
                </div>
                <span className="text-[9px] text-[var(--muted)]">{m.description}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Chaos State">
          <div className="flex flex-col gap-2 text-[10px]">
            {[
              { label: 'Chaos',    value: `${(chaos*100).toFixed(0)}%`,                            color },
              { label: 'Strategy', value: 'balanced',                                                color: 'var(--muted)' },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-[var(--muted)]">{r.label}</span>
                <span style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Center: Chat */}
      <div className="flex flex-col w-full md:flex-1 min-h-0 min-w-0 gap-3">
        <Panel title="Ion AI — Sovereign Intelligence" accent={color} className="flex-1 min-h-0" scrollable={false} noPad>
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3" style={{ maxHeight: 'calc(100% - 60px)' }}>
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLOR[m.role] }}/>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: ROLE_COLOR[m.role] }}>{m.role}</span>
                  {m.chaos !== undefined && <span className="text-[8px] text-[var(--border2)]">chaos={Math.round(m.chaos*100)}%</span>}
                </div>
                <div className={`max-w-[85%] px-3 py-2 rounded-md text-[11px] leading-relaxed border ${m.role==='user'?'bg-[var(--surface2)] border-[var(--border2)]':'bg-[var(--surface)] border-[var(--border)]'}`}
                     style={m.role==='user'?{}:{ borderColor: `${color}30` }}>
                  {m.content}
                </div>
              </div>
            ))}
            {streaming && streamBuffer && (
              <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }}/>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color }}>streaming</span>
                </div>
                <div className="max-w-[85%] px-3 py-2 rounded-md text-[11px] leading-relaxed border bg-[var(--surface)]"
                     style={{ borderColor: `${color}30` }}>
                  {streamBuffer}<span className="animate-pulse">▌</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-[var(--border)]">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
              className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded px-3 py-1.5 text-[11px] text-[var(--text)] outline-none placeholder-[var(--border2)]"
              style={{ '--tw-ring-color': color } as React.CSSProperties}
              placeholder="Message Ion AI..." disabled={streaming}/>
            <Button variant="primary" onClick={onSend} loading={streaming} disabled={!input.trim()}>
              <Send size={12}/>
            </Button>
            <Button variant="ghost" onClick={clearMessages}><Trash2 size={12}/></Button>
          </div>
        </Panel>

        <OctaneTerminal lines={terminalLines} title="ION AI TERMINAL"
          onCommand={cmd => { addTerminalLine('cmd', `> ${cmd}`); sendMessage(cmd) }}/>
      </div>
    </div>
  )
}
