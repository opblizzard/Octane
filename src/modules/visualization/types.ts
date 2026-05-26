export type VisualizationNodeStatus = 'NOMINAL' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE'

export type VisualizationNode = {
  id: string
  name: string
  country: string
  region: string
  lat: number
  lng: number
  status: VisualizationNodeStatus
  latencyMs: number
  connections: string[]
}

export type VisualizationAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'

export type VisualizationAlert = {
  id: string
  type: string
  severity: VisualizationAlertSeverity
  serverId?: string
  title?: string
  description?: string
  timestamp?: number
  lat?: number
  lng?: number
  location?: {
    lat: number
    lng: number
    radius?: number
  }
  resolved: boolean
}

export type VisualizationConfig = {
  colors: {
    wireframe: string
    background: string
    grid: string
    nominal: string
    degraded: string
    critical: string
    atmosphere: string
    starfield: string
  }
  rotationSpeed: number
  updateInterval: number
  tileOpacity: number
  globeRadius: number
  minZoom: number
  maxZoom: number
  fogDensity: number
  telemetryBufferSize: number
}