import { useEffect } from 'react'
import { useCFStore } from '@state/cloudflare'

/** Connects to the MetricsRoom Durable Object WebSocket on mount, disconnects on unmount. */
export function useCFMetrics() {
  const { connect, disconnect, connected, colo, p50Lat, p95Lat, p99Lat, cpuMs, reqPerSec, errorRate, history } = useCFStore()

  useEffect(() => {
    connect()
    return () => { /* keep WS alive across remounts — disconnect only if no other consumer */ }
  }, [connect])

  return { connected, colo, p50Lat, p95Lat, p99Lat, cpuMs, reqPerSec, errorRate, history }
}
