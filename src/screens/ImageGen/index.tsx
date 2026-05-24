import React, { useEffect } from 'react'
import { ImagePlay, Sparkles, Terminal as TerminalIcon, Zap } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { Button } from '@components/controls/Button'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { PromptEditor } from '@components/imagegen/PromptEditor'
import { RenderMeter } from '@components/imagegen/RenderMeter'
import { OutputTray } from '@components/imagegen/OutputTray'
import { OctaneTerminal } from '@components/terminal/OctaneTerminal'
import { useImageGenStore } from '@state/imagegen'
import { Knob } from '@components/controls/Knob'
import { Toggle } from '@components/controls/Toggle'
import { Select } from '@components/controls/Select'

// Local helper — formats a terminal line as a display string
let _tlSeq = 0
function makeTerminalLine(type: 'info'|'warn'|'error'|'cmd'|'out'|'debug'|'input'|'output'|'success', text: string) {
  return { id: `tl-${_tlSeq++}`, ts: Date.now(), type, text: `[${type.toUpperCase()}] ${text}` }
}

const MODEL_OPTS = [
  { value: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base 1.0' },
  { value: '@cf/lykon/dreamshaper-8-lcm',                  label: 'DreamShaper 8 LCM' },
  { value: '@cf/bytedance/stable-diffusion-xl-lightning',  label: 'SDXL Lightning' },
]

export default function ImageGen() {
  const store = useImageGenStore()
  const [termLines, setTermLines] = React.useState(() => [
    makeTerminalLine('info',   'Octane ImageGen v2 — CF Workers AI backend'),
    makeTerminalLine('info',   'Type "help" for available commands'),
    makeTerminalLine('success','Ready.'),
  ])

  // Sync store terminal logs → terminal display
  useEffect(() => {
    const newLines = store.terminalLog.map(l =>
      makeTerminalLine('output', l)
    )
    setTermLines(prev => {
      const existingIds = new Set(prev.map(l => l.id))
      const fresh = newLines.filter(l => !existingIds.has(l.id))
      return [...prev, ...fresh].slice(-300)
    })
  }, [store.terminalLog])

  const handleCommand = (cmd: string) => {
    const line = makeTerminalLine('input', cmd)
    setTermLines(p => [...p, line])

    const c = cmd.trim().toLowerCase()
    if (c === 'help') {
      setTermLines(p => [...p,
        makeTerminalLine('info', 'Commands: generate, clear, status, model <name>, steps <n>, seed <n>, cfg <n>'),
      ])
    } else if (c === 'generate' || c === 'gen') {
      store.generate()
    } else if (c === 'clear') {
      store.clearImages()
      setTermLines(p => [...p, makeTerminalLine('success', 'Output tray cleared.')])
    } else if (c === 'status') {
      setTermLines(p => [...p,
        makeTerminalLine('info', `Model:  ${store.params.model.split('/').pop()}`),
        makeTerminalLine('info', `Size:   ${store.params.width}×${store.params.height}`),
        makeTerminalLine('info', `Steps:  ${store.params.steps}  CFG: ${store.params.guidance}`),
        makeTerminalLine('info', `Seed:   ${store.params.seed ?? 'random'}`),
        makeTerminalLine('info', `Images: ${store.outputImages.length} in tray`),
      ])
    } else if (c.startsWith('steps ')) {
      const n = parseInt(c.split(' ')[1])
      if (!isNaN(n) && n > 0 && n <= 150) {
        store.setParams({ steps: n })
        setTermLines(p => [...p, makeTerminalLine('success', `Steps set to ${n}`)])
      } else { setTermLines(p => [...p, makeTerminalLine('error', 'steps <1-150>')]) }
    } else if (c.startsWith('cfg ')) {
      const n = parseFloat(c.split(' ')[1])
      if (!isNaN(n)) {
        store.setParams({ guidance: n })
        setTermLines(p => [...p, makeTerminalLine('success', `CFG scale set to ${n}`)])
      }
    } else if (c.startsWith('seed ')) {
      const n = parseInt(c.split(' ')[1])
      store.setParams({ seed: isNaN(n) ? -1 : n })
      setTermLines(p => [...p, makeTerminalLine('success', isNaN(n) ? 'Seed set to random' : `Seed set to ${n}`)])
    } else if (c.startsWith('model ')) {
      const m = c.slice(6).trim()
      const found = MODEL_OPTS.find(o => o.label.toLowerCase().includes(m) || o.value.includes(m))
      if (found) { store.setParams({ model: found.value as Parameters<typeof store.setParams>[0]['model'] }); setTermLines(p => [...p, makeTerminalLine('success', `Model: ${found.label}`)]) }
      else { setTermLines(p => [...p, makeTerminalLine('error', `Unknown model: ${m}. Try: sdxl, dreamshaper, lightning`)]) }
    } else {
      setTermLines(p => [...p, makeTerminalLine('error', `Unknown command: ${cmd}. Type "help".`)])
    }
  }

  const p = store.params

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <ImagePlay size={14} className="text-violet flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-violet tracking-widest">IMAGE GEN STUDIO</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={store.isGenerating ? 'info' : 'ok'}
            label={store.isGenerating ? 'GENERATING' : 'READY'} pulse={store.isGenerating}/>
          <StatusBadge status="ok" label={p.model.split('/').pop()?.slice(0, 12) ?? 'CF AI'}/>
          <Button
            variant="primary" size="sm"
            icon={<Sparkles size={11}/>}
            loading={store.isGenerating}
            onClick={() => store.generate()}
          >
            GENERATE
          </Button>
        </div>
      </div>

      {/* Main layout — 3 columns */}
      <div className="flex gap-2 flex-1 min-h-0 min-w-0 overflow-hidden">

        {/* LEFT — Prompt editor */}
        <div className="flex flex-col gap-2 w-[220px] flex-shrink-0 min-h-0 overflow-y-auto oct-scroll">
          <Panel title="PROMPT ENGINE" accent="violet" className="min-w-0">
            <PromptEditor/>
          </Panel>
        </div>

        {/* CENTER — Controls + render meter + output tray */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* Controls grid */}
          <Panel title="IMAGE CONTROLS" accent="cyan" className="min-w-0">
            <div className="flex items-start gap-4 flex-wrap min-w-0">
              {/* Model */}
              <Select value={p.model} onChange={v => store.setParams({ model: v as typeof p.model })} options={MODEL_OPTS} label="MODEL"/>

              {/* Knob dials */}
              {([
                { label:'STEPS',    key:'steps'    as const, min:1,  max:20,  step:1   },
                { label:'CFG',      key:'guidance' as const, min:1,  max:12,  step:0.5 },
                { label:'WIDTH',    key:'width'    as const, min:256,max:1024,step:64  },
                { label:'HEIGHT',   key:'height'   as const, min:256,max:1024,step:64  },
              ]).map(({ label, key, min, max, step }) => (
                <div key={key} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <Knob
                    value={(p[key] as number - min) / (max - min)}
                    min={0}
                    max={1}
                    onChange={v => store.setParams({ [key]: Math.round((v * (max - min) + min) / step) * step })}
                    label={label}
                    size="sm"
                    accent="cyan"
                    displayFn={() => String(p[key])}
                  />
                </div>
              ))}

              {/* Seed + RNG */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="oct-label text-muted">SEED</span>
                <div className="flex gap-1 items-center">
                  <input
                    type="number"
                    value={p.seed === -1 ? '' : p.seed}
                    onChange={e => store.setParams({ seed: e.target.value ? Number(e.target.value) : -1 })}
                    placeholder="Random"
                    className="w-20 bg-[var(--oct-surface-raised)] border border-[var(--oct-border-subtle)]
                      rounded px-1.5 py-0.5 font-mono text-[9px] text-[var(--oct-text-primary)] outline-none
                      focus:border-[var(--oct-accent-cyan)] transition-colors"
                  />
                  <Button variant="ghost" size="xs"
                    onClick={() => store.setParams({ seed: Math.floor(Math.random() * 2**31) })}>
                    🎲
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Render meter */}
          <Panel title="RENDER PIPELINE" accent="cyan" className="min-w-0">
            <RenderMeter/>
          </Panel>

          {/* Output tray */}
          <Panel title="OUTPUT TRAY" accent="violet" className="flex-1 min-h-0 min-w-0">
            <OutputTray/>
          </Panel>

          {/* Terminal */}
          <Panel title="QUICK TERMINAL" accent="emerald" noPad className="min-w-0 h-[130px]">
            <OctaneTerminal
              lines={termLines}
              onCommand={handleCommand}
            />
          </Panel>
        </div>

        {/* RIGHT — Stats sidebar */}
        <div className="flex flex-col gap-2 w-[160px] flex-shrink-0 min-h-0 overflow-y-auto oct-scroll">
          <Panel title="SESSION STATS" accent="amber" className="min-w-0">
            <div className="flex flex-col gap-1.5 min-w-0">
              {[
                { label:'IMAGES',  value: String(store.outputImages.length),   color:'text-amber'   },
                { label:'STEPS',   value: String(p.steps),                     color:'text-cyan'    },
                { label:'CFG',     value: String(p.guidance),                  color:'text-violet'  },
                { label:'W × H',   value: `${p.width}×${p.height}`,            color:'text-emerald' },
                { label:'SEED',    value: p.seed === -1 ? 'rng' : String(p.seed), color:'text-muted' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-1 min-w-0">
                  <span className="oct-label text-muted truncate-safe">{label}</span>
                  <span className={`font-mono text-[9px] font-bold flex-shrink-0 ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="PROMPT PREVIEW" accent="violet" className="min-w-0">
            <p className="font-mono text-[8px] text-[var(--oct-text-secondary)] leading-relaxed break-words min-w-0">
              {[p.prompt, ...p.positives, p.tags.join(', '), p.subjective]
                .filter(Boolean).join(', ').slice(0, 200) || '—'}
            </p>
          </Panel>

          <Panel title="NEGATIVE" accent="rose" className="min-w-0">
            <p className="font-mono text-[8px] text-rose/70 leading-relaxed break-words min-w-0">
              {p.negatives.join(', ').slice(0, 120) || '—'}
            </p>
          </Panel>

          <Panel title="CF AI BACKEND" accent="cyan" className="min-w-0">
            <div className="flex flex-col gap-1">
              <StatusBadge status="ok" label="WORKERS AI" pulse/>
              <div className="font-mono text-[7px] text-muted break-all">{p.model.split('/').slice(-2).join('/')}</div>
              <div className="font-mono text-[7px] text-emerald mt-0.5">Edge inference ✓</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
