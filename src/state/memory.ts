import { create } from 'zustand'

export interface MemoryEntry {
  id: string
  key: string
  value: string
  tags: string[]
  embedding: number[]
  timestamp: number
  decay: number
  pinned: boolean
  noiseLevel: number
}

interface MemoryStore {
  entries: MemoryEntry[]
  noiseInjection: number
  searchQuery: string
  searchResults: MemoryEntry[]
  addEntry: (e: Omit<MemoryEntry,'id'|'timestamp'|'decay'|'noiseLevel'>) => void
  removeEntry: (id: string) => void
  pinEntry: (id: string) => void
  search: (q: string) => void
  injectNoise: (level: number) => void
  setNoiseInjection: (v: number) => void
}

function fakeEmb(): number[] { return Array.from({length:8},()=>Math.random()*2-1) }
function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((s,v,i)=>s+v*b[i],0)
  const ma = Math.sqrt(a.reduce((s,v)=>s+v*v,0))
  const mb = Math.sqrt(b.reduce((s,v)=>s+v*v,0))
  return ma && mb ? dot/(ma*mb) : 0
}

const SEED: MemoryEntry[] = [
  { id:'m1', key:'chaos_baseline',     value:'chaos=0.3 yields optimal balance for most tasks',     tags:['chaos','config'],   embedding:fakeEmb(), timestamp:Date.now()-90000, decay:0.98, pinned:true,  noiseLevel:0 },
  { id:'m2', key:'user_preference',    value:'User prefers dark high-contrast UI with cyan accents', tags:['ui','preference'],  embedding:fakeEmb(), timestamp:Date.now()-80000, decay:0.95, pinned:true,  noiseLevel:0 },
  { id:'m3', key:'model_temperature',  value:'Temperature >1.2 causes hallucination spikes',         tags:['model','inference'],embedding:fakeEmb(), timestamp:Date.now()-70000, decay:0.90, pinned:false, noiseLevel:0.05 },
  { id:'m4', key:'session_context',    value:'Ongoing agentic workflow: image generation pipeline',  tags:['session','agent'],  embedding:fakeEmb(), timestamp:Date.now()-60000, decay:0.85, pinned:false, noiseLevel:0.02 },
  { id:'m5', key:'entropy_threshold',  value:'Entropy above 0.8 triggers coherence guard',           tags:['entropy','safety'], embedding:fakeEmb(), timestamp:Date.now()-50000, decay:0.80, pinned:false, noiseLevel:0.03 },
  { id:'m6', key:'worker_endpoint',    value:'CF Worker at :8787 — AI, imagegen, metrics routes',   tags:['infra','worker'],   embedding:fakeEmb(), timestamp:Date.now()-40000, decay:0.75, pinned:false, noiseLevel:0 },
  { id:'m7', key:'last_prompt',        value:'Generate surreal landscape with neon fog at dusk',     tags:['imagegen','prompt'],embedding:fakeEmb(), timestamp:Date.now()-30000, decay:0.70, pinned:false, noiseLevel:0.04 },
  { id:'m8', key:'stabilizer_status',  value:'All 5 stabilizers active below chaos=0.65',            tags:['stabilizer'],       embedding:fakeEmb(), timestamp:Date.now()-20000, decay:0.65, pinned:false, noiseLevel:0.01 },
]

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  entries: SEED,
  noiseInjection: 0,
  searchQuery: '',
  searchResults: [],

  addEntry(e) {
    const entry: MemoryEntry = { ...e, id: `m${Date.now()}`, timestamp: Date.now(), decay: 1.0, noiseLevel: get().noiseInjection }
    set(s => ({ entries: [entry, ...s.entries] }))
  },
  removeEntry(id) { set(s => ({ entries: s.entries.filter(e => e.id !== id) })) },
  pinEntry(id)    { set(s => ({ entries: s.entries.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e) })) },
  search(q) {
    const qEmb = fakeEmb()
    const results = get().entries
      .map(e => ({ ...e, score: cosineSim(qEmb, e.embedding) }))
      .filter(e => q === '' || e.key.includes(q) || e.value.includes(q) || e.tags.some(t => t.includes(q)) || e.score > 0.6)
      .sort((a,b) => b.score - a.score)
      .slice(0, 8)
    set({ searchResults: results, searchQuery: q })
  },
  injectNoise(level) {
    set(s => ({ entries: s.entries.map(e => e.pinned ? e : { ...e, noiseLevel: Math.min(1, e.noiseLevel + level * Math.random()) }) }))
  },
  setNoiseInjection(v) { set({ noiseInjection: v }) },
}))

// Decay ticker
if (typeof window !== 'undefined') {
  setInterval(() => {
    const noise = useMemoryStore.getState().noiseInjection
    useMemoryStore.setState(s => ({
      entries: s.entries.map(e => e.pinned ? e : { ...e, decay: Math.max(0, e.decay - 0.001 - noise * 0.002) })
    }))
  }, 30000)
}
