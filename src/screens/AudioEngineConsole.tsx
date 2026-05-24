import { useEffect } from 'react'
import { useAudioStore } from '@state/audio'
import { Panel } from '@components/primitives/Panel'
import { Fader } from '@components/controls/Fader'
import { Toggle } from '@components/controls/Toggle'
import { VUMeter } from '@components/charts/VUMeter'
import { Knob } from '@components/controls/Knob'

export default function AudioEngineConsole() {
  const { channels, masterLevel, compThreshold, compRatio, compAttack,
          setChannelLevel, setChannelMute, setChannelSolo, setMasterLevel, setComp, startSim, stopSim } = useAudioStore()

  useEffect(() => {
    startSim()
    return () => stopSim()
  }, [startSim, stopSim])

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-3 gap-3">
        {/* Mixer */}
        <Panel title="Channel Strip" className="col-span-2" noPad>
          <div className="flex overflow-x-auto gap-0">
            {channels.map(ch => (
              <div key={ch.id} className="flex flex-col items-center gap-2 p-2.5 border-r border-[var(--border)] min-w-[70px]">
                <span className="text-[9px] text-[var(--muted)] truncate w-full text-center">{ch.name}</span>
                <VUMeter left={ch.vu[0]} right={ch.vu[1]} height={64} segments={12}/>
                <Fader value={ch.level} onChange={v=>setChannelLevel(ch.id,v)} vertical length={80} color="var(--accent)"/>
                <div className="flex flex-col gap-1 items-center">
                  <Toggle value={!ch.muted} onChange={()=>setChannelMute(ch.id)} color="#ef4444"/>
                  <span className="text-[8px] text-[var(--muted)]">M</span>
                </div>
              </div>
            ))}
            {/* Master */}
            <div className="flex flex-col items-center gap-2 p-2.5 min-w-[70px] bg-[var(--surface2)]">
              <span className="text-[9px] text-[var(--accent)] font-bold">MASTER</span>
              <VUMeter left={masterLevel*0.9} right={masterLevel*0.85} height={64} segments={12}/>
              <Fader value={masterLevel} onChange={setMasterLevel} vertical length={80} color="#10b981"/>
            </div>
          </div>
        </Panel>
        {/* Compressor */}
        <Panel title="Compressor">
          <div className="flex flex-col gap-4 items-center py-2">
            <Knob value={compThreshold} min={-60} max={0} onChange={v=>setComp('compThreshold',v)} label="THRESHOLD" color="#f59e0b" format={v=>v.toFixed(0)+'dB'}/>
            <Knob value={compRatio} min={1} max={20} onChange={v=>setComp('compRatio',v)} label="RATIO" color="#a855f7" format={v=>v.toFixed(1)+':1'}/>
            <Knob value={compAttack} min={1} max={100} onChange={v=>setComp('compAttack',v)} label="ATTACK" color="var(--accent)" format={v=>v.toFixed(0)+'ms'}/>
          </div>
        </Panel>
      </div>
    </div>
  )
}
