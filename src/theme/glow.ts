export function boxGlow(color: string, intensity = 1): string {
  return `0 0 ${12*intensity}px ${color}4D, 0 0 ${24*intensity}px ${color}1A`
}

export function getChaosGlow(chaos: number): string {
  if (chaos <= 0.25) return boxGlow('#00f5ff', 1 + chaos)
  if (chaos <= 0.5)  return boxGlow('#8b5cf6', 1 + chaos)
  if (chaos <= 0.75) return boxGlow('#f59e0b', 1 + chaos)
  return boxGlow('#ef4444', 1.5 + chaos)
}

export const glowPresets = {
  accent: boxGlow('#00f5ff'),
  green:  boxGlow('#10b981'),
  amber:  boxGlow('#f59e0b'),
  red:    boxGlow('#ef4444'),
  purple: boxGlow('#a855f7'),
}
