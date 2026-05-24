import { useAgentStore } from '@state/agent'
import { useChaosStore } from '@state/chaos'
import { getChaosColor } from '@theme/tokens'
import { Panel } from '@components/primitives/Panel'
import { Button } from '@components/controls/Button'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { MetricCard } from '@components/primitives/MetricCard'
import clsx from 'clsx'

const STEP_COLORS: Record<string, string> = {
  pending:'var(--border2)', running:'var(--accent)', complete:'#10b981', failed:'#ef4444', skipped:'var(--muted)'
}

export default function AgentWorkflow() {
  const { tasks, activeTaskId, runTask, stopTask, resetTask, addTask } = useAgentStore()
  const { chaos } = useChaosStore()
  const color = getChaosColor(chaos)

  const running = tasks.filter(t => t.status === 'running').length
  const complete = tasks.filter(t => t.status === 'complete').length

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Total Tasks"   value={tasks.length}   accent={color}/>
        <MetricCard label="Running"       value={running}        accent="var(--accent)"/>
        <MetricCard label="Complete"      value={complete}       accent="#10b981"/>
        <MetricCard label="Parallel Paths" value={Math.round(1+chaos*7)} accent="#a855f7"/>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:flex-1 min-h-0">
        {/* Task list */}
        <div className="flex flex-col gap-3 w-full md:w-56 md:shrink-0">
          <Panel title="Task Queue" accent={color}>
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div key={task.id}
                  className={clsx('p-2.5 rounded-md border cursor-pointer transition-all', task.id===activeTaskId?'border-current':'border-[var(--border)] hover:border-[var(--border2)]')}
                  style={task.id===activeTaskId?{borderColor:color,background:`${color}08`}:{}}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-[var(--text)] truncate">{task.name}</span>
                    <StatusBadge status={task.status==='running'?'running':task.status==='complete'?'complete':task.status==='failed'?'error':'idle'} pulse/>
                  </div>
                  <ProgressBar
                    value={task.steps.filter(s=>s.status==='complete').length/task.steps.length*100}
                    color={task.status==='complete'?'#10b981':color} height={3}/>
                  <div className="flex gap-1 mt-2">
                    {task.status==='idle' && <Button variant="outline" size="sm" onClick={()=>runTask(task.id)}>▶ Run</Button>}
                    {task.status==='running' && <Button variant="danger" size="sm" onClick={()=>stopTask(task.id)}>■ Stop</Button>}
                    {(task.status==='complete'||task.status==='failed') && <Button variant="secondary" size="sm" onClick={()=>resetTask(task.id)}>↺ Reset</Button>}
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full" onClick={()=>addTask(`Task ${tasks.length+1}`)}>+ New Task</Button>
            </div>
          </Panel>
        </div>

        {/* Step pipeline */}
        <Panel title="Execution Pipeline" subtitle={activeTaskId?tasks.find(t=>t.id===activeTaskId)?.name:'Select a task'} accent={color} className="flex-1 min-h-0" scrollable>
          {activeTaskId ? (
            (() => {
              const task = tasks.find(t => t.id === activeTaskId)!
              return (
                <div className="flex flex-col gap-2 py-1">
                  {task.steps.map((step, i) => (
                    <div key={step.id}
                      className={clsx('flex flex-col gap-2 p-3 rounded-md border transition-all',
                        step.status==='running'?'border-current bg-[var(--surface2)]':'border-[var(--border)]')}
                      style={step.status==='running'?{borderColor:color,boxShadow:`0 0 12px ${color}15`}:{}}>
                      <div className="flex items-center gap-2">
                        {/* Step number */}
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                             style={{background:STEP_COLORS[step.status]+'20',border:`1px solid ${STEP_COLORS[step.status]}`,color:STEP_COLORS[step.status]}}>
                          {step.status==='complete'?'✓':step.status==='failed'?'✗':i+1}
                        </div>
                        <span className="text-[10px] font-medium flex-1" style={{color:STEP_COLORS[step.status]}}>{step.label}</span>
                        {step.parallelGroup && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-[#a855f740] text-[#a855f7]">∥ {step.parallelGroup}</span>
                        )}
                        {step.status==='running' && <span className="text-[8px] text-[var(--accent)] animate-pulse">RUNNING</span>}
                        {step.status==='complete' && step.output && <span className="text-[8px] text-[#10b981]">{step.output}</span>}
                      </div>
                      {step.status==='running' && (
                        <ProgressBar value={step.progress} color={color} height={3} showValue/>
                      )}
                      {step.status==='complete' && (
                        <div className="h-1 w-full rounded-full bg-[#10b981]"/>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--muted)] gap-2">
              <span className="text-[11px]">Select a task to view its pipeline</span>
            </div>
          )}
        </Panel>

        {/* Right: parallel graph */}
        <div className="flex flex-col gap-3 w-full md:w-52 md:shrink-0">
          <Panel title="Parallel Groups" accent="#a855f7">
            <div className="flex flex-col gap-2">
              {['fetch','exec'].map(g => {
                const task = tasks.find(t=>t.id===activeTaskId)
                const gSteps = task?.steps.filter(s=>s.parallelGroup===g) || []
                return (
                  <div key={g} className="p-2 rounded bg-[var(--surface2)] border border-[var(--border)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"/>
                      <span className="text-[9px] font-bold text-[#a855f7] uppercase">∥ {g}</span>
                    </div>
                    {gSteps.map(s=>(
                      <div key={s.id} className="flex items-center gap-1.5 mb-1">
                        <StatusBadge status={s.status==='running'?'running':s.status==='complete'?'complete':'idle'} pulse/>
                        <span className="text-[9px] text-[var(--muted)] truncate">{s.label}</span>
                      </div>
                    ))}
                    {gSteps.length===0 && <span className="text-[9px] text-[var(--border2)]">No task selected</span>}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Chaos Influence" accent={color}>
            <div className="flex flex-col gap-2 text-[10px]">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Speed Boost</span><span style={{color}}>+{(chaos*30).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Variance</span><span className="text-[#f59e0b]">{(chaos*40).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Path Splits</span><span className="text-[#a855f7]">{Math.round(1+chaos*7)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Retry Budget</span><span className="text-[#10b981]">{Math.round(3-chaos*2)}</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
