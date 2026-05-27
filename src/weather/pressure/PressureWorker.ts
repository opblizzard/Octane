import { buildPressureModel } from './PressureUtils'
import type { PressureModel, PressurePoint } from './types'

export function computePressureModel(points: PressurePoint[]): PressureModel {
  return buildPressureModel(points)
}
