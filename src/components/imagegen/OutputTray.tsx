import React, { useState } from 'react'
import { Download, Copy, Info, Trash2, X } from 'lucide-react'
import { useImageGenStore } from '@state/imagegen'
import type { OutputImage } from '@state/imagegen'
import { toast } from '@state/toast'
import { clsx } from 'clsx'

export function OutputTray() {
  const images     = useImageGenStore(s => s.outputImages)
  const removeImage = useImageGenStore(s => s.removeImage)
  const clearImages = useImageGenStore(s => s.clearImages)
  const [selected, setSelected] = useState<OutputImage | null>(null)

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-md"
        style={{ border: '1px dashed var(--oct-border-subtle)', color: 'var(--oct-text-muted)' }}>
        <span className="text-2xl mb-2">🖼</span>
        <p className="text-xs">No images generated yet</p>
        <p className="text-[10px] mt-0.5">Enter a prompt and press Generate</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--oct-text-muted)' }}>
          Output — {images.length} image{images.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={clearImages}
          className="text-[10px] flex items-center gap-1 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--oct-text-muted)' }}
        >
          <Trash2 size={10} /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map(img => (
          <ImageCard key={img.id} img={img} onInfo={() => setSelected(img)} onRemove={() => removeImage(img.id)} />
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(7,11,16,0.85)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative rounded-lg overflow-hidden shadow-2xl max-w-2xl w-full"
            style={{ background: 'var(--oct-surface-panel)', border: '1px solid var(--oct-border-strong)' }}
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 z-10" style={{ color: 'var(--oct-text-muted)' }} onClick={() => setSelected(null)}>
              <X size={16} />
            </button>
            <img src={selected.url} alt={selected.prompt} className="w-full max-h-[60vh] object-contain" />
            <div className="p-4 space-y-2 text-[11px] font-mono" style={{ color: 'var(--oct-text-secondary)' }}>
              <p><span style={{ color: 'var(--oct-text-muted)' }}>Prompt:</span> {selected.prompt}</p>
              <div className="flex flex-wrap gap-3">
                <span><span style={{ color: 'var(--oct-text-muted)' }}>Model:</span> {(selected.params?.model ?? '').split('/').pop()}</span>
                <span><span style={{ color: 'var(--oct-text-muted)' }}>Size:</span> {selected.params?.width ?? '?'}×{selected.params?.height ?? '?'}</span>
                <span><span style={{ color: 'var(--oct-text-muted)' }}>Steps:</span> {selected.params?.steps ?? '?'}</span>
                <span><span style={{ color: 'var(--oct-text-muted)' }}>CFG:</span> {selected.params?.guidance ?? '?'}</span>
                <span><span style={{ color: 'var(--oct-text-muted)' }}>Seed:</span> {selected.params?.seed ?? '?'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ImageCard({ img, onInfo, onRemove }: { img: OutputImage; onInfo: () => void; onRemove: () => void }) {
  const download = () => {
    const a = document.createElement('a')
    a.href = img.url
    a.download = `octane-${img.id}.png`
    a.click()
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(img.prompt).then(() => toast.success('Prompt copied!'))
  }

  return (
    <div
      className="group relative rounded-md overflow-hidden"
      style={{ border: '1px solid var(--oct-border-subtle)', background: 'var(--oct-surface-raised)' }}
    >
      <img
        src={img.url}
        alt={img.prompt}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
      {/* Overlay controls */}
      <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(to top, rgba(7,11,16,0.85) 40%, transparent)' }}>
        <div className="flex items-center gap-1.5 p-2 w-full">
          <button onClick={download} title="Download" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--oct-accent-cyan)' }}>
            <Download size={13} />
          </button>
          <button onClick={copyPrompt} title="Copy prompt" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--oct-accent-cyan)' }}>
            <Copy size={13} />
          </button>
          <button onClick={onInfo} title="Details" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--oct-text-muted)' }}>
            <Info size={13} />
          </button>
          <button onClick={onRemove} title="Remove" className="ml-auto hover:opacity-70 transition-opacity" style={{ color: 'var(--oct-status-crit)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
        {/* Duration badge */}
      <div className="absolute top-1.5 right-1.5 text-[8px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(7,11,16,0.75)', color: 'var(--oct-accent-cyan)' }}>
        img
      </div>
    </div>
  )
}
