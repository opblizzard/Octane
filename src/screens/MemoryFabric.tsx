import { useMemoryStore } from '@state/memory'
import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { Fader } from '@components/controls/Fader'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { MetricCard } from '@components/primitives/MetricCard'
import { useState } from 'react'
import { Pin, Trash2, Search, Zap, Database } from 'lucide-react'

export default function MemoryFabric() {
  const { entries, noiseInjection, searchQuery, searchResults, search, pinEntry, removeEntry, injectNoise, setNoiseInjection, addEntry } = useMemoryStore()
  const { chaos } = useChaosStore()
  const color = getChaosColor(chaos)
  const [newKey, setNewKey] = useState(''); const [newVal, setNewVal] = useState('')
  const displayed = searchQuery ? searchResults : entries

  const decayColor = (d: number) => d > 0.7 ? '#10b981' : d > 0.4 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Entries" value={entries.length} accent={color}/>
        <MetricCard label="Pinned"         value={entries.filter(e=>e.pinned).length} accent="#10b981"/>
        <MetricCard label="Noise Level"    value={(noiseInjection*100).toFixed(0)} unit="%" accent="#f59e0b"/>
        <MetricCard label="Avg Decay"      value={(entries.reduce((s,e)=>s+e.decay,0)/entries.length*100).toFixed(0)} unit="%" accent="#a855f7"/>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:flex-1 min-h-0">
        {/* Entries list */}
        <Panel title="Memory Entries" subtitle={`${displayed.length} shown`} className="flex-1 min-h-0" scrollable noPad>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)]">
            <Search size={11} className="text-[var(--muted)] shrink-0"/>
            <input value={searchQuery} onChange={e=>search(e.target.value)}
              className="flex-1 bg-transparent text-[10px] text-[var(--text)] outline-none placeholder-[var(--border2)]"
              placeholder="Search key, value, tags..."/>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {displayed.map(entry => (
              <div key={entry.id} className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--surface2)] flex flex-col gap-1.5"
                   style={entry.pinned ? { borderColor:`${color}40`, boxShadow:`0 0 8px ${color}10` } : {}}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {entry.pinned && <Pin size={9} style={{color}} className="shrink-0"/>}
                      <span className="text-[10px] font-bold text-[var(--text)] truncate">{entry.key}</span>
                    </div>
                    <p className="text-[9px] text-[var(--muted)] leading-relaxed line-clamp-2">{entry.value}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>pinEntry(entry.id)} className="text-[var(--border2)] hover:text-[var(--text)]"><Pin size={10}/></button>
                    <button onClick={()=>removeEntry(entry.id)} className="text-[var(--border2)] hover:text-[#ef4444]"><Trash2 size={10}/></button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={entry.decay*100} color={decayColor(entry.decay)} height={2} className="flex-1"/>
                  <span className="text-[8px] shrink-0" style={{color:decayColor(entry.decay)}}>{(entry.decay*100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {entry.tags.map(t=>(
                    <span key={t} className="px-1.5 py-0.5 rounded-full text-[8px] border border-[var(--border)] text-[var(--muted)]">{t}</span>
                  ))}
                  {entry.noiseLevel > 0.02 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] border border-[#f59e0b40] text-[#f59e0b]">noise:{(entry.noiseLevel*100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right: controls */}
        <div className="flex flex-col gap-3 w-full md:w-60 md:shrink-0">
          <Panel title="Noise Injection" accent="#f59e0b">
            <div className="flex flex-col gap-3 items-center py-2">
              <Fader value={noiseInjection} min={0} max={1} onChange={setNoiseInjection} length={140} color="#f59e0b" label="NOISE LEVEL"/>
              <Button variant="outline" className="w-full" onClick={()=>injectNoise(noiseInjection)}>
                <Zap size={11}/> Inject Noise
              </Button>
            </div>
          </Panel>

          <Panel title="Add Memory Entry" accent={color}>
            <div className="flex flex-col gap-2">
              <input value={newKey} onChange={e=>setNewKey(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text)] outline-none placeholder-[var(--border2)]"
                placeholder="Key..."/>
              <textarea value={newVal} onChange={e=>setNewVal(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded p-2 text-[10px] text-[var(--text)] outline-none resize-none placeholder-[var(--border2)]"
                rows={3} placeholder="Value..."/>
              <Button variant="primary" className="w-full" onClick={()=>{
                if(!newKey.trim()||!newVal.trim())return
                addEntry({key:newKey.trim(),value:newVal.trim(),tags:['manual'],embedding:Array.from({length:8},()=>Math.random()*2-1),pinned:false})
                setNewKey('');setNewVal('')
              }}>
                <Database size={11}/> Store Entry
              </Button>
            </div>
          </Panel>

          <Panel title="Memory Stats" accent={color}>
            <div className="flex flex-col gap-2 text-[10px]">
              {[
                { label:'Active',   value:entries.filter(e=>e.decay>0.5).length, color:'#10b981' },
                { label:'Decaying', value:entries.filter(e=>e.decay<=0.5&&e.decay>0.2).length, color:'#f59e0b' },
                { label:'Critical', value:entries.filter(e=>e.decay<=0.2).length, color:'#ef4444' },
                { label:'Pinned',   value:entries.filter(e=>e.pinned).length, color },
              ].map(r=>(
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">{r.label}</span>
                  <span className="font-bold" style={{color:r.color}}>{r.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
