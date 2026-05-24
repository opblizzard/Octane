import React from 'react'
import { useImageGenStore } from '@state/imagegen'
import { Knob } from '@components/controls/Knob'
import { Fader } from '@components/controls/Fader'
import { Toggle } from '@components/controls/Toggle'
import { Select } from '@components/controls/Select'

const MODEL_OPTIONS = [
  { value: '@cf/bytedance/stable-diffusion-xl-lightning', label: 'SDXL Lightning (fast)' },
  { value: '@cf/lykon/dreamshaper-8-lcm',                label: 'DreamShaper 8 LCM' },
  { value: '@cf/stabilityai/stable-diffusion-xl-base-1.0', label: 'SDXL Base 1.0' },
]

const SIZE_OPTIONS = [
  { value: '512',  label: '512px' },
  { value: '768',  label: '768px' },
  { value: '1024', label: '1024px' },
]

export function ImageControls() {
  const params    = useImageGenStore(s => s.params)
  const setParams = useImageGenStore(s => s.setParams)

  return (
    <div className="flex flex-col gap-4">
      {/* Model */}
      <Select
        label="Model"
        value={params.model}
        onChange={v => setParams({ model: v as typeof params.model })}
        options={MODEL_OPTIONS}
        accent="violet"
      />

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Width"
          value={String(params.width)}
          onChange={v => setParams({ width: Number(v) })}
          options={SIZE_OPTIONS}
          accent="cyan"
        />
        <Select
          label="Height"
          value={String(params.height)}
          onChange={v => setParams({ height: Number(v) })}
          options={SIZE_OPTIONS}
          accent="cyan"
        />
      </div>

      {/* Knobs row */}
      <div className="flex flex-wrap gap-4 justify-around">
        <Knob
          label="Steps"
          value={params.steps}
          min={1}
          max={50}
          onChange={v => setParams({ steps: Math.round(v) })}
          accent="cyan"
          size="md"
          unit=""
        />
        <Knob
          label="CFG"
          value={params.guidance}
          min={1}
          max={20}
          onChange={v => setParams({ guidance: parseFloat(v.toFixed(1)) })}
          accent="amber"
          size="md"
          unit=""
        />
        <Knob
          label="Strength"
          value={params.strength}
          min={0}
          max={1}
          onChange={v => setParams({ strength: parseFloat(v.toFixed(2)) })}
          accent="violet"
          size="md"
          unit=""
        />
      </div>

      {/* Seed */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Seed
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={params.seed}
            onChange={e => setParams({ seed: Number(e.target.value) })}
            className="flex-1 rounded font-mono text-xs px-2 py-1 outline-none min-w-0"
            style={{ background: 'var(--oct-surface-base)', border: '1px solid var(--oct-border-subtle)', color: 'var(--oct-accent-cyan)' }}
          />
          <button
            onClick={() => setParams({ seed: Math.floor(Math.random() * 2147483647) })}
            className="text-[10px] px-2 py-1 rounded"
            style={{ background: 'var(--oct-surface-raised)', color: 'var(--oct-text-muted)', border: '1px solid var(--oct-border-subtle)' }}
          >
            🎲
          </button>
          <button
            onClick={() => setParams({ seed: -1 })}
            className="text-[10px] px-2 py-1 rounded"
            style={{ background: 'var(--oct-surface-raised)', color: 'var(--oct-text-muted)', border: '1px solid var(--oct-border-subtle)' }}
          >
            Rnd
          </button>
        </div>
      </div>
    </div>
  )
}
