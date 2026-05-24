import React from 'react'

/**
 * Ambient CRT scan-line overlay — purely cosmetic.
 * Renders a single moving line + a faint static scanline grid.
 */
export const ScanLineOverlay: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    aria-hidden="true"
  >
    {/* Faint static scanline grid */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.5) 2px, rgba(0,245,255,0.5) 3px)',
      }}
    />
    {/* Moving scan line */}
    <div
      className="oct-scan-line absolute left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,245,255,0.12) 30%, rgba(0,245,255,0.18) 50%, rgba(0,245,255,0.12) 70%, transparent 100%)',
      }}
    />
  </div>
)
