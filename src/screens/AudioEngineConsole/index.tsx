import React, { useEffect } from 'react'
import { Music, Volume2, SlidersHorizontal } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { Fader } from '@components/controls/Fader'
import { Knob } from '@components/controls/Knob'
import { Toggle } from '@components/controls/Toggle'
import { VUMeter } from '@components/charts/VUMeter'
import { SparkLine } from '@components/charts/SparkLine'
import { useAudioStore } from '@state/audio'

export default function AudioEngineConsole() {
  const audio = useAudioStore()

  useEffect(() => {
    audio.startSim()
    return () => audio.stopSim()
  }, [])

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Music size={14} className="text-amber flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-amber tracking-widest">AUDIO ENGINE</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status="ok" label={`${audio.sampleRate / 1000}kHz · ${audio.bufferSize}smp`}/>
          <StatusBadge status={audio.cpuLoad > 80 ? 'crit' : audio.cpuLoad > 50 ? 'warn' : 'ok'} label={`CPU ${audio.cpuLoad.toFixed(1)}%`}/>
          <StatusBadge status="ok" label={`${audio.outputLatency.toFixed(1)}ms LAT`}/>
        </div>
      </div>

      {/* KPI row */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="SAMPLE RATE" value={`${audio.sampleRate / 1000}`} unit="kHz" accent="amber"/>
        <MetricCard label="BUFFER"      value={audio.bufferSize} unit="smp" accent="cyan"/>
        <MetricCard label="LATENCY"     value={audio.outputLatency.toFixed(1)} unit="ms" accent="violet"/>
        <MetricCard label="CPU LOAD"    value={audio.cpuLoad.toFixed(1)} unit="%" accent="rose"/>
      </div>

      {/* Channel strip + VU row */}
      <div className="oct-grid-2 min-w-0">
        {/* Channel strips */}
        <Panel title="CHANNEL MATRIX" accent="amber" flex className="min-w-0">
          <div className="flex gap-1.5 overflow-x-auto oct-scroll-x pb-1 flex-1 min-w-0">
            {audio.channels.map(ch => (
              <div key={ch.id} className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[44px]">
                {/* Solo / Mute */}
                <div className="flex gap-0.5">
                  <button onClick={() => audio.toggleSolo(ch.id)}
                    className={`text-[7px] px-1 py-0.5 rounded border font-mono transition-colors ${
                      ch.soloed ? 'border-amber bg-amber/10 text-amber' : 'border-[var(--oct-border-subtle)] text-muted'}`}>S</button>
                  <button onClick={() => audio.toggleMute(ch.id)}
                    className={`text-[7px] px-1 py-0.5 rounded border font-mono transition-colors ${
                      ch.muted ? 'border-rose bg-rose/10 text-rose' : 'border-[var(--oct-border-subtle)] text-muted'}`}>M</button>
                </div>
                {/* Level fader */}
                <Fader
                  value={ch.level}
                  min={0} max={1}
                  onChange={v => audio.setChannelLevel(ch.id, v)}
                  accent={ch.muted ? 'rose' : 'amber'}
                  orientation="vertical"
                  height={80}
                />
                {/* Peak */}
                <div className="font-mono text-[7px] text-muted">{(ch.peak * 100).toFixed(0)}</div>
                {/* Label */}
                <span className="oct-label truncate-safe w-full text-center" style={{ maxWidth: 44 }}>{ch.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* VU Meters */}
        <Panel title="VU METERS" accent="emerald" flex className="min-w-0">
          <div className="flex gap-4 justify-center flex-1 items-end min-w-0">
            {audio.channels.slice(0, 4).map(ch => (
              <div key={ch.id} className="flex flex-col items-center gap-1">
                <VUMeter
                  left={ch.muted ? 0 : ch.level}
                  right={ch.muted ? 0 : ch.level * 0.95}
                  peak={ch.peak}
                  height={120}
                  accent="emerald"
                />
                <span className="oct-label">{ch.label.slice(0,4)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* EQ + Dynamics row */}
      <div className="oct-grid-2 min-w-0">
        {/* EQ */}
        <Panel title="5-BAND EQ" accent="cyan" className="min-w-0">
          <div className="flex gap-3 justify-around flex-wrap min-w-0">
            {audio.eq.map((band, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Knob
                  value={band.gain}
                  min={-24} max={24}
                  onChange={v => {
                    const eq = [...audio.eq]
                    eq[i] = { ...eq[i], gain: v }
                    audio.setParam('eq', eq)
                  }}
                  accent="cyan"
                  size={36}
                />
                <span className="oct-label">{band.freq >= 1000 ? `${band.freq/1000}k` : band.freq}Hz</span>
                <span className="font-mono text-[7px] text-cyan">{band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Dynamics */}
        <Panel title="COMPRESSOR" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label:'THRESHOLD', key:'compThreshold', min:-60, max:0,   unit:'dB', accent:'violet' },
              { label:'RATIO',     key:'compRatio',     min:1,  max:20,   unit:':1', accent:'amber'  },
              { label:'ATTACK',    key:'compAttack',    min:0.1,max:200,  unit:'ms', accent:'cyan'   },
              { label:'RELEASE',   key:'compRelease',   min:10, max:2000, unit:'ms', accent:'cyan'   },
              { label:'MAKE-UP',   key:'compGain',      min:0,  max:20,   unit:'dB', accent:'emerald'},
            ] as const).map(({ label, key, min, max, unit, accent }) => (
              <div key={key} className="flex flex-col gap-0.5 min-w-0">
                <div className="flex justify-between min-w-0">
                  <span className="oct-label text-muted">{label}</span>
                  <span className={`font-mono text-[9px] text-${accent}`}>{(audio[key] as number).toFixed(1)}{unit}</span>
                </div>
                <Fader
                  value={(audio[key] as number)}
                  min={min} max={max}
                  onChange={v => audio.setParam(key as any, v)}
                  accent={accent}
                  orientation="horizontal"
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--oct-border-subtle)]">
              <span className="oct-label text-muted">LIMITER</span>
              <Toggle checked={audio.limiterEnabled} onChange={v => audio.setParam('limiterEnabled', v)} accent="rose"/>
            </div>
          </div>
        </Panel>
      </div>

      {/* FX + master row */}
      <div className="oct-grid-3 min-w-0">
        <Panel title="REVERB / DELAY" accent="rose" className="min-w-0">
          <div className="flex gap-4 justify-center min-w-0">
            <div className="flex flex-col items-center gap-1">
              <Knob value={audio.reverbMix} min={0} max={1} onChange={v => audio.setParam('reverbMix', v)} accent="rose" size={44}/>
              <span className="oct-label">REVERB</span>
              <span className="font-mono text-[8px] text-rose">{(audio.reverbMix * 100).toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob value={audio.delayTime} min={0} max={1000} onChange={v => audio.setParam('delayTime', v)} accent="violet" size={44}/>
              <span className="oct-label">DELAY</span>
              <span className="font-mono text-[8px] text-violet">{audio.delayTime.toFixed(0)}ms</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Knob value={audio.delayFeedback} min={0} max={0.95} onChange={v => audio.setParam('delayFeedback', v)} accent="cyan" size={44}/>
              <span className="oct-label">FEEDBK</span>
              <span className="font-mono text-[8px] text-cyan">{(audio.delayFeedback * 100).toFixed(0)}%</span>
            </div>
          </div>
        </Panel>

        <Panel title="MASTER BUS" accent="emerald" flex className="min-w-0">
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <VUMeter
              left={audio.masterLevel}
              right={audio.masterLevel * 0.98}
              peak={audio.masterPeak}
              height={100}
              accent="emerald"
            />
            <Fader value={audio.masterLevel} min={0} max={1}
              onChange={v => audio.setParam('masterLevel', v)} accent="emerald" orientation="horizontal"/>
            <span className="font-mono text-[10px] font-bold text-emerald">
              {(20 * Math.log10(Math.max(audio.masterLevel, 0.0001))).toFixed(1)} dBFS
            </span>
          </div>
        </Panel>

        <Panel title="ENGINE LOG" accent="amber" flex className="min-w-0">
          <div className="flex flex-col gap-0.5 font-mono text-[8px] text-muted flex-1 overflow-y-auto oct-scroll min-w-0">
            {[
              `[ENGINE] SR: ${audio.sampleRate}Hz  BUF: ${audio.bufferSize}smp`,
              `[ENGINE] Lat: ${audio.outputLatency.toFixed(2)}ms`,
              `[ENGINE] CPU: ${audio.cpuLoad.toFixed(1)}%`,
              `[LIMITER] ${audio.limiterEnabled ? 'ACTIVE' : 'BYPASSED'}`,
              `[COMP] Thresh: ${audio.compThreshold}dB Ratio: ${audio.compRatio}:1`,
              `[REVERB] Mix: ${(audio.reverbMix*100).toFixed(0)}%`,
              `[DELAY] ${audio.delayTime.toFixed(0)}ms @ ${(audio.delayFeedback*100).toFixed(0)}%`,
            ].map((line, i) => (
              <div key={i} className="truncate-safe">{line}</div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
