import { useImageGenStore } from '@state/imagegen'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { Knob } from '@components/controls/Knob'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { Select } from '@components/controls/Select'
import { OctaneTerminal } from '@components/terminal/OctaneTerminal'
import { OutputTray } from '@components/imagegen/OutputTray'
import { useState, useRef } from 'react'
import { X, Plus, Image, Shuffle } from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  idle:'Ready', encoding:'Encoding prompt...', diffusing:'Diffusing...', decoding:'Decoding...', upscaling:'Upscaling...', complete:'Complete', error:'Error'
}
const PHASE_COLORS: Record<string, string> = {
  idle:'var(--muted)', encoding:'#a855f7', diffusing:'var(--accent)', decoding:'#10b981', upscaling:'#f59e0b', complete:'#10b981', error:'#ef4444'
}
const PHASE_PCT: Record<string, number> = { idle:0, encoding:15, diffusing:60, decoding:80, upscaling:95, complete:100, error:0 }

const MODELS = [
  { value:'@cf/stabilityai/stable-diffusion-xl-base-1.0', label:'SDXL Base' },
  { value:'@cf/lykon/dreamshaper-8-lcm', label:'DreamShaper 8 LCM' },
  { value:'@cf/bytedance/stable-diffusion-xl-lightning', label:'SDXL Lightning' },
]
const DIM_OPTIONS = [
  { value:'512x512', label:'512 × 512' },
  { value:'768x768', label:'768 × 768' },
  { value:'1024x1024', label:'1024 × 1024' },
]

const TERMINAL_LINES_INIT = [
  { id:'ig0', ts:Date.now()-3000, type:'info' as const, text:'[IMAGEGEN] Pipeline initialized' },
  { id:'ig1', ts:Date.now()-2000, type:'info' as const, text:'[MODEL] SDXL Base loaded' },
  { id:'ig2', ts:Date.now()-1000, type:'info' as const, text:'[READY] Awaiting generation request' },
]

type ImageGenTermType = 'info'|'warn'|'error'|'cmd'|'out'|'debug'|'input'|'output'|'success'
type ImageGenTermLine = { id:string; ts:number; type:ImageGenTermType; text:string }

export default function ImageGen() {
  const store = useImageGenStore()
  const [tagInput, setTagInput] = useState('')
  const [posInput, setPosInput] = useState('')
  const [negInput, setNegInput] = useState('')
  const [dimVal, setDimVal] = useState('1024x1024')
  const [termLines, setTermLines] = useState<ImageGenTermLine[]>(TERMINAL_LINES_INIT as ImageGenTermLine[])
  const termRef = useRef<ImageGenTermLine[]>(TERMINAL_LINES_INIT as ImageGenTermLine[])

  const addTerm = (type: ImageGenTermType, text: string) => {
    const l = { id:`ig${Date.now()}`, ts:Date.now(), type, text }
    setTermLines(prev => [...prev.slice(-99), l])
    termRef.current = [...termRef.current.slice(-99), l]
  }

  const onGenerate = async () => {
    addTerm('cmd', `> generate "${store.prompt.slice(0,40)}"`)
    addTerm('info', `[MODEL] ${store.model.split('/').pop()} steps=${store.steps} cfg=${store.guidance}`)
    await store.generate()
    addTerm(store.phase==='error' ? 'error' : 'out', `[${store.phase.toUpperCase()}] Generation finished`)
  }

  const onDimChange = (v: string) => {
    setDimVal(v)
    const [w, h] = v.split('x').map(Number)
    store.setDimensions(w, h)
  }

  const phaseColor = PHASE_COLORS[store.phase] || 'var(--muted)'
  const phasePct = PHASE_PCT[store.phase] || 0
  const isGenerating = !['idle','complete','error'].includes(store.phase)

  return (
    <div className="flex flex-col gap-3 min-h-full">
      <div className="flex flex-col md:flex-row gap-3 md:flex-1 min-h-0">
        {/* Left: Controls */}
        <div className="flex flex-col gap-3 w-full md:w-72 md:shrink-0">
          {/* Prompt */}
          <Panel title="Prompt">
            <textarea value={store.prompt} onChange={e=>store.setPrompt(e.target.value)}
              className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded p-2 text-[11px] text-[var(--text)] outline-none resize-none focus:border-[var(--accent)] placeholder-[var(--border2)]"
              rows={3} placeholder="Describe your image..."/>
          </Panel>

          {/* Tags */}
          <Panel title="Tags">
            <div className="flex gap-1 flex-wrap mb-2">
              {store.tags.map(t=>(
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface2)] border border-[var(--border)] text-[9px] text-[var(--accent)]">
                  {t}<button onClick={()=>store.removeTag(t)}><X size={8}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&tagInput.trim()){store.addTag(tagInput.trim());setTagInput('')}}}
                className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] outline-none focus:border-[var(--accent)] text-[var(--text)]"
                placeholder="Add tag + Enter"/>
            </div>
          </Panel>

          {/* Positives */}
          <Panel title="Positive Prompts" accent="#10b981">
            <div className="flex gap-1 flex-wrap mb-2">
              {store.positives.map(t=>(
                <span key={t} className="px-2 py-0.5 rounded-full bg-[#10b98120] border border-[#10b98140] text-[9px] text-[#10b981]">{t}</span>
              ))}
            </div>
            <div className="flex gap-1">
              <input value={posInput} onChange={e=>setPosInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&posInput.trim()){store.addPositive(posInput.trim());setPosInput('')}}}
                className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] outline-none focus:border-[#10b981] text-[var(--text)]"
                placeholder="Add positive + Enter"/>
            </div>
          </Panel>

          {/* Negatives */}
          <Panel title="Negative Prompts" accent="#ef4444">
            <div className="flex gap-1 flex-wrap mb-2">
              {store.negatives.map(t=>(
                <span key={t} className="px-2 py-0.5 rounded-full bg-[#ef444420] border border-[#ef444440] text-[9px] text-[#ef4444]">{t}</span>
              ))}
            </div>
            <div className="flex gap-1">
              <input value={negInput} onChange={e=>setNegInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&negInput.trim()){store.addNegative(negInput.trim());setNegInput('')}}}
                className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] outline-none focus:border-[#ef4444] text-[var(--text)]"
                placeholder="Add negative + Enter"/>
            </div>
          </Panel>

          {/* Subjective */}
          <Panel title="Subjective Feedback" accent="#a855f7">
            <input value={store.subjective} onChange={e=>store.setSubjective(e.target.value)}
              className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] outline-none focus:border-[#a855f7] text-[var(--text)]"
              placeholder="Mood, feeling, artistic direction..."/>
          </Panel>
        </div>

        {/* Center: Output */}
        <div className="flex flex-col gap-3 w-full md:flex-1 min-h-0 min-w-0">
          {/* Output tray */}
          <Panel title="Output" subtitle={PHASE_LABELS[store.phase]} className="flex-1 min-h-0">
            <div className="flex flex-col items-center justify-center h-full gap-3">
              {store.outputUrl ? (
                <img src={store.outputUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded border border-[var(--border)]"/>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
                  <Image size={40} strokeWidth={1} style={{color:'var(--border2)'}}/>
                  <span className="text-[11px]">{isGenerating ? 'Generating...' : 'No output yet'}</span>
                  {isGenerating && (
                    <div className="w-32 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 animate-pulse" style={{width:`${phasePct}%`,background:phaseColor}}/>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* Render Progress */}
          <Panel title="Render Pipeline" subtitle={store.phase.toUpperCase()}>
            <div className="flex flex-col gap-2">
              {['encoding','diffusing','decoding','upscaling','complete'].map((ph,i)=>{
                const colors=['#a855f7','var(--accent)','#10b981','#f59e0b','#10b981']
                const done = ['encoding','diffusing','decoding','upscaling','complete'].indexOf(store.phase) > i
                const active = store.phase===ph
                return (
                  <div key={ph} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background: done||active ? colors[i] : 'var(--border)', boxShadow: active ? `0 0 8px ${colors[i]}` : 'none'}}/>
                    <span className="text-[9px] capitalize w-20" style={{color: done||active ? 'var(--text)' : 'var(--muted)'}}>{ph}</span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{width: done?'100%':active?`${store.progress}%`:'0%', background:colors[i]}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Output tray with open/download controls */}
          <Panel title="Output Tray" subtitle={`${store.outputImages.length} images`}>
            <OutputTray />
          </Panel>
        </div>

        {/* Right: Settings */}
        <div className="flex flex-col gap-3 w-full md:w-60 md:shrink-0">
          <Panel title="Model">
            <Select value={store.model} options={MODELS} onChange={store.setModel}/>
          </Panel>
          <Panel title="Parameters">
            <div className="flex flex-col gap-3">
              <Select value={dimVal} options={DIM_OPTIONS} onChange={onDimChange} label="Dimensions"/>
              <div className="flex justify-around">
                <Knob value={store.steps} min={1} max={20} onChange={store.setSteps} label="STEPS" color="#a855f7" format={v=>Math.round(v).toString()}/>
                <Knob value={store.guidance} min={1} max={12} onChange={store.setGuidance} label="CFG" color="var(--accent)" format={v=>v.toFixed(1)}/>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex-1">Seed</span>
                <input value={store.seed} onChange={e=>store.setSeed(Number(e.target.value))}
                  className="w-20 bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text)] outline-none focus:border-[var(--accent)]"/>
                <button onClick={()=>store.setSeed(Math.floor(Math.random()*99999))} className="text-[var(--muted)] hover:text-[var(--accent)]">
                  <Shuffle size={12}/>
                </button>
              </div>
            </div>
          </Panel>
          <div className="flex flex-col gap-2">
            <Button variant="primary" className="w-full" loading={isGenerating} onClick={onGenerate} disabled={!store.prompt.trim()}>
              {isGenerating ? 'Generating...' : '⚡ Generate'}
            </Button>
            {store.phase==='complete' && (
              <Button variant="secondary" className="w-full" onClick={store.clearOutput}>✕ Clear Output</Button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <OctaneTerminal lines={termLines} title="IMAGEGEN TERMINAL" onCommand={cmd=>{ addTerm('cmd',`> ${cmd}`); addTerm('out','[OK] Command processed') }}/>
    </div>
  )
}
