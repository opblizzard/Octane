import { create } from 'zustand'
import { useChaosStore } from './chaos'
import { resolveApiUrl } from '@sdk/runtime'

interface AIResponsePayload {
  content?: string
  response?: string
  text?: string
  error?: string
}

export interface ChatMessage {
  id:         string
  role:       'user'|'assistant'|'system'
  content:    string
  ts?:        number
  timestamp?: number
  chaos?:     number
  streaming?: boolean
  error?:     boolean
}
export interface AIModule { id:string; name:string; active:boolean; description:string }
export interface TerminalLine { id:string; ts:number; type:'info'|'warn'|'error'|'cmd'|'out'; text:string }

interface AIStore {
  messages:      ChatMessage[]
  streaming:     boolean
  isStreaming:   boolean
  streamBuffer:  string
  pendingMessage: string
  modules:       AIModule[]
  terminalLines: TerminalLine[]
  terminalLogs:  string[]
  sessionId:     string
  connected:     boolean
  status:        'idle'|'connecting'|'connected'|'error'
  model:         string
  tokenCount:    number
  contextWindow: number
  maxContext:    number

  sendMessage:     (content:string)=>Promise<void>
  clearMessages:   ()=>void
  addTerminalLine: (type:TerminalLine['type'], text:string)=>void
  toggleModule:    (id:string)=>void
  connect:         ()=>void
  stopStreaming:    ()=>void
}

function getResponseText(payload: AIResponsePayload): string {
  const text = payload.content ?? payload.response ?? payload.text ?? ''
  return typeof text === 'string' ? text.trim() : ''
}

async function readAIResponse(res: Response, onChunk: (token: string) => void): Promise<string> {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const payload = await res.json() as AIResponsePayload
    const text = getResponseText(payload)
    if (!text) throw new Error(payload.error || 'empty response content')
    onChunk(text)
    return text
  }

  if (!res.body) throw new Error('response body unavailable')

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let full = ''
  let carry = ''

  const parsePayload = (payload: string) => {
    const line = payload.trim()
    if (!line || line === '[DONE]') return
    try {
      const parsed = JSON.parse(line) as AIResponsePayload
      const token = getResponseText(parsed)
      if (!token) return
      full += token
      onChunk(full)
    } catch {
      full += line
      onChunk(full)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    carry += dec.decode(value, { stream: true })
    const lines = carry.split('\n')
    carry = lines.pop() ?? ''

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      if (line.startsWith('data:')) parsePayload(line.slice(5))
      else parsePayload(line)
    }
  }

  const tail = `${carry}${dec.decode()}`.trim()
  if (tail) {
    if (tail.startsWith('data:')) parsePayload(tail.slice(5))
    else parsePayload(tail)
  }

  if (!full.trim()) throw new Error('empty stream content')
  return full.trim()
}


export const useAIStore = create<AIStore>((set,get)=>({
  messages:[{id:'sys0',role:'system',content:'Ion AI Core v4 — Chaos-Governor Edition. Sovereign intelligence initialized.',ts:Date.now()}],
  streaming:false, isStreaming:false, streamBuffer:'', pendingMessage:'',
  sessionId:`sess-${Math.random().toString(36).slice(2)}`,
  connected: false,
  status: 'idle',
  model: '@cf/meta/llama-3.1-8b-instruct',
  tokenCount: 0,
  contextWindow: 0,
  maxContext: 8192,
  modules:[
    {id:'reasoning',   name:'Deep Reasoning', active:true,  description:'Multi-path chain-of-thought'},
    {id:'memory',      name:'Memory Fabric',  active:true,  description:'Sovereign memory retrieval'},
    {id:'tools',       name:'Tool Calling',   active:false, description:'Agentic function dispatch'},
    {id:'critique',    name:'Self-Critique',  active:true,  description:'Output validation pass'},
    {id:'multimodal',  name:'Multimodal',     active:false, description:'Vision + text fusion'},
    {id:'entropy',     name:'Entropy Aware',  active:true,  description:'Chaos-adaptive sampling'},
  ],
  terminalLines:[
    {id:'t0',ts:Date.now()-5000,type:'info', text:'[BOOT] Ion AI Core v4 initialized'},
    {id:'t1',ts:Date.now()-4000,type:'info', text:'[MEM] Memory fabric: 8 entries loaded'},
    {id:'t2',ts:Date.now()-3000,type:'info', text:'[CHAOS] Governor: chaos=0.30, strategy=balanced'},
    {id:'t3',ts:Date.now()-2000,type:'info', text:'[WS] WebSocket endpoint ready at /ws/ai'},
    {id:'t4',ts:Date.now()-1000,type:'info', text:'[READY] Awaiting operator input'},
  ],
  terminalLogs: [
    '[BOOT] Ion AI Core v4 initialized',
    '[READY] Awaiting operator input',
  ],

  connect() {
    set({ status:'connecting', connected:false })
    // Simulate connection attempt
    setTimeout(() => {
      set({ status:'connected', connected:true })
      get().addTerminalLine('info','[WS] AI session connected')
    }, 800)
  },

  stopStreaming() {
    set({ streaming:false, isStreaming:false, streamBuffer:'', pendingMessage:'' })
  },

  async sendMessage(content) {
    const { chaos, derivedParams } = useChaosStore.getState()
    const now = Date.now()
    const userMsg: ChatMessage = { id:`m${now}`, role:'user', content, ts:now, chaos }
    const tokens = Math.round(content.length / 4)
    set(s=>({
      messages:[...s.messages,userMsg],
      streaming:true, isStreaming:true, streamBuffer:'', pendingMessage:'',
      tokenCount: s.tokenCount + tokens,
      contextWindow: s.contextWindow + tokens,
    }))
    get().addTerminalLine('cmd',`> ${content.slice(0,60)}`)
    get().addTerminalLine('info',`[CHAOS] temp=${derivedParams.temperature.toFixed(2)} strategy=${derivedParams.reasoningStrategy}`)

    try {
      const recentMessages = get().messages
        .filter(message => !message.error)
        .slice(-12)
        .map(message => ({ role: message.role, content: message.content }))

      const res = await fetch(resolveApiUrl('/api/ai'),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message: content,
          messages: recentMessages,
          context: {
            chaos,
            strategy: derivedParams.reasoningStrategy,
            activeModules: get().modules.filter(module => module.active).map(module => module.name),
          },
          ...useChaosStore.getState().getInferenceParams(),
        })
      })
      if(!res.ok) {
        const payload = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as AIResponsePayload
        throw new Error(payload.error || `HTTP ${res.status}`)
      }

      const full = await readAIResponse(res, token => {
        set({ streamBuffer: token, pendingMessage: token })
      })

      const rTokens = Math.round(full.length / 4)
      const assistantMsg:ChatMessage={id:`m${Date.now()}`,role:'assistant',content:full,ts:Date.now(),chaos}
      set(s=>({
        messages:[...s.messages,assistantMsg],
        streaming:false, isStreaming:false, streamBuffer:'', pendingMessage:'',
        tokenCount: s.tokenCount + rTokens, contextWindow: s.contextWindow + rTokens,
      }))
      get().addTerminalLine('out',`[OK] Response: ${full.length} chars`)
    } catch (err) {
      const errorText = err instanceof Error ? err.message : String(err)
      get().addTerminalLine('error', `[AI] ${errorText}`)
      const assistantMsg:ChatMessage={
        id:`m${Date.now()}`,
        role:'assistant',
        content:`I couldn't complete that request because the AI backend returned an error: ${errorText}`,
        ts:Date.now(),
        chaos,
        error:true,
      }
      set(s=>({
        messages:[...s.messages,assistantMsg],
        streaming:false, isStreaming:false, streamBuffer:'', pendingMessage:'',
      }))
    }
  },
  clearMessages(){
    set({
      messages:[{id:'sys0',role:'system',content:'Ion AI Core v4 — session cleared.',ts:Date.now()}],
      tokenCount:0, contextWindow:0,
    })
  },
  addTerminalLine(type,text){
    set(s=>({
      terminalLines:[...s.terminalLines.slice(-99),{id:`t${Date.now()}`,ts:Date.now(),type,text}],
      terminalLogs:[...s.terminalLogs.slice(-99),text],
    }))
  },
  toggleModule(id){ set(s=>({modules:s.modules.map(m=>m.id===id?{...m,active:!m.active}:m)})) },
}))
