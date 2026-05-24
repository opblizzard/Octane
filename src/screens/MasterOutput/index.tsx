import React, { useEffect } from 'react'
import { Sliders, Volume2, Radio, Activity } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { Fader } from '@components/controls/Fader'
import { Knob } from '@components/controls/Knob'
import { Toggle } from '@components/controls/Toggle'
import { VUMeter } from '@components/charts/VUMeter'
import { useAudioStore, startVuSimulation, stopVuSimulation } from '@state/audio'

export default function MasterOutput() {
  const audio = useAudioStore()

  useEffect(() => {
    startVuSimulation()
    return () => stopVuSimulation()
  }, [])

  const masterDb = 20 * Math.log10(Math.max(audio.masterVuL, 0.0001))
  const peakDb   = 20 * Math.log10(Math.max(audio.masterPeak,  0.0001))
  const latencyMs = ((audio.bufferSize / audio.sampleRate) * 1000).toFixed(1)

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 size={14} className="text-emerald flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-emerald tracking-widest">MASTER OUTPUT</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={peakDb > -0.1 ? 'crit' : peakDb > -3 ? 'warn' : 'ok'} label={`PEAK ${peakDb.toFixed(1)} dBFS`}/>
          <StatusBadge status="ok" label={`${audio.sampleRate / 1000}kHz`}/>
        </div>
      </div>

      {/* KPIs */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="MASTER" value={masterDb.toFixed(1)} unit="dBFS" accent="emerald"
          trend={masterDb > -3 ? 'up' : 'flat'}/>
        <MetricCard label="PEAK"   value={peakDb.toFixed(1)}  unit="dBFS" accent="rose"/>
        <MetricCard label="LIMITER GR" value={`-${(audio.limiterGR * 20).toFixed(1)}`} unit="dB" accent="violet"/>
        <MetricCard label="OUTPUT LAT" value={latencyMs} unit="ms" accent="cyan"/>
      </div>

      {/* Master fader + VU meters */}
      <div className="oct-grid-3 min-w-0">
        {/* Master fader */}
        <Panel title="MASTER FADER" accent="emerald" className="min-w-0">
          <div className="flex flex-col items-center gap-3 justify-center min-w-0">
            <Fader
              value={audio.masterFader}
              min={0} max={1}
              onChange={v => audio.setMaster({ fader: v })}
              accent="emerald"
              orientation="vertical"
              length={140}
            />
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[16px] font-bold text-emerald">{masterDb.toFixed(1)}</span>
              <span className="oct-label text-muted">dBFS</span>
            </div>
            <ProgressBar value={audio.masterFader * 100} accent={audio.masterFader > 0.9 ? 'rose' : 'emerald'}/>
          </div>
        </Panel>

        {/* Main VU meters */}
        <Panel title="VU — L / R" accent="emerald" className="min-w-0">
          <div className="flex justify-center items-end gap-6 min-w-0">
            <div className="flex flex-col items-center gap-1">
              <VUMeter
                valueL={audio.channels[0]?.vuL ?? audio.masterVuL}
                valueR={audio.channels[0]?.vuR ?? audio.masterVuR}
                peak={audio.masterPeak}
                height={160}
                accent="emerald"
              />
              <span className="oct-label">MAIN L</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <VUMeter
                valueL={audio.channels[1]?.vuL ?? audio.masterVuL * 0.97}
                valueR={audio.channels[1]?.vuR ?? audio.masterVuR * 0.97}
                peak={audio.masterPeak * 0.97}
                height={160}
                accent="emerald"
              />
              <span className="oct-label">MAIN R</span>
            </div>
          </div>
        </Panel>

        {/* Limiter + clip */}
        <Panel title="LIMITER / CLIP" accent="rose" className="min-w-0">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="oct-label text-muted">LIMITER</span>
              <Toggle checked={audio.limiterActive} onChange={v => audio.setMaster({ limiterActive: v })} accent="rose"/>
            </div>
            {/* Clip indicator */}
            <div className={`flex items-center justify-center h-8 rounded border font-mono text-[10px] font-bold transition-colors ${
              audio.masterPeak >= 1 ? 'border-rose bg-rose/10 text-rose animate-pulse' : 'border-[var(--oct-border-subtle)] text-muted'
            }`}>
              {audio.masterPeak >= 1 ? '⚠ CLIP' : 'NO CLIP'}
            </div>

            <div className="flex flex-col gap-1.5">
              {([
                { label:'THRESH', value: `${audio.channels[0]?.compressor?.threshold ?? -18}dB`, pct: Math.min(100, ((audio.channels[0]?.compressor?.threshold ?? -18) + 60) / 60 * 100) },
                { label:'CEIL',   value: '0.0dBFS', pct: 100 },
                { label:'LUFS',   value: `${(masterDb-14).toFixed(1)} LUFS`, pct: Math.min(100,(masterDb+30)/30*100) },
              ]).map(({label, value, pct}) => (
                <div key={label} className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex justify-between">
                    <span className="oct-label text-muted">{label}</span>
                    <span className="font-mono text-[9px] text-rose">{value}</span>
                  </div>
                  <ProgressBar value={pct} accent="rose"/>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Bus channels + spectral */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="BUS LEVELS" accent="amber" className="min-w-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {audio.channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-2 min-w-0">
                <span className="oct-label text-muted w-10 flex-shrink-0 truncate">{ch.name}</span>
                <ProgressBar
                  value={(ch.muted ? 0 : ch.vuL) * 100}
                  accent={ch.vuL > 0.85 ? 'rose' : 'amber'}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="OUTPUT ROUTING" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label: 'MAIN OUT',    status: 'ok'   as const, value: '1-2' },
              { label: 'MONITOR OUT', status: 'ok'   as const, value: '3-4' },
              { label: 'HEADPHONE',   status: 'ok'   as const, value: '5-6' },
              { label: 'AUX SEND 1',  status: 'idle' as const, value: '—'   },
              { label: 'AUX SEND 2',  status: 'idle' as const, value: '—'   },
              { label: 'SPDIF OUT',   status: 'ok'   as const, value: 'IEC958'},
            ] as const).map(({label, status, value}) => (
              <div key={label} className="flex items-center justify-between gap-2 min-w-0">
                <span className="oct-label text-muted truncate-safe">{label}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[9px] text-[var(--oct-text-secondary)]">{value}</span>
                  <StatusBadge status={status} label={status.toUpperCase()}/>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
