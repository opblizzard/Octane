import type { WeatherLayerData } from '@/modules/weather/types'
import type { PressurePoint } from './types'

export function normalizePressureData(layer: WeatherLayerData | undefined): PressurePoint[] {
  if (!layer || !Array.isArray(layer.vectorPoints)) return []
  return layer.vectorPoints.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    pressure: point.value,
  }))
}
