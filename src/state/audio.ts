import { create } from 'zustand'

export interface AudioChannel {
  id: string; name: string; label: string; level: number; muted: boolean; solo: boolean; soloed: boolean
  vu: [number, number]; vuL: number; vuR: number; eq: [number, number, number]; pan: number; peak: number
  compressor?: { threshold:number }
}
export interface AudioBand { freq: number; gain: number; q?: number }
interface AudioStore {
  channels: AudioChannel[]
  masterLevel: number; masterMuted: boolean; masterFader: number
  masterVuL: number; masterVuR: number; masterPeak: number
  limiterGR: number; limiterEnabled: boolean; limiterActive: boolean
  sampleRate: number; bufferSize: number; cpuLoad: number; outputLatency: number
  compThreshold: number; compRatio: number; compAttack: number; compRelease: number; compGain: number
  reverbMix: number; delayTime: number; delayFeedback: number
  eq: AudioBand[]
  setChannelLevel: (id:string, v:number)=>void
  setChannelMute: (id:string)=>void
  setChannelSolo: (id:string)=>void
  toggleMute: (id:string)=>void
  toggleSolo: (id:string)=>void
  setMasterLevel: (v:number)=>void
  setMaster: (p: Partial<{fader:number;level:number;muted:boolean;limiterActive:boolean}>)=>void
  setComp: (k:'compThreshold'|'compRatio'|'compAttack', v:number)=>void
  setParam: (k: keyof AudioStore, v: unknown)=>void
  startSim: ()=>void
  stopSim: ()=>void
}

const INIT_CHANNELS: AudioChannel[] = [
  { id:'ch1', name:'AI Voice',   label:'AI VOICE',   level:0.78, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,0,0], pan:0, peak:0, compressor:{ threshold:-18 } },
  { id:'ch2', name:'Synth',      label:'SYNTH',      level:0.62, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[2,-1,0], pan:-0.2, peak:0 },
  { id:'ch3', name:'Pad',        label:'PAD',        level:0.45, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,1,-2], pan:0.3, peak:0 },
  { id:'ch4', name:'FX Bus',     label:'FX BUS',     level:0.55, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,0,0], pan:0, peak:0 },
  { id:'ch5', name:'Chaos Mod',  label:'CHAOS',      level:0.30, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[1,0,-1], pan:0.1, peak:0 },
  { id:'ch6', name:'Entropy',    label:'ENTROPY',    level:0.20, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,-2,0], pan:-0.1, peak:0 },
  { id:'ch7', name:'Reverb Ret', label:'REVERB',     level:0.40, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,0,0], pan:0, peak:0 },
  { id:'ch8', name:'Master Ref', label:'MASTER',     level:0.85, muted:false, solo:false, soloed:false, vu:[0,0], vuL:0, vuR:0, eq:[0,0,0], pan:0, peak:0 },
]

export const useAudioStore = create<AudioStore>((set)=>({
  channels: INIT_CHANNELS,
  masterLevel:0.85, masterMuted:false, masterFader:0.85,
  masterVuL:0, masterVuR:0, masterPeak:0,
  limiterGR: 0, limiterEnabled: true, limiterActive: true,
  sampleRate: 48000, bufferSize: 256, cpuLoad: 12.4, outputLatency: 5.3,
  compThreshold:-18, compRatio:4, compAttack:10, compRelease:150, compGain:2,
  reverbMix:0.2, delayTime:350, delayFeedback:0.3,
  eq: [
    { freq:80,   gain:0, q:1 },
    { freq:300,  gain:0, q:1 },
    { freq:1000, gain:0, q:1 },
    { freq:4000, gain:0, q:1 },
    { freq:12000,gain:0, q:1 },
  ],
  setChannelLevel:(id,v)=>set(s=>({channels:s.channels.map(c=>c.id===id?{...c,level:v}:c)})),
  setChannelMute:(id)=>set(s=>({channels:s.channels.map(c=>c.id===id?{...c,muted:!c.muted}:c)})),
  setChannelSolo:(id)=>set(s=>({channels:s.channels.map(c=>c.id===id?{...c,solo:!c.solo,soloed:!c.soloed}:c)})),
  toggleMute:(id)=>set(s=>({channels:s.channels.map(c=>c.id===id?{...c,muted:!c.muted}:c)})),
  toggleSolo:(id)=>set(s=>({channels:s.channels.map(c=>c.id===id?{...c,solo:!c.solo,soloed:!c.soloed}:c)})),
  setMasterLevel:(v)=>set({masterLevel:v,masterFader:v}),
  setMaster:(p)=>set(s=>({
    masterFader: p.fader ?? s.masterFader,
    masterLevel: p.level ?? p.fader ?? s.masterLevel,
    masterMuted: p.muted ?? s.masterMuted,
    limiterEnabled: p.limiterActive ?? s.limiterEnabled,
    limiterActive: p.limiterActive ?? s.limiterActive,
  })),
  setComp:(k,v)=>set({[k]:v}),
  setParam:(k,v)=>set({[k]:v} as Partial<AudioStore>),
  startSim: ()=>{ _vuTimer = _vuTimer || window.setInterval(_vuTick, VU_TICK_MS) },
  stopSim: ()=>{ if(_vuTimer){ window.clearInterval(_vuTimer); _vuTimer=0 } },
}))

let _vuTimer = 0
const VU_TICK_MS = 140
function _vuTick() {
  useAudioStore.setState(s=>{
    const channels = s.channels.map(c=>{
      if(c.muted) return {...c,vu:[0,0] as [number,number],vuL:0,vuR:0}
      const base=c.level*0.9
      const l=Math.min(1,Math.max(0,base+(Math.random()-0.4)*0.2))
      const r=Math.min(1,Math.max(0,base+(Math.random()-0.4)*0.2))
      return {...c,vu:[l,r] as [number,number],vuL:l,vuR:r,peak:Math.max(c.peak*0.99,Math.max(l,r))}
    })
    const masterVuL = s.masterMuted ? 0 : Math.min(1,s.masterFader*(0.7+Math.random()*0.3))
    const masterVuR = s.masterMuted ? 0 : Math.min(1,s.masterFader*(0.7+Math.random()*0.3))
    const masterPeak = Math.max(s.masterPeak*0.99, Math.max(masterVuL,masterVuR))
    const cpuLoad = Math.min(100, Math.max(0, s.cpuLoad+(Math.random()-0.5)*2))
    const limiterGR = masterPeak > 0.9 ? (masterPeak - 0.9) * 0.5 : Math.max(0, s.limiterGR-0.01)
    return { channels, masterVuL, masterVuR, masterPeak, cpuLoad, limiterGR }
  })
}

export function startVuSimulation() { _vuTimer = _vuTimer || window.setInterval(_vuTick, VU_TICK_MS) }
export function stopVuSimulation() { if(_vuTimer){ window.clearInterval(_vuTimer); _vuTimer=0 } }
