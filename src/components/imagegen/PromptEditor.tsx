import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useImageGenStore } from '@state/imagegen'

export function PromptEditor() {
  const params       = useImageGenStore(s => s.params)
  const setParams    = useImageGenStore(s => s.setParams)
  const addTag       = useImageGenStore(s => s.addTag)
  const removeTag    = useImageGenStore(s => s.removeTag)
  const addPositive  = useImageGenStore(s => s.addPositive)
  const removePositive = useImageGenStore(s => s.removePositive)

  const [tagInput, setTagInput] = useState('')
  const [posInput, setPosInput] = useState('')

  const submitTag = () => {
    const t = tagInput.trim()
    if (t) { addTag(t); setTagInput('') }
  }
  const submitPos = () => {
    const p = posInput.trim()
    if (p) { addPositive(p); setPosInput('') }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main prompt */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Prompt
        </label>
        <textarea
          rows={3}
          value={params.prompt}
          onChange={e => setParams({ prompt: e.target.value })}
          className="w-full rounded font-mono text-xs p-2.5 resize-none outline-none transition-colors"
          style={{
            background: 'var(--oct-surface-base)',
            border:     '1px solid var(--oct-border-strong)',
            color:      'var(--oct-text-primary)',
            caretColor: 'var(--oct-accent-cyan)',
          }}
          placeholder="Describe the image you want to generate…"
        />
      </div>

      {/* Negative */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Negative Prompt
        </label>
        <textarea
          rows={2}
          value={params.negatives.join(', ')}
          onChange={e => setParams({ negatives: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
          className="w-full rounded font-mono text-xs p-2 resize-none outline-none"
          style={{
            background: 'var(--oct-surface-base)',
            border:     '1px solid var(--oct-border-subtle)',
            color:      'var(--oct-text-secondary)',
            caretColor: 'var(--oct-accent-rose)',
          }}
          placeholder="Elements to avoid…"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Style Tags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {params.tags.map(t => (
            <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--oct-accent-violet)22', border: '1px solid var(--oct-accent-violet)44', color: 'var(--oct-accent-violet)' }}>
              {t}
              <button onClick={() => removeTag(t)} className="hover:opacity-70"><X size={9} /></button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitTag()}
              className="bg-transparent outline-none text-[10px] font-mono w-20"
              style={{ borderBottom: '1px solid var(--oct-border-strong)', color: 'var(--oct-text-secondary)' }}
              placeholder="add tag…"
            />
            <button onClick={submitTag} style={{ color: 'var(--oct-accent-violet)' }}><Plus size={11} /></button>
          </div>
        </div>
      </div>

      {/* Positives */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Quality Boosters
        </label>
        <div className="flex flex-wrap gap-1.5">
          {params.positives.map(p => (
            <span key={p} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--oct-status-ok)18', border: '1px solid var(--oct-status-ok)44', color: 'var(--oct-status-ok)' }}>
              {p}
              <button onClick={() => removePositive(p)} className="hover:opacity-70"><X size={9} /></button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={posInput}
              onChange={e => setPosInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPos()}
              className="bg-transparent outline-none text-[10px] font-mono w-24"
              style={{ borderBottom: '1px solid var(--oct-border-strong)', color: 'var(--oct-text-secondary)' }}
              placeholder="add booster…"
            />
            <button onClick={submitPos} style={{ color: 'var(--oct-status-ok)' }}><Plus size={11} /></button>
          </div>
        </div>
      </div>

      {/* Subjective */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Subjective Feedback / Style Direction
        </label>
        <input
          type="text"
          value={params.subjective}
          onChange={e => setParams({ subjective: e.target.value })}
          className="w-full rounded font-mono text-xs px-2.5 py-1.5 outline-none"
          style={{
            background: 'var(--oct-surface-base)',
            border:     '1px solid var(--oct-border-subtle)',
            color:      'var(--oct-text-secondary)',
          }}
          placeholder="e.g. make it feel cinematic, moody, futuristic…"
        />
      </div>
    </div>
  )
}
