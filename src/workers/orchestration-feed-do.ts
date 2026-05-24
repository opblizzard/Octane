/**
 * OCTANE v5 — OrchestrationFeedDO
 * Durable Object: realtime task queue, archive, and system log stream.
 */
import { DurableObject } from 'cloudflare:workers'
import { now } from '../utils/helpers.js'
import type { Env } from '../types/index.js'

type TaskStatus = 'running' | 'queued' | 'done'
type LogKind = 'ok' | 'warn' | 'err'

interface TaskItem {
  id: number
  name: string
  path: string
  status: TaskStatus
  depth: number
  progress: number
  source: string
  createdAt: number
}

interface LogItem {
  id: number
  ts: string
  source: string
  message: string
  kind: LogKind
}

interface OrchestrationMetrics {
  activeTasks: number
  archivedTasks: number
  tasksPerMin: number
  systemState: string
}

interface OrchestrationSnapshot {
  type: 'orchestration'
  ts: number
  tasks: TaskItem[]
  archive: TaskItem[]
  logs: LogItem[]
  metrics: OrchestrationMetrics
}

interface WebSocketWithState extends WebSocket {
  __alive?: boolean
}

const TASK_TEMPLATES = [
  { name: 'Stellar Reach', path: ['sig', 'src', 'ion', 'elx'], source: 'SRC', depth: 0 },
  { name: 'Bridge Translate', path: ['src', 'cbe', 'elx', 'flow'], source: 'CBE', depth: 1 },
  { name: 'Operator Ascension', path: ['ion', 'oan', 'gov', 'flow'], source: 'OAN', depth: 0 },
  { name: 'Memory Recall', path: ['mem', 'cbe', 'ion', 'elx'], source: 'MEMORY', depth: 1 },
  { name: 'Image Render', path: ['ion', 'img'], source: 'IMG-GEN', depth: 0 },
  { name: 'Governance Check', path: ['task', 'gov', 'oan'], source: 'GOV', depth: 1 },
  { name: 'Lattice Entangle', path: ['elx', 'flow', 'task'], source: 'ELX', depth: 0 },
  { name: 'Signal Route', path: ['sig', 'src', 'ion'], source: 'ROUTER', depth: 0 },
  { name: 'Flow Dispatch', path: ['flow', 'task', 'gov'], source: 'FLOWS', depth: 1 },
  { name: 'Epoch Sync', path: ['epoch', 'elx', 'ion'], source: 'TIME', depth: 0 },
]

export class OrchestrationFeedDO extends DurableObject {
  private clients = new Set<WebSocketWithState>()
  private state: DurableObjectState
  private ticker: ReturnType<typeof setInterval> | null = null
  private tasks: TaskItem[] = []
  private archive: TaskItem[] = []
  private logs: LogItem[] = []
  private taskCountThisMinute = 0
  private nextTaskId = 1
  private nextLogId = 1
  private minuteResetAt = now() + 60_000

  constructor(ctx: DurableObjectState, _env: Env) {
    super(ctx, _env)
    this.state = ctx
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair()) as [WebSocketWithState, WebSocketWithState]
      this.state.acceptWebSocket(server)
      server.__alive = true
      this.clients.add(server)

      server.addEventListener('close', () => this.clients.delete(server))
      server.addEventListener('error', () => this.clients.delete(server))

      if (!this.tasks.length && !this.archive.length && !this.logs.length) {
        this.seedSnapshot()
      }

      this.startTicker()
      server.send(JSON.stringify(this.snapshot()))
      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname === '/snapshot') {
      return new Response(JSON.stringify(this.snapshot()), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Orchestration feed ready', { status: 200 })
  }

  private startTicker() {
    if (this.ticker) return
    this.ticker = setInterval(() => this.tick(), 1400)
  }

  private tick() {
    const timestamp = now()
    if (timestamp >= this.minuteResetAt) {
      this.taskCountThisMinute = 0
      this.minuteResetAt = timestamp + 60_000
    }

    let nextTasks: TaskItem[] = this.tasks.map(task => {
      if (task.status !== 'running') return task
      const progress = Math.min(100, task.progress + 10 + Math.random() * 14)
      return {
        ...task,
        progress,
        status: (progress >= 100 ? 'done' : 'running') as TaskStatus,
      }
    })

    const finished = nextTasks.filter(task => task.status === 'done')
    if (finished.length > 0) {
      const archived = finished.map(task => ({ ...task, status: 'done' as TaskStatus }))
      this.archive = [...archived, ...this.archive].slice(0, 14)
      this.pushLog('TASK', `${finished.length} task${finished.length > 1 ? 's' : ''} completed and archived`, 'ok')
    }

    nextTasks = nextTasks.filter(task => task.status !== 'done')

    const spawnChance = 0.22 + Math.min(0.2, this.taskCountThisMinute * 0.02) + Math.random() * 0.14
    if (Math.random() < spawnChance) {
      const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)]
      const spawned: TaskItem = {
        id: this.nextTaskId++,
        name: template.name,
        path: template.path.join(' > '),
        status: (Math.random() > 0.24 ? 'running' : 'queued') as TaskStatus,
        depth: template.depth,
        progress: Math.round(Math.random() * 22),
        source: template.source,
        createdAt: timestamp,
      }
      nextTasks = [spawned, ...nextTasks].slice(0, 10)
      this.taskCountThisMinute += 1
      this.pushLog(spawned.source, `${spawned.name} enqueued at ${spawned.path}`, 'warn')
    }

    if (Math.random() < 0.16) {
      const source = ['SYS', 'OAN', 'SRC', 'CBE', 'ELX', 'ION'][Math.floor(Math.random() * 6)]
      const message = [
        'coherence stabilized',
        'bridge handoff completed',
        'lattice write acknowledged',
        'autonomous node fired',
        'signal routed',
        'entropy balanced',
      ][Math.floor(Math.random() * 6)]
      const kind: LogKind = Math.random() > 0.9 ? 'err' : Math.random() > 0.58 ? 'warn' : 'ok'
      this.pushLog(source, message, kind)
    }

    this.tasks = nextTasks
    this.broadcast()
  }

  private pushLog(source: string, message: string, kind: LogKind) {
    const entry: LogItem = {
      id: this.nextLogId++,
      ts: new Date(now()).toLocaleTimeString('en-US', { hour12: false }),
      source,
      message,
      kind,
    }
    this.logs = [entry, ...this.logs].slice(0, 28)
  }

  private seedSnapshot() {
    const baseNow = now()
    this.tasks = [
      {
        id: this.nextTaskId++,
        name: 'Signal Route',
        path: 'sig > src > ion',
        status: 'running' as TaskStatus,
        depth: 0,
        progress: 28,
        source: 'ROUTER',
        createdAt: baseNow - 18_000,
      },
      {
        id: this.nextTaskId++,
        name: 'Bridge Translate',
        path: 'src > cbe > elx > flow',
        status: 'queued' as TaskStatus,
        depth: 1,
        progress: 14,
        source: 'CBE',
        createdAt: baseNow - 9_000,
      },
    ]
    this.archive = [
      {
        id: this.nextTaskId++,
        name: 'Epoch Sync',
        path: 'epoch > elx > ion',
        status: 'done' as TaskStatus,
        depth: 0,
        progress: 100,
        source: 'TIME',
        createdAt: baseNow - 72_000,
      },
    ]
    this.logs = [
      {
        id: this.nextLogId++,
        ts: new Date(baseNow - 21_000).toLocaleTimeString('en-US', { hour12: false }),
        source: 'SYS',
        message: 'orchestration feed initialized',
        kind: 'ok' as LogKind,
      },
      {
        id: this.nextLogId++,
        ts: new Date(baseNow - 12_000).toLocaleTimeString('en-US', { hour12: false }),
        source: 'TASK',
        message: 'initial task snapshot restored',
        kind: 'warn' as LogKind,
      },
    ]
  }

  private snapshot(): OrchestrationSnapshot {
    return {
      type: 'orchestration',
      ts: now(),
      tasks: this.tasks,
      archive: this.archive,
      logs: this.logs,
      metrics: {
        activeTasks: this.tasks.length,
        archivedTasks: this.archive.length,
        tasksPerMin: Math.max(this.taskCountThisMinute, this.tasks.length * 2),
        systemState: this.tasks.length > 6 ? 'BUSY' : 'STABLE',
      },
    }
  }

  private broadcast() {
    const data = JSON.stringify(this.snapshot())
    const dead: WebSocketWithState[] = []
    for (const ws of this.clients) {
      if (!ws.__alive) {
        dead.push(ws)
        continue
      }
      try {
        ws.send(data)
      } catch {
        dead.push(ws)
      }
    }

    dead.forEach(ws => this.clients.delete(ws))

    if (this.clients.size === 0 && this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
  }
}