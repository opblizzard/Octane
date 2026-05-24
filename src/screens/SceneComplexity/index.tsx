import React, { useEffect, useRef } from 'react'
import { Layers, Triangle, Cpu, Zap } from 'lucide-react'
import { Panel } from '@components/layout/Panel'
import { MetricCard } from '@components/primitives/MetricCard'
import { StatusBadge } from '@components/primitives/StatusBadge'
import { ProgressBar } from '@components/primitives/ProgressBar'
import { BarMeter } from '@components/charts/BarMeter'
import { RadarChart } from '@components/charts/RadarChart'
import { SparkLine } from '@components/charts/SparkLine'
import { useCFStore } from '@state/cloudflare'

function useSimMetrics() {
  const [metrics, setMetrics] = React.useState({
    triangles:    845_230,
    drawCalls:    1_204,
    shaderPasses: 12,
    shadowCasters:386,
    particles:    24_800,
    textureMem:   2_847,
    vramUsed:     6_140,
    gpuLoad:      72.4,
    renderMs:     14.2,
    shadowMs:     3.8,
    postFxMs:     2.1,
    cpuSync:      1.4,
  })

  const histRef = useRef<number[]>([])
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(m => ({
        triangles:    Math.round(m.triangles    + (Math.random()-0.5)*5000),
        drawCalls:    Math.round(m.drawCalls    + (Math.random()-0.5)*20),
        shaderPasses: m.shaderPasses,
        shadowCasters:Math.round(m.shadowCasters+ (Math.random()-0.5)*4),
        particles:    Math.round(m.particles    + (Math.random()-0.5)*500),
        textureMem:   Math.round(m.textureMem   + (Math.random()-0.5)*30),
        vramUsed:     Math.round(m.vramUsed     + (Math.random()-0.5)*50),
        gpuLoad:      Math.max(0,Math.min(100, m.gpuLoad   +(Math.random()-0.5)*3)),
        renderMs:     Math.max(0, m.renderMs    +(Math.random()-0.5)*0.8),
        shadowMs:     Math.max(0, m.shadowMs    +(Math.random()-0.5)*0.4),
        postFxMs:     Math.max(0, m.postFxMs    +(Math.random()-0.5)*0.3),
        cpuSync:      Math.max(0, m.cpuSync     +(Math.random()-0.5)*0.2),
      }))
      histRef.current = [...histRef.current.slice(-59), metrics.gpuLoad]
    }, 200)
    return () => clearInterval(id)
  }, [metrics.gpuLoad])

  return { metrics, gpuHistory: histRef.current }
}

export default function SceneComplexity() {
  const { metrics, gpuHistory } = useSimMetrics()
  const cf = useCFStore()
  useEffect(() => { cf.connect() }, [])

  const radarData = [
    { label:'Geometry',  value: Math.min(100, metrics.triangles / 10000)   },
    { label:'Shaders',   value: metrics.shaderPasses * 8                    },
    { label:'Shadows',   value: Math.min(100, metrics.shadowCasters / 5)    },
    { label:'Particles', value: Math.min(100, metrics.particles / 300)      },
    { label:'Textures',  value: Math.min(100, metrics.textureMem / 40)      },
    { label:'GPU Load',  value: metrics.gpuLoad                             },
  ]

  const totalFrameMs = metrics.renderMs + metrics.shadowMs + metrics.postFxMs + metrics.cpuSync
  const targetFPS    = 60

  return (
    <div className="oct-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={14} className="text-rose flex-shrink-0"/>
          <span className="font-mono text-xs font-bold text-rose tracking-widest">SCENE COMPLEXITY</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={metrics.gpuLoad > 90 ? 'crit' : metrics.gpuLoad > 75 ? 'warn' : 'ok'}
            label={`GPU ${metrics.gpuLoad.toFixed(1)}%`}/>
          <StatusBadge status={totalFrameMs > 16.7 ? 'warn' : 'ok'} label={`${totalFrameMs.toFixed(1)}ms FRAME`}/>
        </div>
      </div>

      {/* KPIs */}
      <div className="oct-grid-4 min-w-0">
        <MetricCard label="TRIANGLES"    value={(metrics.triangles/1000).toFixed(0)} unit="K" accent="rose"/>
        <MetricCard label="DRAW CALLS"   value={metrics.drawCalls} accent="amber"/>
        <MetricCard label="GPU LOAD"     value={metrics.gpuLoad.toFixed(1)} unit="%" accent="cyan"/>
        <MetricCard label="FRAME TIME"   value={totalFrameMs.toFixed(2)} unit="ms" accent="violet"/>
      </div>

      {/* Radar + GPU chart */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="COMPLEXITY RADAR" accent="rose" flex className="min-w-0">
          <RadarChart data={radarData} accent="rose" size={200}/>
        </Panel>

        <Panel title="GPU TIMELINE" accent="cyan" className="min-w-0">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <span className="oct-label text-muted">GPU LOAD</span>
              <span className="font-mono text-[12px] font-bold text-cyan">{metrics.gpuLoad.toFixed(1)}%</span>
            </div>
            <ProgressBar value={metrics.gpuLoad} accent={metrics.gpuLoad > 85 ? 'rose' : 'cyan'}/>
            <SparkLine data={gpuHistory} accent="cyan" height={60}/>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--oct-border-subtle)]">
              {([
                { label:'VRAM',  value:`${(metrics.vramUsed/1024).toFixed(1)} GB`, pct: metrics.vramUsed/8192*100, accent:'violet' },
                { label:'TEX',   value:`${metrics.textureMem} MB`,                  pct: metrics.textureMem/4096*100, accent:'amber' },
              ] as const).map(({label, value, pct, accent}) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <div className="flex justify-between"><span className="oct-label text-muted">{label}</span><span className={`font-mono text-[9px] text-${accent}`}>{value}</span></div>
                  <ProgressBar value={pct} accent={accent as any}/>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Frame breakdown + scene stats */}
      <div className="oct-grid-2 min-w-0">
        <Panel title="FRAME TIME BREAKDOWN" accent="violet" className="min-w-0">
          <div className="flex flex-col gap-2 min-w-0">
            {([
              { label:'RENDER PASS',  value: metrics.renderMs, color:'var(--oct-accent-cyan)', total: totalFrameMs },
              { label:'SHADOW PASS',  value: metrics.shadowMs, color:'var(--oct-accent-violet)', total: totalFrameMs },
              { label:'POST FX',      value: metrics.postFxMs, color:'var(--oct-accent-amber)', total: totalFrameMs },
              { label:'CPU SYNC',     value: metrics.cpuSync,  color:'var(--oct-accent-emerald)', total: totalFrameMs },
            ] as const).map(({label, value, color, total}) => (
              <div key={label} className="flex flex-col gap-0.5 min-w-0">
                <div className="flex justify-between min-w-0">
                  <span className="oct-label text-muted">{label}</span>
                  <span className="font-mono text-[9px]" style={{ color }}>{value.toFixed(2)}ms</span>
                </div>
                <div className="h-1.5 bg-[var(--oct-border-subtle)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-200"
                    style={{ width:`${Math.min(100, value/total*100)}%`, background: color }}/>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-[var(--oct-border-subtle)]">
              <span className="oct-label text-muted">TOTAL / TARGET</span>
              <span className={`font-mono text-[9px] font-bold ${totalFrameMs > 16.7 ? 'text-rose' : 'text-emerald'}`}>
                {totalFrameMs.toFixed(2)}ms / {(1000/targetFPS).toFixed(1)}ms
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="SCENE INVENTORY" accent="emerald" className="min-w-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            <BarMeter
              data={[
                { label:'TRIS',     value: Math.min(100, metrics.triangles/10000), unit:'K' },
                { label:'DRAW',     value: Math.min(100, metrics.drawCalls/20)    , unit:''  },
                { label:'SHADOW',   value: Math.min(100, metrics.shadowCasters/5) , unit:''  },
                { label:'PARTICLE', value: Math.min(100, metrics.particles/300)   , unit:'K' },
                { label:'SHADER',   value: Math.min(100, metrics.shaderPasses*8)  , unit:''  },
              ]}
              accent="emerald"
              orientation="horizontal"
            />
            <div className="flex flex-col gap-0.5 pt-2 border-t border-[var(--oct-border-subtle)]">
              {([
                { label:'TRIANGLES',    value:`${(metrics.triangles/1000).toFixed(1)}K` },
                { label:'DRAW CALLS',   value: String(metrics.drawCalls) },
                { label:'SHADER PASS',  value: String(metrics.shaderPasses) },
                { label:'SHADOW CAST',  value: String(metrics.shadowCasters) },
                { label:'PARTICLES',    value:`${(metrics.particles/1000).toFixed(1)}K` },
              ]).map(({label,value}) => (
                <div key={label} className="flex justify-between min-w-0">
                  <span className="oct-label text-muted">{label}</span>
                  <span className="font-mono text-[9px] text-[var(--oct-text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
