import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { applyTokens } from '@theme/tokens'

export type ReasoningStrategy = 'deterministic' | 'chain-of-thought' | 'balanced' | 'divergent' | 'emergent'

export interface StabilizerState {
  id: string
  name: string
  active: boolean
  value: number
  threshold: number
  description: string
}

export interface DerivedChaosParams {
  temperature: number
  topP: number
  topK: number
  parallelPaths: number
  memoryNoise: number
  selfCritiqueIntensity: number
  reasoningStrategy: ReasoningStrategy
  coherenceGuard: number
  creativityIndex: number
}

export interface ChaosPreset {
  id: string
  name: string
  chaos: number
  description: string
  color: string
}

export interface ChaosStore {
  chaos: number
  entropy: number
  entropyTarget: number
  locked: boolean
  activePreset: string | null
  stabilizers: StabilizerState[]
  presets: ChaosPreset[]
  setChaos: (v: number) => void
  applyPreset: (id: string) => void
  lockChaos: (locked: boolean) => void
  toggleStabilizer: (id: string) => void
  getInferenceParams: () => DerivedChaosParams
  derivedParams: DerivedChaosParams
}

function deriveChaosParams(chaos: number): DerivedChaosParams {
  const c = Math.max(0, Math.min(1, chaos))
  const strategies: ReasoningStrategy[] = ['deterministic','chain-of-thought','balanced','divergent','emergent']
  const stratIdx = Math.min(4, Math.floor(c * 5))
  return {
    temperature: 0.05 + c * 1.95,
    topP: 0.60 + c * 0.39,
    topK: Math.round(1 + c * 99),
    parallelPaths: Math.round(1 + c * 7),
    memoryNoise: c * 0.6,
    selfCritiqueIntensity: 0.95 - c * 0.90,
    reasoningStrategy: strategies[stratIdx],
    coherenceGuard: 1.0 - c * 0.9,
    creativityIndex: c,
  }
}

function buildStabilizers(chaos: number): StabilizerState[] {
  return [
    { id:'coherence', name:'Coherence Guard', active: chaos < 0.9, value: Math.max(0.1, 1-chaos*0.9), threshold: 0.15, description:'Prevents semantic drift in output' },
    { id:'entropy',   name:'Entropy Limiter', active: chaos < 0.8, value: Math.max(0.1, 1-chaos*0.8), threshold: 0.2,  description:'Bounds entropy injection rate' },
    { id:'safety',    name:'Safety Bound',    active: true,         value: Math.max(0.05,1-chaos*0.7), threshold: 0.1,  description:'Hard safety constraint floor' },
    { id:'drift',     name:'Drift Corrector', active: chaos < 0.7,  value: Math.max(0.1, 1-chaos),     threshold: 0.25, description:'Realigns divergent reasoning paths' },
    { id:'recall',    name:'Recall Stabilizer',active: chaos < 0.85,value: Math.max(0.05,1-chaos*0.85),threshold: 0.15, description:'Anchors memory retrieval fidelity' },
  ]
}

const PRESETS: ChaosPreset[] = [
  { id:'deterministic', name:'Deterministic', chaos:0.0,  description:'Pure precision — reproducible, truth-seeking', color:'#00f5ff' },
  { id:'balanced',      name:'Balanced',      chaos:0.3,  description:'Default — reliable with creative spark',      color:'#3b82f6' },
  { id:'creative',      name:'Creative',      chaos:0.65, description:'Divergent with guardrails — imaginative',     color:'#a855f7' },
  { id:'chaos',         name:'Chaos',         chaos:1.0,  description:'Maximum emergence — fully stochastic',        color:'#ef4444' },
]

const CHAOS_STORAGE_KEY = 'octane:chaos-state'
const CHAOS_SNAPSHOT_KEY = 'octane:chaos-snapshot'

type ChaosSnapshot = Pick<ChaosStore, 'chaos' | 'entropy' | 'entropyTarget' | 'locked' | 'activePreset'> & {
  timestamp?: number
}

function readChaosSnapshot(): ChaosSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CHAOS_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      chaos: Number(parsed.chaos ?? 0.3),
      entropy: Number(parsed.entropy ?? parsed.chaos ?? 0.3),
      entropyTarget: Number(parsed.entropyTarget ?? parsed.chaos ?? 0.3),
      locked: Boolean(parsed.locked),
      activePreset: typeof parsed.activePreset === 'string' ? parsed.activePreset : null,
      timestamp: Number(parsed.timestamp ?? 0),
    }
  } catch {
    return null
  }
}

function publishChaosState(state: Pick<ChaosStore, 'chaos' | 'entropy' | 'entropyTarget' | 'locked' | 'activePreset'>) {
  if (typeof window === 'undefined') return
  const payload = {
    chaos: state.chaos,
    entropy: state.entropy,
    entropyTarget: state.entropyTarget,
    locked: state.locked,
    activePreset: state.activePreset,
    timestamp: Date.now(),
  }
  try {
    window.localStorage.setItem(CHAOS_SNAPSHOT_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures; chaos influence is best-effort only.
  }
  window.dispatchEvent(new CustomEvent('octane:chaos-change', { detail: payload }))
}

function syncChaosSnapshot() {
  const s = useChaosStore.getState()
  publishChaosState(s)
}

export const useChaosStore = create<ChaosStore>()(
  persist(
    (set, get) => ({
      chaos: 0.3,
      entropy: 0.3,
      entropyTarget: 0.3,
      locked: false,
      activePreset: 'balanced',
      stabilizers: buildStabilizers(0.3),
      presets: PRESETS,
      derivedParams: deriveChaosParams(0.3),

      setChaos(v) {
        if (get().locked) return
        const chaos = Math.max(0, Math.min(1, v))
        applyTokens(chaos)
        set({ chaos, entropyTarget: chaos, derivedParams: deriveChaosParams(chaos), stabilizers: buildStabilizers(chaos), activePreset: null })
        syncChaosSnapshot()
      },
      applyPreset(id) {
        const preset = PRESETS.find(p => p.id === id)
        if (!preset) return
        const chaos = preset.chaos
        applyTokens(chaos)
        set({ chaos, entropyTarget: chaos, activePreset: id, derivedParams: deriveChaosParams(chaos), stabilizers: buildStabilizers(chaos) })
        syncChaosSnapshot()
      },
      lockChaos(locked) {
        set({ locked })
        syncChaosSnapshot()
      },
      toggleStabilizer(id) {
        set(s => ({ stabilizers: s.stabilizers.map(st => st.id === id ? { ...st, active: !st.active } : st) }))
        syncChaosSnapshot()
      },
      getInferenceParams() { return get().derivedParams },
    }),
    {
      name: CHAOS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chaos: state.chaos,
        entropy: state.entropy,
        entropyTarget: state.entropyTarget,
        locked: state.locked,
        activePreset: state.activePreset,
        stabilizers: state.stabilizers,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const snapshot = readChaosSnapshot()
        const source = snapshot && (snapshot.timestamp ?? 0) >= 0 ? snapshot : state
        const chaos = Math.max(0, Math.min(1, source.chaos))
        applyTokens(chaos)
        useChaosStore.setState({
          chaos,
          entropy: Math.max(0, Math.min(1, source.entropy ?? chaos)),
          entropyTarget: Math.max(0, Math.min(1, source.entropyTarget ?? chaos)),
          locked: Boolean(source.locked),
          activePreset: source.activePreset ?? null,
          derivedParams: deriveChaosParams(chaos),
          stabilizers: state.stabilizers?.length ? state.stabilizers : buildStabilizers(chaos),
        })
      },
    },
  ),
)

// Entropy ticker
if (typeof window !== 'undefined') {
  syncChaosSnapshot()
  setInterval(() => {
    const s = useChaosStore.getState()
    const noise = (Math.random() - 0.5) * s.chaos * 0.08
    const drift = (s.entropyTarget - s.entropy) * 0.12
    const newEntropy = Math.max(0, Math.min(1, s.entropy + drift + noise))
    useChaosStore.setState({ entropy: newEntropy })
    publishChaosState({ ...useChaosStore.getState(), entropy: newEntropy })
  }, 800)
}
