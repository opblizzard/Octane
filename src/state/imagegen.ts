import { create } from 'zustand'
import { getAPIBaseUrl } from '@sdk/runtime'

export type RenderPhase='idle'|'queued'|'encoding'|'sampling'|'diffusing'|'decoding'|'upscaling'|'done'|'complete'|'error'

export interface ImageGenParams {
  prompt: string; tags: string[]; positives: string[]; negatives: string[]
  subjective: string; steps: number; guidance: number; width: number; height: number; seed: number; model: string
  strength: number
}

export interface OutputImage {
  id: string; url: string; prompt: string; ts: number; params?: Partial<ImageGenParams>
}

export interface ImageGenStore {
  // Flat fields (backward compat)
  prompt:string; tags:string[]; positives:string[]; negatives:string[]; subjective:string
  steps:number; guidance:number; width:number; height:number; seed:number; model:string
  // New grouped params
  params: ImageGenParams
  setParams: (p: Partial<ImageGenParams>)=>void
  removePositive: (t:string)=>void
  removeNegative: (t:string)=>void
  // Output
  phase:RenderPhase; progress:number; outputUrl:string|null; error:string|null
  renderPhase: RenderPhase; renderProgress: number; renderMsg: string; isGenerating: boolean
  history: {url:string;prompt:string;ts:number}[]
  outputImages: OutputImage[]
  terminalLog: string[]
  removeImage: (id:string)=>void
  clearImages: ()=>void
  setPrompt:(v:string)=>void; addTag:(t:string)=>void; removeTag:(t:string)=>void
  addPositive:(t:string)=>void; addNegative:(t:string)=>void
  setSubjective:(v:string)=>void; setSteps:(v:number)=>void; setGuidance:(v:number)=>void
  setDimensions:(w:number,h:number)=>void; setSeed:(v:number)=>void; setModel:(v:string)=>void
  generate:()=>Promise<void>; clearOutput:()=>void
}

const PHASE_SEQ:RenderPhase[]=['queued','encoding','sampling','diffusing','decoding','upscaling','done']
const PHASE_DUR=[200,800,3000,600,400,300,0]

const API_BASE = getAPIBaseUrl()

function _makeParams(s: Partial<ImageGenParams>): ImageGenParams {
  return { prompt:s.prompt??'', tags:s.tags??[], positives:s.positives??['high quality','sharp focus','detailed'],
    negatives:s.negatives??['blurry','noise','artifacts','low quality'], subjective:s.subjective??'',
    steps:s.steps??20, guidance:s.guidance??8.0, width:s.width??1024, height:s.height??1024, seed:s.seed??-1,
    strength:s.strength??0.75,
    model:s.model??'@cf/stabilityai/stable-diffusion-xl-base-1.0' }
}

export const useImageGenStore = create<ImageGenStore>((set,get)=>({
  prompt:'', tags:[], positives:['high quality','sharp focus','detailed'],
  negatives:['blurry','noise','artifacts','low quality'], subjective:'',
  steps:20, guidance:8.0, width:1024, height:1024, seed:-1,
  model:'@cf/stabilityai/stable-diffusion-xl-base-1.0',
  params: _makeParams({}),
  phase:'idle', progress:0, outputUrl:null, error:null,
  renderPhase:'idle', renderProgress:0, renderMsg:'', isGenerating:false,
  history:[], outputImages:[], terminalLog: ['[IMAGEGEN] Ready'],

  setParams: (p) => set(s => {
    const next = { ...s.params, ...p }
    return { params: next, ...p }
  }),
  removePositive: (t) => set(s => {
    const positives = s.positives.filter(x=>x!==t)
    return { positives, params: {...s.params, positives} }
  }),
  removeNegative: (t) => set(s => {
    const negatives = s.negatives.filter(x=>x!==t)
    return { negatives, params: {...s.params, negatives} }
  }),
  removeImage: (id) => set(s => ({ outputImages: s.outputImages.filter(i=>i.id!==id) })),
  clearImages: () => set({ outputImages:[], history:[] }),

  setPrompt:v=>set(s=>({prompt:v,params:{...s.params,prompt:v}})),
  addTag:t=>set(s=>({tags:[...s.tags,t],params:{...s.params,tags:[...s.params.tags,t]}})),
  removeTag:t=>set(s=>({tags:s.tags.filter(x=>x!==t),params:{...s.params,tags:s.params.tags.filter(x=>x!==t)}})),
  addPositive:t=>set(s=>({positives:[...s.positives,t],params:{...s.params,positives:[...s.params.positives,t]}})),
  addNegative:t=>set(s=>({negatives:[...s.negatives,t],params:{...s.params,negatives:[...s.params.negatives,t]}})),
  setSubjective:v=>set(s=>({subjective:v,params:{...s.params,subjective:v}})),
  setSteps:v=>set(s=>({steps:v,params:{...s.params,steps:v}})),
  setGuidance:v=>set(s=>({guidance:v,params:{...s.params,guidance:v}})),
  setDimensions:(w,h)=>set(s=>({width:w,height:h,params:{...s.params,width:w,height:h}})),
  setSeed:v=>set(s=>({seed:v,params:{...s.params,seed:v}})),
  setModel:v=>set(s=>({model:v,params:{...s.params,model:v}})),
  clearOutput:()=>set({outputUrl:null,phase:'idle',renderPhase:'idle',progress:0,renderProgress:0,error:null,isGenerating:false,renderMsg:''}),

  async generate() {
    const s=get()
    if(s.isGenerating)return
    const seed = s.seed<0?Math.floor(Math.random()*99999):s.seed
    set(s=>({phase:'queued',renderPhase:'queued',progress:0,renderProgress:0,outputUrl:null,error:null,isGenerating:true,renderMsg:'Queued...', terminalLog:[...s.terminalLog.slice(-99), `[QUEUED] ${s.prompt.slice(0,48)}`]}))
    const fullPrompt=[s.prompt,...s.positives].join(', ')+'.'+(s.subjective?' '+s.subjective:'')
    const negPrompt=s.negatives.join(', ')
    // Bias for best quality by default while remaining model-safe.
    const tunedSteps = s.model.includes('lightning') ? Math.min(12, Math.max(4, Math.round(s.steps))) : Math.min(20, Math.max(8, Math.round(s.steps)))
    const tunedGuidance = s.model.includes('lightning') ? Math.min(2.5, Math.max(0, s.guidance)) : Math.min(12, Math.max(5, s.guidance))
    const body={prompt:fullPrompt,negative_prompt:negPrompt,num_steps:tunedSteps,guidance:tunedGuidance,width:s.width,height:s.height,seed,model:s.model}
    let url = ''
    try{
      const res=await fetch(`${API_BASE}/api/imagegen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      if(!res.ok)throw new Error(`HTTP ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      if (!ct.toLowerCase().includes('image/')) throw new Error(`Unexpected content-type: ${ct || 'unknown'}`)
      const blob=await res.blob()
      url=URL.createObjectURL(blob)
    }catch(err){
      const msg = err instanceof Error ? err.message : String(err)
      set(prev => ({
        phase:'error', renderPhase:'error', progress:0, renderProgress:0,
        isGenerating:false, error:msg, renderMsg:'Generation failed',
        terminalLog:[...prev.terminalLog.slice(-99), `[ERROR] ${msg}`]
      }))
      return
    }
    for(let i=0;i<PHASE_SEQ.length-1;i++){
      const ph=PHASE_SEQ[i]; const pct=(i+1)/PHASE_SEQ.length*100
      set({phase:ph,renderPhase:ph,progress:pct,renderProgress:pct,renderMsg:ph.charAt(0).toUpperCase()+ph.slice(1)+'...'})
      await new Promise(r=>setTimeout(r,PHASE_DUR[i]))
    }
    const outImg: OutputImage = {
      id:`img-${Date.now()}`,
      url,
      prompt:s.prompt,
      ts:Date.now(),
      params:{ ...s.params, steps: tunedSteps, guidance: tunedGuidance }
    }
    set(prev=>({
      phase:'complete', renderPhase:'done', progress:100, renderProgress:100,
      renderMsg:'Done', outputUrl:url, isGenerating:false,
      outputImages:[outImg,...prev.outputImages.slice(0,11)],
      history:[{url,prompt:s.prompt,ts:Date.now()},...prev.history.slice(0,11)],
      terminalLog:[...prev.terminalLog.slice(-99), '[DONE] Generation complete']
    }))
  }
}))
