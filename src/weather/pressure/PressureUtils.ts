import type { PressureCenter, PressureFront, PressureModel, PressurePath, PressurePoint, PressureVector } from './types'

type Grid = {
  lats: number[]
  lngs: number[]
  values: number[][]
}

function lerp(a: number, b: number, t: number): number {
  return a + ((b - a) * t)
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values.map((value) => Number(value.toFixed(4))))).sort((a, b) => a - b)
}

function nearestPressure(points: PressurePoint[], lat: number, lng: number): number {
  let best = points[0]?.pressure ?? 1012
  let bestScore = Number.POSITIVE_INFINITY
  for (const point of points) {
    const dLat = point.lat - lat
    const dLng = point.lng - lng
    const score = (dLat * dLat) + (dLng * dLng)
    if (score < bestScore) {
      bestScore = score
      best = point.pressure
    }
  }
  return best
}

function toGrid(points: PressurePoint[]): Grid | null {
  if (points.length < 8) return null

  const lats = uniqueSorted(points.map((point) => point.lat))
  const lngs = uniqueSorted(points.map((point) => point.lng))
  if (lats.length < 3 || lngs.length < 3) return null

  const pointByKey = new Map<string, number>()
  points.forEach((point) => {
    pointByKey.set(`${point.lat.toFixed(4)}|${point.lng.toFixed(4)}`, point.pressure)
  })

  const values = lats.map((lat) => lngs.map((lng) => {
    const key = `${lat.toFixed(4)}|${lng.toFixed(4)}`
    const exact = pointByKey.get(key)
    return typeof exact === 'number' ? exact : nearestPressure(points, lat, lng)
  }))

  return { lats, lngs, values }
}

function interpolateEdge(
  p1: [number, number],
  v1: number,
  p2: [number, number],
  v2: number,
  level: number,
): [number, number] {
  if (Math.abs(v1 - v2) < 1e-6) return p1
  const t = Math.max(0, Math.min(1, (level - v1) / (v2 - v1)))
  return [lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t)]
}

function marchingSquaresContours(grid: Grid): PressurePath[] {
  const flatValues = grid.values.flat()
  const minLevel = Math.floor(Math.min(...flatValues) / 2) * 2
  const maxLevel = Math.ceil(Math.max(...flatValues) / 2) * 2
  const contours: PressurePath[] = []

  const table: Record<number, Array<[number, number]>> = {
    0: [],
    1: [[3, 2]],
    2: [[2, 1]],
    3: [[3, 1]],
    4: [[0, 1]],
    5: [[0, 3], [1, 2]],
    6: [[0, 2]],
    7: [[0, 3]],
    8: [[0, 3]],
    9: [[0, 2]],
    10: [[0, 1], [2, 3]],
    11: [[0, 1]],
    12: [[1, 3]],
    13: [[1, 2]],
    14: [[2, 3]],
    15: [],
  }

  for (let level = minLevel; level <= maxLevel; level += 2) {
    const segments: Array<[[number, number], [number, number]]> = []

    for (let row = 0; row < grid.lats.length - 1; row += 1) {
      for (let col = 0; col < grid.lngs.length - 1; col += 1) {
        const p0: [number, number] = [grid.lats[row], grid.lngs[col]]
        const p1: [number, number] = [grid.lats[row], grid.lngs[col + 1]]
        const p2: [number, number] = [grid.lats[row + 1], grid.lngs[col + 1]]
        const p3: [number, number] = [grid.lats[row + 1], grid.lngs[col]]

        const v0 = grid.values[row][col]
        const v1 = grid.values[row][col + 1]
        const v2 = grid.values[row + 1][col + 1]
        const v3 = grid.values[row + 1][col]

        const mask =
          (v0 >= level ? 1 : 0)
          | (v1 >= level ? 2 : 0)
          | (v2 >= level ? 4 : 0)
          | (v3 >= level ? 8 : 0)

        const pairs = table[mask]
        if (!pairs || pairs.length === 0) continue

        const edgePoints: Record<number, [number, number]> = {
          0: interpolateEdge(p0, v0, p1, v1, level),
          1: interpolateEdge(p1, v1, p2, v2, level),
          2: interpolateEdge(p2, v2, p3, v3, level),
          3: interpolateEdge(p3, v3, p0, v0, level),
        }

        pairs.forEach(([a, b]) => {
          segments.push([edgePoints[a], edgePoints[b]])
        })
      }
    }

    segments.forEach((segment) => {
      contours.push({
        level,
        points: [
          [Number(segment[0][0].toFixed(4)), Number(segment[0][1].toFixed(4))],
          [Number(segment[1][0].toFixed(4)), Number(segment[1][1].toFixed(4))],
        ],
      })
    })
  }

  return contours
}

function buildCenters(points: PressurePoint[]): PressureCenter[] {
  if (points.length === 0) return []
  const low = points.reduce((best, point) => (point.pressure < best.pressure ? point : best), points[0])
  const high = points.reduce((best, point) => (point.pressure > best.pressure ? point : best), points[0])
  return [
    { type: 'LOW', lat: low.lat, lng: low.lng, value: low.pressure },
    { type: 'HIGH', lat: high.lat, lng: high.lng, value: high.pressure },
  ]
}

function buildFronts(points: PressurePoint[], centers: PressureCenter[]): PressureFront[] {
  if (points.length < 8 || centers.length < 2) return []
  const low = centers.find((center) => center.type === 'LOW')
  const high = centers.find((center) => center.type === 'HIGH')
  if (!low || !high) return []

  const minLat = Math.min(...points.map((point) => point.lat))
  const maxLat = Math.max(...points.map((point) => point.lat))
  const minLng = Math.min(...points.map((point) => point.lng))
  const maxLng = Math.max(...points.map((point) => point.lng))
  const latSpan = Math.max(2, maxLat - minLat)
  const lngSpan = Math.max(4, maxLng - minLng)

  const warmFront: Array<[number, number]> = []
  const coldFront: Array<[number, number]> = []

  for (let i = 0; i <= 7; i += 1) {
    const t = i / 7
    const lat = Math.max(minLat, Math.min(maxLat, low.lat + (latSpan * (0.06 + (0.12 * t))) + (Math.sin(t * Math.PI) * latSpan * 0.04)))
    const lng = Math.max(minLng, Math.min(maxLng, low.lng + (lngSpan * (0.08 + (0.58 * t)))))
    warmFront.push([Number(lat.toFixed(4)), Number(lng.toFixed(4))])
  }

  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8
    const lat = Math.max(minLat, Math.min(maxLat, low.lat - (latSpan * (0.06 + (0.5 * t)))))
    const lng = Math.max(minLng, Math.min(maxLng, low.lng - (lngSpan * (0.05 + (0.34 * t))) + (Math.sin(t * Math.PI) * lngSpan * 0.05)))
    coldFront.push([Number(lat.toFixed(4)), Number(lng.toFixed(4))])
  }

  // Nudge fronts toward the high/low axis so they flow with synoptic movement.
  if (warmFront.length > 0 && high) {
    warmFront[warmFront.length - 1] = [
      Number(((warmFront[warmFront.length - 1][0] + high.lat) / 2).toFixed(4)),
      Number(((warmFront[warmFront.length - 1][1] + high.lng) / 2).toFixed(4)),
    ]
  }

  return [
    { type: 'warm', points: warmFront },
    { type: 'cold', points: coldFront },
  ]
}

function buildVectors(grid: Grid): PressureVector[] {
  const vectors: PressureVector[] = []
  for (let row = 1; row < grid.lats.length - 1; row += 2) {
    for (let col = 1; col < grid.lngs.length - 1; col += 2) {
      const dpdx = (grid.values[row][col + 1] - grid.values[row][col - 1]) / (grid.lngs[col + 1] - grid.lngs[col - 1])
      const dpdy = (grid.values[row + 1][col] - grid.values[row - 1][col]) / (grid.lats[row + 1] - grid.lats[row - 1])
      const magnitude = Math.sqrt((dpdx * dpdx) + (dpdy * dpdy)) || 1
      const scale = 0.25
      vectors.push({
        lat: grid.lats[row],
        lng: grid.lngs[col],
        dx: Number((-(dpdx / magnitude) * scale).toFixed(4)),
        dy: Number((-(dpdy / magnitude) * scale).toFixed(4)),
      })
    }
  }
  return vectors
}

export function buildPressureModel(points: PressurePoint[]): PressureModel {
  const grid = toGrid(points)
  if (!grid) {
    return { contours: [], centers: [], fronts: [], vectors: [] }
  }

  const contours = marchingSquaresContours(grid)
  const centers = buildCenters(points)
  const fronts = buildFronts(points, centers)
  const vectors = buildVectors(grid)
  return { contours, centers, fronts, vectors }
}
