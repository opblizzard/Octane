import React, { useEffect, useRef } from 'react'
import clsx from 'clsx'

export const Ticker: React.FC<{messages:string[];speed?:number;className?:string;accent?:'cyan'|'amber'|'violet'}> = ({
  messages, speed=40, className, accent='cyan',
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)
  const rafRef   = useRef<number>(0)
  const lastRef  = useRef(0)
  const colorMap = { cyan:'text-cyan', amber:'text-amber', violet:'text-violet' }
  const text = messages.join('   ·   ')

  useEffect(() => {
    const tick = (now: number) => {
      const dt = (now - (lastRef.current || now)) / 1000
      lastRef.current = now
      if (trackRef.current) {
        posRef.current -= speed * dt
        const w = trackRef.current.scrollWidth / 2
        if (posRef.current <= -w) posRef.current = 0
        trackRef.current.style.transform = `translateX(${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [speed])

  return (
    <div className={clsx('overflow-hidden flex items-center min-w-0', className)}>
      <div ref={trackRef} className="flex whitespace-nowrap" style={{willChange:'transform'}}>
        {[0,1].map(i => (
          <span key={i} className={clsx('font-mono text-[9px] tracking-widest mr-16', colorMap[accent])}>{text}</span>
        ))}
      </div>
    </div>
  )
}
