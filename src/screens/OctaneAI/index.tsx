import React, { useEffect, useRef } from 'react'
import { Brain, Zap, Terminal as TerminalIcon, Send, RefreshCw, Trash2 } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { Button } from '@components/controls/Button'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { MetricCard } from '@components/primitives/MetricCard'
import { ChatMessage } from '@components/ai/ChatMessage'
import { ChatInput } from '@components/ai/ChatInput'
import { AIModules } from '@components/ai/AIModules'
import { OctaneTerminal, makeTerminalLine } from '@components/terminal/OctaneTerminal'
import { useAIStore } from '@state/ai'
import { useCFStore } from '@state/cloudflare'
import { resolveApiUrl } from '@sdk/runtime'

export default function OctaneAI() {
  const ai   = useAIStore()
  const cf   = useCFStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [termLines, setTermLines] = React.useState(() => [
    makeTerminalLine('info',   'Octane AI — Ion AI architecture'),
    makeTerminalLine('info',   'Sovereign intelligence core initialised'),
    makeTerminalLine('info',   'Model: @cf/meta/llama-3.1-8b-instruct'),
    makeTerminalLine('success','Ready. Type "help" for commands.'),
  ])

  // Connect to AI WebSocket session
  useEffect(() => {
    cf.connect()
    ai.connect()
    return () => { /* sessions persist for continuity */ }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [ai.messages])

  // Sync store terminal logs
  useEffect(() => {
    const newLines = ai.terminalLogs.map(l => makeTerminalLine('output', l))
    setTermLines(prev => {
      const existingIds = new Set(prev.map(l => l.id))
      const fresh = newLines.filter(l => !existingIds.has(l.id))
      return [...prev, ...fresh].slice(-400)
    })
  }, [ai.terminalLogs])

  const handleCommand = (cmd: string) => {
    const line = makeTerminalLine('input', cmd)
    setTermLines(p => [...p, line])
    const c = cmd.trim().toLowerCase()

    if (c === 'help') {
      setTermLines(p => [...p,
        makeTerminalLine('info', 'Commands: status · clear · reset · model · ctx · tokens · ping'),
      ])
    } else if (c === 'status') {
      setTermLines(p => [...p,
        makeTerminalLine('info', `Connected:  ${ai.connected}`),
        makeTerminalLine('info', `Messages:   ${ai.messages.length}`),
        makeTerminalLine('info', `Tokens:     ${ai.tokenCount}`),
        makeTerminalLine('info', `Streaming:  ${ai.isStreaming}`),
        makeTerminalLine('info', `CF Colo:    ${cf.colo || '—'}`),
      ])
    } else if (c === 'clear') {
      ai.clearMessages()
      setTermLines(p => [...p, makeTerminalLine('success', 'Chat history cleared.')])
    } else if (c === 'reset') {
      ai.clearMessages()
      ai.connect()
      setTermLines(p => [...p, makeTerminalLine('success', 'Session reset. Reconnecting…')])
    } else if (c === 'ctx' || c === 'tokens') {
      setTermLines(p => [...p,
        makeTerminalLine('info', `Token usage: ${ai.tokenCount} / 8192`),
        makeTerminalLine('info', `Context window: ${((ai.tokenCount / 8192) * 100).toFixed(1)}% used`),
      ])
    } else if (c === 'ping') {
      const t0 = Date.now()
      fetch(resolveApiUrl('/api/ai'), { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[{role:'user',content:'ping'}], stream:false })
      }).then(() => {
        setTermLines(p => [...p, makeTerminalLine('success', `Pong! ${Date.now()-t0}ms`)])
      }).catch(() => {
        setTermLines(p => [...p, makeTerminalLine('error', 'API unreachable (worker not running?)')])
      })
    } else if (c.startsWith('say ') || c.startsWith('ask ')) {
      ai.sendMessage(cmd.slice(4).trim())
      setTermLines(p => [...p, makeTerminalLine('success', 'Message sent to Ion AI.')])
    } else {
      setTermLines(p => [...p, makeTerminalLine('error', `Unknown: ${cmd}. Type "help".`)])
    }
  }

  const ctxPct = Math.min((ai.tokenCount / 8192) * 100, 100)
  const isEmpty = ai.messages.length === 0

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Brain size={14} className="text-emerald flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-emerald tracking-widest">OCTANE AI</span>
          <span className="font-mono text-[8px] text-muted hidden sm:block">— ION AI ARCHITECTURE · SOVEREIGN INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={ai.connected ? 'ok' : 'warn'}
            label={ai.connected ? 'CONNECTED' : 'OFFLINE'} pulse={ai.connected}/>
          <StatusBadge status={ai.isStreaming ? 'info' : 'ok'}
            label={ai.isStreaming ? 'STREAMING' : 'IDLE'} pulse={ai.isStreaming}/>
          <Button variant="ghost" size="xs" icon={<RefreshCw size={9}/>}
            onClick={() => { ai.connect() }}>
            RECONNECT
          </Button>
          <Button variant="ghost" size="xs" icon={<Trash2 size={9}/>}
            onClick={() => ai.clearMessages()}>
            CLEAR
          </Button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex gap-2 flex-1 min-h-0 min-w-0 overflow-hidden">

        {/* LEFT — AI Modules sidebar */}
        <div className="w-[180px] flex-shrink-0 min-h-0 overflow-y-auto oct-scroll">
          <AIModules/>
        </div>

        {/* CENTER — Chat area */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* Context bar */}
          <Panel accent="emerald" className="min-w-0 py-1.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="oct-label text-muted flex-shrink-0">CTX</span>
              <div className="flex-1 min-w-0">
                <ProgressBar value={ctxPct} accent={ctxPct > 85 ? 'rose' : ctxPct > 60 ? 'amber' : 'emerald'} height="sm"/>
              </div>
              <span className="font-mono text-[8px] text-muted flex-shrink-0">{ai.tokenCount} / 8192</span>
              <span className="font-mono text-[8px] text-muted flex-shrink-0 hidden sm:block">TOKENS</span>
            </div>
          </Panel>

          {/* Message list */}
          <Panel accent="emerald" noPad flex className="flex-1 min-h-0 min-w-0 overflow-hidden">
            <div ref={scrollRef} className="flex flex-col gap-1 p-2 overflow-y-auto flex-1 min-h-0 oct-scroll">
              {isEmpty && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 opacity-40 select-none">
                  <Brain size={40} className="text-emerald"/>
                  <div className="font-mono text-xs text-emerald text-center tracking-widest">
                    ION AI CORE READY<br/>
                    <span className="text-[8px] text-muted font-normal">Send a message to begin your session</span>
                  </div>
                </div>
              )}
              {ai.messages.map(msg => (
                <ChatMessage key={msg.id} message={msg}/>
              ))}
              {ai.pendingMessage && (
                <ChatMessage
                  message={{
                    id:        '__pending__',
                    role:      'assistant',
                    content:   ai.pendingMessage,
                    timestamp: Date.now(),
                    streaming: true,
                  }}
                />
              )}
            </div>
          </Panel>

          {/* Chat input */}
          <Panel accent="emerald" noPad className="min-w-0 flex-shrink-0">
            <ChatInput
              onSend={msg => ai.sendMessage(msg)}
              onStop={() => ai.stopStreaming()}
              isStreaming={ai.isStreaming}
              placeholder="Ask Ion AI anything — your sovereign intelligence system…"
            />
          </Panel>

          {/* Terminal */}
          <Panel title="AI TERMINAL" accent="emerald" noPad className="min-w-0 h-[130px] flex-shrink-0">
            <OctaneTerminal
              lines={termLines}
              onCommand={handleCommand}
              prompt="ion-ai"
              placeholder="status · clear · reset · ping · say <message> · help"
            />
          </Panel>
        </div>

        {/* RIGHT — Stats */}
        <div className="w-[160px] flex-shrink-0 min-h-0 overflow-y-auto oct-scroll flex flex-col gap-2">

          <Panel title="ION AI METRICS" accent="emerald" className="min-w-0">
            <div className="flex flex-col gap-1.5 min-w-0">
              {[
                { label:'MESSAGES', value: String(ai.messages.length),  color:'text-emerald' },
                { label:'TOKENS',   value: String(ai.tokenCount),        color:'text-cyan'    },
                { label:'CTX %',    value: `${ctxPct.toFixed(1)}%`,      color: ctxPct > 80 ? 'text-rose' : 'text-amber' },
                { label:'SESSION',  value: ai.sessionId?.slice(0,8) ?? '—', color:'text-muted' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-1 min-w-0">
                  <span className="oct-label text-muted truncate-safe">{label}</span>
                  <span className={`font-mono text-[9px] font-bold flex-shrink-0 ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="CF EDGE" accent="cyan" className="min-w-0">
            <div className="flex flex-col gap-1.5 min-w-0">
              {[
                { label:'COLO',  value: cf.colo || '—',           color:'text-cyan'    },
                { label:'P50',   value: cf.p50Lat ? `${cf.p50Lat}ms` : '—', color:'text-emerald' },
                { label:'CPU',   value: `${cf.cpuMs.toFixed(1)}ms`, color:'text-violet' },
                { label:'CONNS', value: String(cf.activeConns),    color:'text-amber'   },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-1 min-w-0">
                  <span className="oct-label text-muted truncate-safe">{label}</span>
                  <span className={`font-mono text-[9px] font-bold flex-shrink-0 ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="MODEL" accent="violet" className="min-w-0">
            <div className="flex flex-col gap-1">
              <StatusBadge status="ok" label="llama-3.1-8b" pulse/>
              <div className="font-mono text-[7px] text-muted mt-1">@cf/meta/llama-3.1-8b-instruct</div>
              <div className="font-mono text-[7px] text-emerald">Ionirix Grade</div>
              <div className="font-mono text-[7px] text-cyan">Sovereign Core ✓</div>
            </div>
          </Panel>

          <Panel title="CAPABILITIES" accent="amber" className="min-w-0">
            {[
              'Edge Inference',
              'Streaming Tokens',
              'Session Memory',
              'Code Synthesis',
              'Markdown Output',
              'Multi-turn Dialog',
              'System Reasoning',
            ].map(cap => (
              <div key={cap} className="flex items-center gap-1.5 py-0.5">
                <div className="w-1 h-1 rounded-full bg-emerald flex-shrink-0"/>
                <span className="font-mono text-[7px] text-[var(--oct-text-secondary)]">{cap}</span>
              </div>
            ))}
          </Panel>

          <Panel title="QUICK PROMPTS" accent="cyan" className="min-w-0">
            {[
              'Explain CF Workers',
              'Optimize this code',
              'Draft a system spec',
              'Debug this error',
              'Describe my colo',
            ].map(q => (
              <button key={q} onClick={() => ai.sendMessage(q)}
                className="w-full text-left font-mono text-[7px] text-muted hover:text-cyan
                  border-b border-[var(--oct-border-subtle)] last:border-0 py-0.5 px-0.5
                  hover:bg-[color:var(--oct-accent-cyan)]/5 rounded transition-colors truncate-safe min-w-0">
                {q}
              </button>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}
