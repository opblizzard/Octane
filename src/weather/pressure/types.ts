export type PressurePoint = {
  lat: number
  lng: number
  pressure: number
}

export type PressurePath = {
  points: Array<[number, number]>
  level: number
}

export type PressureCenter = {
  type: 'HIGH' | 'LOW'
  lat: number
  lng: number
  value: number
}

export type PressureFront = {
  type: 'warm' | 'cold'
  points: Array<[number, number]>
}

export type PressureVector = {
  lat: number
  lng: number
  dx: number
  dy: number
}

export type PressureModel = {
  contours: PressurePath[]
  centers: PressureCenter[]
  fronts: PressureFront[]
  vectors: PressureVector[]
}
