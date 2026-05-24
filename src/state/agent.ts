import { create } from 'zustand'

export type StepStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped'
export type TaskStatus = 'idle' | 'running' | 'complete' | 'failed'

export interface AgentStep {
  id: string
  label: string
  status: StepStatus
  progress: number
  duration: number
  parallelGroup?: string
  output?: string
}

export interface AgentTask {
  id: string
  name: string
  status: TaskStatus
  steps: AgentStep[]
  startedAt?: number
  completedAt?: number
  chaosLevel: number
}

interface AgentStore {
  tasks: AgentTask[]
  activeTaskId: string | null
  runTask: (id: string) => void
  stopTask: (id: string) => void
  resetTask: (id: string) => void
  addTask: (name: string) => void
}

const STEP_TEMPLATES = [
  { label:'Initialize context',     duration:1200 },
  { label:'Retrieve memory shards', duration:800,  parallelGroup:'fetch' },
  { label:'Fetch tool manifests',   duration:900,  parallelGroup:'fetch' },
  { label:'Plan execution graph',   duration:1500 },
  { label:'Execute primary path',   duration:2000, parallelGroup:'exec' },
  { label:'Execute fallback path',  duration:1800, parallelGroup:'exec' },
  { label:'Synthesize results',     duration:1100 },
  { label:'Validate output',        duration:700 },
]

function makeTask(id: string, name: string, chaosLevel=0.3): AgentTask {
  return {
    id, name, status:'idle', chaosLevel,
    steps: STEP_TEMPLATES.map((t,i) => ({ id:`${id}-s${i}`, label:t.label, status:'pending', progress:0, duration:t.duration, parallelGroup:t.parallelGroup }))
  }
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  tasks: [makeTask('task1','Image Generation Pipeline',0.3), makeTask('task2','Ion AI Reasoning Chain',0.65)],
  activeTaskId: null,

  runTask(id) {
    set(s => ({
      activeTaskId: id,
      tasks: s.tasks.map(t => t.id===id ? { ...t, status:'running', startedAt:Date.now(), steps:t.steps.map((s,i)=>i===0?{...s,status:'running'}:s) } : t)
    }))
  },
  stopTask(id) {
    set(s => ({ activeTaskId:null, tasks:s.tasks.map(t=>t.id===id?{...t,status:'idle'}:t) }))
  },
  resetTask(id) {
    set(s => ({ tasks:s.tasks.map(t=>t.id===id?makeTask(id,t.name,t.chaosLevel):t) }))
  },
  addTask(name) {
    const id = `task${Date.now()}`
    set(s=>({tasks:[...s.tasks,makeTask(id,name,0.3)]}))
  }
}))

if (typeof window !== 'undefined') {
  setInterval(() => {
    const { tasks, activeTaskId } = useAgentStore.getState()
    if (!activeTaskId) return
    const task = tasks.find(t=>t.id===activeTaskId)
    if (!task || task.status!=='running') return
    const chaos = task.chaosLevel
    const speed = 2 + chaos * 3
    const newSteps = [...task.steps]
    let allDone = true
    for (let i=0; i<newSteps.length; i++) {
      const s = newSteps[i]
      if (s.status==='pending') { allDone=false; break }
      if (s.status==='running') {
        allDone=false
        const inc = (speed/s.duration)*600
        const np = Math.min(100, s.progress+inc*(1+(Math.random()-0.5)*chaos))
        if (np>=100) {
          newSteps[i]={...s,progress:100,status:'complete',output:`Completed in ${(s.duration/1000).toFixed(1)}s`}
          const next = newSteps.findIndex((x,j)=>j>i&&x.status==='pending')
          if (next>-1) newSteps[next]={...newSteps[next],status:'running'}
        } else { newSteps[i]={...s,progress:np} }
        break
      }
    }
    const done = newSteps.every(s=>s.status==='complete'||s.status==='skipped')
    useAgentStore.setState(st=>({
      tasks:st.tasks.map(t=>t.id===activeTaskId?{...t,steps:newSteps,status:done?'complete':'running',completedAt:done?Date.now():undefined}:t),
      activeTaskId:done?null:activeTaskId
    }))
  }, 600)
}
