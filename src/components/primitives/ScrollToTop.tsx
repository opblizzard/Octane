import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const handler = () => setVisible(main.scrollTop > 300)
    main.addEventListener('scroll', handler, { passive: true })
    return () => main.removeEventListener('scroll', handler)
  }, [])

  const scrollUp = () => {
    const main = document.querySelector('main')
    main?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollUp}
      className="oct-scroll-top fixed bottom-20 right-4 z-[105] w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all"
      style={{
        background:  'var(--oct-surface-overlay)',
        border:      '1px solid var(--oct-border-strong)',
        color:       'var(--oct-accent-cyan)',
      }}
      title="Scroll to top"
    >
      <ArrowUp size={15} />
    </button>
  )
}
