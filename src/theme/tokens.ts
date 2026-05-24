export const CHAOS_COLORS = ['#00f5ff','#3b82f6','#8b5cf6','#a855f7','#f59e0b','#ef4444']

export function getChaosColor(chaos: number): string {
  if (chaos <= 0.0)  return '#00f5ff'
  if (chaos <= 0.25) return `hsl(${195 - chaos*4*60},100%,60%)`
  if (chaos <= 0.5)  return `hsl(${171 - (chaos-0.25)*4*90},80%,55%)`
  if (chaos <= 0.75) return `hsl(${81 - (chaos-0.5)*4*45},90%,55%)`
  return `hsl(${36 - (chaos-0.75)*4*36},100%,55%)`
}

export function getAccent(chaos: number): string {
  return getChaosColor(chaos)
}

export function applyTokens(chaos = 0): void {
  const root = document.documentElement
  const color = getChaosColor(chaos)
  root.style.setProperty('--chaos-color', color)
  root.style.setProperty('--accent', color)
}
