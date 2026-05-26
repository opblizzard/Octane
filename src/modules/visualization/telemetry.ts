export type TelemetrySample = {
  timestamp: number
  alerts: number
  traffic: number
  weather: number
}

type TelemetryEventMap = {
  'telemetry:update': TelemetrySample
  'telemetry:batch': TelemetrySample[]
  'scene:focus': { focusedNodeId: string }
}

type TelemetryEventName = keyof TelemetryEventMap
type TelemetryListener<K extends TelemetryEventName> = (payload: TelemetryEventMap[K]) => void

const listeners = new Map<TelemetryEventName, Set<(payload: unknown) => void>>()

export function emitTelemetryEvent<K extends TelemetryEventName>(event: K, payload: TelemetryEventMap[K]): void {
  listeners.get(event)?.forEach((listener) => listener(payload))
}

export function onTelemetryEvent<K extends TelemetryEventName>(event: K, listener: TelemetryListener<K>): () => void {
  const bucket = listeners.get(event) ?? new Set<(payload: unknown) => void>()
  bucket.add(listener as (payload: unknown) => void)
  listeners.set(event, bucket)
  return () => {
    const current = listeners.get(event)
    current?.delete(listener as (payload: unknown) => void)
  }
}

export function startTelemetry(callback: (sample: TelemetrySample) => void, updateInterval: number, bufferSize = 4): () => void {
  const buffer: TelemetrySample[] = []

  const timer = window.setInterval(() => {
    const sample = {
      timestamp: Date.now(),
      alerts: Math.floor(Math.random() * 5),
      traffic: Math.random(),
      weather: Math.random(),
    }
    buffer.push(sample)
    callback(sample)
    emitTelemetryEvent('telemetry:update', sample)

    if (buffer.length >= bufferSize) {
      emitTelemetryEvent('telemetry:batch', [...buffer])
      buffer.length = 0
    }
  }, updateInterval)

  return () => {
    if (buffer.length > 0) emitTelemetryEvent('telemetry:batch', [...buffer])
    window.clearInterval(timer)
  }
}