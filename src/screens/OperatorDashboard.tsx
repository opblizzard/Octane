import { Panel } from '@components/primitives/Panel'
import { Knob } from '@components/controls/Knob'
import { Fader } from '@components/controls/Fader'
import { Button } from '@components/controls/Button'
import { MetricCard } from '@components/primitives/MetricCard'
import { useChaosStore } from '@state/chaos'
import { useSystemStore } from '@state/system'
import { useState } from 'react'

export default function OperatorDashboard() {
  const { chaos, setChaos } = useChaosStore()
  const { history } = useSystemStore()
  const [outputGain, setOutputGain] = useState(0.8)
  const [bufferSize, setBufferSize] = useState(0.5)
  const [syncRate, setSyncRate] = useState(0.6)
  const latest = history[history.length-1] || { cpu:0, mem:0, net:0, req:0 }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="CPU"      value={latest.cpu.toFixed(0)} unit="%" accent="var(--accent)"/>
        <MetricCard label="Memory"   value={latest.mem.toFixed(0)} unit="%" accent="#10b981"/>
        <MetricCard label="Requests" value={latest.req.toFixed(0)} unit="/s" accent="#a855f7"/>
        <MetricCard label="Chaos"    value={(chaos*100).toFixed(0)} unit="%" accent="var(--chaos-color)"/>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Panel title="Signal Controls" className="col-span-2">
          <div className="flex items-center justify-around py-4">
            <Knob value={chaos} min={0} max={1} onChange={setChaos} label="CHAOS" color="var(--chaos-color)" format={v=>(v*100).toFixed(0)+'%'}/>
            <Knob value={outputGain} min={0} max={1} onChange={setOutputGain} label="OUTPUT" color="#10b981"/>
            <Knob value={bufferSize} min={0} max={1} onChange={setBufferSize} label="BUFFER" color="#a855f7"/>
            <Knob value={syncRate} min={0} max={1} onChange={setSyncRate} label="SYNC" color="#f59e0b"/>
          </div>
          <div className="flex justify-around pt-2 border-t border-[var(--border)]">
            <Fader value={outputGain} onChange={setOutputGain} length={100} color="#10b981" label="GAIN"/>
            <Fader value={bufferSize} onChange={setBufferSize} length={100} color="#a855f7" label="BUF"/>
            <Fader value={syncRate}   onChange={setSyncRate}   length={100} color="#f59e0b" label="SYNC"/>
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="flex flex-col gap-2">
            <Button variant="primary" className="w-full">↺ Reset All</Button>
            <Button variant="outline" className="w-full">⚡ Force Sync</Button>
            <Button variant="secondary" className="w-full">📡 Push Config</Button>
            <Button variant="danger" className="w-full">⚠ Emergency Stop</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
