import { Hono } from 'hono';
import type { Env } from '../../types/index.js';

export const weatherRouter = new Hono<{ Bindings: Env }>();

type RadarFrame = {
  timestamp: string
  tileUrlTemplate: string
  attribution: string
  stale: boolean
}

type StormCell = {
  id: string
  name: string
  type?: 'storm' | 'hurricane'
  hurricaneCategory?: 1 | 2 | 3 | 4 | 5
  polygon: Array<[number, number]>
  centroid: [number, number]
  movement: {
    speedKts: number
    directionDeg: number
  }
  intensity: {
    category: 'light' | 'moderate' | 'severe'
    dbz: number
  }
  updatedAt: string
  stale: boolean
}

type EnvLayerType =
  | 'precipitation'
  | 'wind'
  | 'pressure'
  | 'smoke'
  | 'cloudCoverage'
  | 'stormCloudCoverage'
  | 'hurricaneRainRadar'
  | 'lightningTracking'
type ViewportBounds = {
  west: number
  south: number
  east: number
  north: number
}

function parseStepMinutes(raw?: string): number {
  const parsed = Number(raw ?? '5');
  if (!Number.isFinite(parsed) || parsed <= 0) return 5;
  return Math.max(5, Math.min(15, Math.round(parsed)));
}

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function buildRadarFrames(fromIso: string, toIso: string, stepMinutes: number): RadarFrame[] {
  const now = Date.now();
  const fromMs = Number.isFinite(+new Date(fromIso)) ? +new Date(fromIso) : now - (2 * 60 * 60 * 1000);
  const toMs = Number.isFinite(+new Date(toIso)) ? +new Date(toIso) : now;
  const start = Math.min(fromMs, toMs);
  const end = Math.max(fromMs, toMs);
  const stepMs = stepMinutes * 60 * 1000;

  const frames: RadarFrame[] = [];
  for (let cursor = start; cursor <= end; cursor += stepMs) {
    const timestamp = new Date(cursor).toISOString();
    const ageMinutes = Math.max(0, Math.round((now - cursor) / 60000));
    const radarTime = toUnixSeconds(timestamp);
    frames.push({
      timestamp,
      tileUrlTemplate: `https://tilecache.rainviewer.com/v2/radar/${radarTime}/256/{z}/{x}/{y}/2/1_1.png`,
      attribution: 'Radar: RainViewer',
      stale: ageMinutes > 12,
    });
  }

  return frames;
}

type RainViewerFrame = {
  time: number
  path: string
}

type RainViewerMapsResponse = {
  host?: string
  radar?: {
    past?: RainViewerFrame[]
    nowcast?: RainViewerFrame[]
  }
  satellite?: {
    infrared?: RainViewerFrame[]
  }
}

async function fetchRainViewerFrames(fromIso: string, toIso: string): Promise<RadarFrame[] | null> {
  try {
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!response.ok) return null;

    const payload = await response.json() as RainViewerMapsResponse;
    const host = typeof payload.host === 'string' ? payload.host : 'https://tilecache.rainviewer.com';
    const pastFrames = Array.isArray(payload.radar?.past) ? payload.radar?.past : []
    const nowcastFrames = Array.isArray(payload.radar?.nowcast) ? payload.radar?.nowcast : []

    // Prefer observed radar (past) so map never shows nowcast vector overlays or unsupported zoom placeholders.
    const candidates = (pastFrames.length > 0 ? pastFrames : nowcastFrames)
      .filter((entry): entry is RainViewerFrame => {
        return typeof entry?.time === 'number' && typeof entry?.path === 'string';
      })
      .sort((a, b) => a.time - b.time);

    if (candidates.length === 0) return null;

    const fromSec = Math.floor(new Date(fromIso).getTime() / 1000);
    const toSec = Math.floor(new Date(toIso).getTime() / 1000);
    const start = Math.min(fromSec, toSec);
    const end = Math.max(fromSec, toSec);
    const nowSec = Math.floor(Date.now() / 1000);

    const scoped = candidates.filter((entry) => entry.time >= start && entry.time <= end);
    const selected = scoped.length > 0 ? scoped : candidates.slice(-13);

    return selected.map((entry) => ({
      timestamp: new Date(entry.time * 1000).toISOString(),
      tileUrlTemplate: `${host}${entry.path}/256/{z}/{x}/{y}/2/1_1.png`,
      attribution: 'Radar: RainViewer',
      stale: (nowSec - entry.time) > (12 * 60),
    }));
  } catch {
    return null;
  }
}

type SatelliteTileMode = 'cloud' | 'storm'

async function fetchRainViewerSatelliteTile(
  timeIso: string,
  mode: SatelliteTileMode,
): Promise<{ tileUrlTemplate: string; attribution: string; stale: boolean; sampledTimeIso: string } | null> {
  try {
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json')
    if (!response.ok) return null

    const payload = await response.json() as RainViewerMapsResponse
    const host = typeof payload.host === 'string' ? payload.host : 'https://tilecache.rainviewer.com'
    const frames = Array.isArray(payload.satellite?.infrared)
      ? payload.satellite?.infrared.filter((entry): entry is RainViewerFrame => {
        return typeof entry?.time === 'number' && typeof entry?.path === 'string'
      })
      : []

    if (frames.length === 0) return null

    const targetSec = Math.floor(new Date(timeIso).getTime() / 1000)
    const nearest = frames.reduce((best, current) => {
      return Math.abs(current.time - targetSec) < Math.abs(best.time - targetSec) ? current : best
    }, frames[0])

    const nowSec = Math.floor(Date.now() / 1000)
    const stale = (nowSec - nearest.time) > (40 * 60)
    const style = mode === 'storm' ? '1/1_1' : '0/0_0'

    return {
      tileUrlTemplate: `${host}${nearest.path}/256/{z}/{x}/{y}/${style}.png`,
      attribution: 'Clouds: RainViewer satellite',
      stale,
      sampledTimeIso: new Date(nearest.time * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

function getTimeJitter(timeIso: string): number {
  const seconds = Math.floor(new Date(timeIso).getTime() / 1000)
  return Number.isFinite(seconds) ? seconds : Math.floor(Date.now() / 1000)
}

function shiftPoint(lat: number, lng: number, jitter: number, latFactor: number, lngFactor: number): [number, number] {
  const latShift = Math.sin((jitter / 420) + latFactor) * 0.35
  const lngShift = Math.cos((jitter / 520) + lngFactor) * 0.45
  return [Number((lat + latShift).toFixed(4)), Number((lng + lngShift).toFixed(4))]
}

function parseBbox(raw?: string): ViewportBounds | undefined {
  if (!raw) return undefined
  const parts = raw.split(',').map((part) => Number(part.trim()))
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return undefined

  let [west, south, east, north] = parts
  if (west > east) [west, east] = [east, west]
  if (south > north) [south, north] = [north, south]

  return {
    west,
    south: Math.max(-85, Math.min(85, south)),
    east,
    north: Math.max(-85, Math.min(85, north)),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

type WindSample = {
  speedKts: number
  directionDeg: number
}

const WIND_SAMPLE_CACHE = new Map<string, { expiresAt: number; value: WindSample | null }>()
const WIND_CACHE_TTL_MS = 8 * 60 * 1000

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

function pickNearestIndex(times: string[], targetIso: string): number {
  const targetMs = new Date(targetIso).getTime()
  let bestIndex = 0
  let bestDelta = Number.POSITIVE_INFINITY

  times.forEach((time, index) => {
    const delta = Math.abs(new Date(time).getTime() - targetMs)
    if (delta < bestDelta) {
      bestDelta = delta
      bestIndex = index
    }
  })

  return bestIndex
}

async function fetchOpenMeteoWindSample(lat: number, lng: number, timeIso: string): Promise<WindSample | null> {
  const latKey = roundTo(lat, 1)
  const lngKey = roundTo(lng, 1)
  const timeBucket = Math.floor(new Date(timeIso).getTime() / (60 * 60 * 1000))
  const cacheKey = `${latKey}:${lngKey}:${timeBucket}`
  const cached = WIND_SAMPLE_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(latKey))
    url.searchParams.set('longitude', String(lngKey))
    url.searchParams.set('hourly', 'wind_speed_250hPa,wind_direction_250hPa,wind_speed_10m,wind_direction_10m')
    url.searchParams.set('forecast_days', '2')
    url.searchParams.set('timezone', 'UTC')

    const response = await fetch(url.toString())
    if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`)
    const payload = await response.json() as {
      hourly?: {
        time?: string[]
        wind_speed_250hPa?: number[]
        wind_direction_250hPa?: number[]
        wind_speed_10m?: number[]
        wind_direction_10m?: number[]
      }
    }

    const times = Array.isArray(payload.hourly?.time) ? payload.hourly?.time : []
    if (!times || times.length === 0) {
      WIND_SAMPLE_CACHE.set(cacheKey, { expiresAt: Date.now() + WIND_CACHE_TTL_MS, value: null })
      return null
    }

    const idx = pickNearestIndex(times, timeIso)
    const jetSpeed = payload.hourly?.wind_speed_250hPa?.[idx]
    const jetDir = payload.hourly?.wind_direction_250hPa?.[idx]
    const lowSpeed = payload.hourly?.wind_speed_10m?.[idx]
    const lowDir = payload.hourly?.wind_direction_10m?.[idx]

    const speedKmh = Number.isFinite(jetSpeed) ? Number(jetSpeed) : Number(lowSpeed)
    const directionDeg = Number.isFinite(jetDir) ? Number(jetDir) : Number(lowDir)
    if (!Number.isFinite(speedKmh) || !Number.isFinite(directionDeg)) {
      WIND_SAMPLE_CACHE.set(cacheKey, { expiresAt: Date.now() + WIND_CACHE_TTL_MS, value: null })
      return null
    }

    const sample: WindSample = {
      speedKts: Number((speedKmh * 0.539957).toFixed(2)),
      directionDeg: Number(directionDeg.toFixed(1)),
    }
    WIND_SAMPLE_CACHE.set(cacheKey, { expiresAt: Date.now() + WIND_CACHE_TTL_MS, value: sample })
    return sample
  } catch {
    WIND_SAMPLE_CACHE.set(cacheKey, { expiresAt: Date.now() + WIND_CACHE_TTL_MS, value: null })
    return null
  }
}

async function buildRealWindField(bounds: ViewportBounds | undefined, timeIso: string): Promise<Array<{ lat: number; lng: number; value: number; directionDeg: number }>> {
  if (!bounds) return []

  const rows = 4
  const cols = 6
  const latSpan = Math.max(1.2, bounds.north - bounds.south)
  const lngSpan = Math.max(1.6, bounds.east - bounds.west)

  const grid = Array.from({ length: rows * cols }).map((_, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const lat = bounds.south + (((row + 0.5) / rows) * latSpan)
    const lng = bounds.west + (((col + 0.5) / cols) * lngSpan)
    return { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) }
  })

  const samples = await Promise.all(grid.map(async (point) => {
    const sample = await fetchOpenMeteoWindSample(point.lat, point.lng, timeIso)
    if (!sample) return null
    return {
      lat: point.lat,
      lng: point.lng,
      value: sample.speedKts,
      directionDeg: sample.directionDeg,
    }
  }))

  return samples.filter((sample): sample is { lat: number; lng: number; value: number; directionDeg: number } => sample !== null)
}

function smoothSignal(lat: number, lng: number, timePhase: number): number {
  const v1 = Math.sin((lat * 0.09) + timePhase)
  const v2 = Math.cos((lng * 0.07) - (timePhase * 0.8))
  const v3 = Math.sin(((lat + lng) * 0.045) + (timePhase * 0.55))
  const v4 = Math.cos(((lat - lng) * 0.038) - (timePhase * 0.62))
  return ((v1 * 0.34) + (v2 * 0.26) + (v3 * 0.23) + (v4 * 0.17) + 1) / 2
}

function stableNoise(lat: number, lng: number): number {
  const value = Math.sin((lat * 12.9898) + (lng * 78.233)) * 43758.5453
  return value - Math.floor(value)
}

function buildCoherentCloudField(
  bounds: ViewportBounds | undefined,
  timeIso: string,
  type: 'cloudCoverage' | 'stormCloudCoverage',
  stormCells: StormCell[],
): Array<{ lat: number; lng: number; value: number; directionDeg?: number }> {
  const fallbackBounds: ViewportBounds = bounds ?? {
    west: -130,
    south: 10,
    east: -55,
    north: 55,
  }

  const latStep = type === 'stormCloudCoverage' ? 1.2 : 1.5
  const lngStep = type === 'stormCloudCoverage' ? 1.5 : 1.9
  const latPad = 2.4
  const lngPad = 3.2
  const parsedMs = new Date(timeIso).getTime()
  const rawTimeSec = Math.floor((Number.isFinite(parsedMs) ? parsedMs : Date.now()) / 1000)
  // Quantize cloud simulation time to 10-minute buckets to avoid rapid visual flicker.
  const timeSec = Math.floor(rawTimeSec / 600) * 600
  const timePhase = timeSec / 7200

  const latStart = Math.floor((fallbackBounds.south - latPad) / latStep) * latStep
  const latEnd = Math.ceil((fallbackBounds.north + latPad) / latStep) * latStep
  const lngStart = Math.floor((fallbackBounds.west - lngPad) / lngStep) * lngStep
  const lngEnd = Math.ceil((fallbackBounds.east + lngPad) / lngStep) * lngStep

  const points: Array<{ lat: number; lng: number; value: number; directionDeg?: number }> = []
  const driftDeg = 244
  const driftPhase = timeSec / 3600
  const clusterGate = type === 'stormCloudCoverage' ? 0.6 : 0.56

  for (let lat = latStart; lat <= latEnd; lat += latStep) {
    for (let lng = lngStart; lng <= lngEnd; lng += lngStep) {
      const driftLat = lat + (Math.sin((driftPhase * 0.35) + (lng * 0.08)) * 0.22)
      const driftLng = lng + (Math.cos((driftPhase * 0.32) + (lat * 0.07)) * 0.28)
      const jitterSeed = stableNoise(lat, lng)
      const pointLat = driftLat + ((jitterSeed - 0.5) * latStep * 0.38)
      const pointLng = driftLng + ((stableNoise(lng, lat) - 0.5) * lngStep * 0.34)

      const base = smoothSignal(pointLat, pointLng, timePhase)
      const tropicalBand = Math.max(0, 1 - (Math.abs(pointLat - 18) / 42)) * 0.34

      const stormInfluence = stormCells.reduce((acc, storm) => {
        const dLat = pointLat - storm.centroid[0]
        const dLng = pointLng - storm.centroid[1]
        const distSq = (dLat * dLat) + (dLng * dLng)
        const influence = Math.exp(-distSq / (type === 'stormCloudCoverage' ? 18 : 34))
        return Math.max(acc, influence)
      }, 0)

      const lobeSignal = smoothSignal((pointLat * 0.72) + 11, (pointLng * 0.7) - 7, (timePhase * 1.18) + 2.3)
      const streakSignal = (
        Math.sin((pointLat * 0.21) + (timePhase * 1.9))
        + Math.cos((pointLng * 0.19) - (timePhase * 1.35))
        + 2
      ) / 4
      const clusterSignal = clamp((lobeSignal * 0.58) + (streakSignal * 0.27) + (stormInfluence * 0.34), 0, 1)

      // Keep only coherent cloud clusters; this prevents bbox-wide haze sheets.
      if (clusterSignal < clusterGate) continue

      const textureMask = Math.sin((pointLat * 0.38) + (pointLng * 0.33) + (timePhase * 1.44))
      if (textureMask < (type === 'stormCloudCoverage' ? -0.42 : -0.26)) continue

      const keepProbability = type === 'stormCloudCoverage' ? 0.74 : 0.62
      if (stableNoise(pointLat * 1.3, pointLng * 1.1) > keepProbability) continue

      const value01 = clamp(
        (base * 0.68)
          + tropicalBand
          + (clusterSignal * (type === 'stormCloudCoverage' ? 0.46 : 0.42))
          + (stormInfluence * (type === 'stormCloudCoverage' ? 0.58 : 0.28))
          - (type === 'stormCloudCoverage' ? 0.36 : 0.2),
        0,
        1,
      )

      const value = type === 'stormCloudCoverage'
        ? 30 + (value01 * 70)
        : 18 + (value01 * 82)

      const threshold = type === 'stormCloudCoverage' ? 52 : 44
      if (value < threshold) continue

      points.push({
        lat: Number(pointLat.toFixed(4)),
        lng: Number(pointLng.toFixed(4)),
        value: Number(value.toFixed(2)),
        directionDeg: driftDeg + Math.round(Math.sin((lat + lng + timePhase) * 0.12) * 18),
      })
    }
  }

  return points
}

function isCentroidInBounds(
  centroid: [number, number],
  bounds: ViewportBounds,
  options?: { latPad?: number; lngPad?: number },
): boolean {
  const latPad = options?.latPad ?? 0
  const lngPad = options?.lngPad ?? 0
  const [lat, lng] = centroid
  return lat >= (bounds.south - latPad)
    && lat <= (bounds.north + latPad)
    && lng >= (bounds.west - lngPad)
    && lng <= (bounds.east + lngPad)
}

function buildStormCells(timeIso: string, bounds?: ViewportBounds): StormCell[] {
  const jitter = getTimeJitter(timeIso)
  const now = Date.now()

  const seed = [
    {
      id: 'storm-gulf-echo',
      name: 'Echo Cell',
      base: [
        [29.8, -92.8],
        [30.4, -91.9],
        [29.9, -91.1],
        [29.2, -91.8],
      ] as Array<[number, number]>,
      centroid: [29.8, -91.9] as [number, number],
      speedKts: 34,
      directionDeg: 58,
      dbz: 49,
      category: 'severe' as const,
    },
    {
      id: 'storm-midwest-nova',
      name: 'Nova Band',
      base: [
        [41.6, -92.4],
        [42.2, -91.2],
        [41.4, -90.6],
        [40.9, -91.7],
      ] as Array<[number, number]>,
      centroid: [41.5, -91.5] as [number, number],
      speedKts: 26,
      directionDeg: 81,
      dbz: 41,
      category: 'moderate' as const,
    },
    {
      id: 'storm-atlantic-cirrus',
      name: 'Cirrus Front',
      type: 'storm' as const,
      base: [
        [36.1, -75.2],
        [36.8, -74.5],
        [36.2, -73.8],
        [35.6, -74.4],
      ] as Array<[number, number]>,
      centroid: [36.2, -74.5] as [number, number],
      speedKts: 22,
      directionDeg: 36,
      dbz: 33,
      category: 'light' as const,
    },
    {
      id: 'hurricane-atlantic-helena',
      name: 'Hurricane Helena',
      type: 'hurricane' as const,
      hurricaneCategory: 3 as const,
      base: [
        [24.5, -67.5],
        [26.2, -65.1],
        [24.8, -62.8],
        [22.7, -64.4],
      ] as Array<[number, number]>,
      centroid: [24.6, -64.9] as [number, number],
      speedKts: 17,
      directionDeg: 318,
      dbz: 57,
      category: 'severe' as const,
    },
    {
      id: 'hurricane-pacific-orion',
      name: 'Hurricane Orion',
      type: 'hurricane' as const,
      hurricaneCategory: 2 as const,
      base: [
        [15.2, -128.8],
        [16.9, -126.3],
        [15.4, -123.9],
        [13.2, -125.4],
      ] as Array<[number, number]>,
      centroid: [15.2, -126.1] as [number, number],
      speedKts: 13,
      directionDeg: 298,
      dbz: 54,
      category: 'severe' as const,
    },
    {
      id: 'storm-noreaster-nyb',
      name: 'Noreaster Band',
      type: 'storm' as const,
      base: [
        [41.6, -75.8],
        [42.3, -73.9],
        [41.2, -72.2],
        [40.3, -73.8],
      ] as Array<[number, number]>,
      centroid: [41.4, -73.9] as [number, number],
      speedKts: 29,
      directionDeg: 62,
      dbz: 46,
      category: 'moderate' as const,
    },
    {
      id: 'hurricane-atlantic-ny-approach',
      name: 'Hurricane Nyx',
      type: 'hurricane' as const,
      hurricaneCategory: 1 as const,
      base: [
        [38.6, -69.8],
        [39.9, -67.9],
        [38.8, -66.2],
        [37.4, -67.3],
      ] as Array<[number, number]>,
      centroid: [38.7, -67.8] as [number, number],
      speedKts: 16,
      directionDeg: 334,
      dbz: 52,
      category: 'severe' as const,
    },
  ]

  const scopedSeed = bounds
    ? (() => {
      const latSpan = Math.max(2, bounds.north - bounds.south)
      const lngSpan = Math.max(3, bounds.east - bounds.west)
      const latPad = clamp(latSpan * 0.12, 0.7, 4.5)
      const lngPad = clamp(lngSpan * 0.12, 1.1, 6)

      const inBounds = seed.filter((cell) => isCentroidInBounds(cell.centroid, bounds, { latPad, lngPad }))
      // Keep returning real storms near the map edge so viewport tracking remains stable while panning.
      return inBounds.length > 0 ? inBounds : seed
    })()
    : seed

  return scopedSeed.map((cell, index) => {
    const polygon = cell.base.map(([lat, lng], pointIndex) => (
      shiftPoint(lat, lng, jitter + (index * 90), pointIndex * 0.8, pointIndex * 0.6)
    ))
    const centroid = shiftPoint(cell.centroid[0], cell.centroid[1], jitter + (index * 120), 0.2, 0.5)
    const stale = (now - new Date(timeIso).getTime()) > (20 * 60 * 1000)

    return {
      id: cell.id,
      name: cell.name,
      type: cell.type,
      hurricaneCategory: cell.type === 'hurricane' ? cell.hurricaneCategory : undefined,
      polygon,
      centroid,
      movement: {
        speedKts: cell.speedKts,
        directionDeg: cell.directionDeg,
      },
      intensity: {
        category: cell.category,
        dbz: cell.dbz,
      },
      updatedAt: new Date(Math.min(now, new Date(timeIso).getTime() + 180000)).toISOString(),
      stale,
    }
  })
}

async function buildLayerResponse(type: EnvLayerType, timeIso: string, bounds?: ViewportBounds) {
  const jitter = getTimeJitter(timeIso)
  const stale = (Date.now() - new Date(timeIso).getTime()) > (30 * 60 * 1000)
  const stormCells = buildStormCells(timeIso, bounds)

  if (type === 'wind') {
    const realWindPoints = await buildRealWindField(bounds, timeIso)
    if (realWindPoints.length > 0) {
      return {
        layer: {
          type,
          time: timeIso,
          renderMode: 'vector',
          vectorPoints: realWindPoints,
          units: 'kt',
          legend: [
            { label: 'Jet stream', color: '#22c55e', value: 45 },
            { label: 'Upper flow', color: '#86efac', value: 30 },
            { label: 'Background', color: '#bbf7d0', value: 15 },
          ],
          stale,
        },
      }
    }
  }

  if (type === 'cloudCoverage' || type === 'stormCloudCoverage') {
    const liveTile = await fetchRainViewerSatelliteTile(timeIso, type === 'stormCloudCoverage' ? 'storm' : 'cloud')
    const cloudFeedTime = liveTile?.sampledTimeIso ?? timeIso
    const fallbackCloudPoints = buildCoherentCloudField(bounds, cloudFeedTime, type, stormCells)
    const cloudLegend = type === 'cloudCoverage'
      ? [
        { label: 'Low cloud', color: '#edf4ff', value: 25 },
        { label: 'Cloud deck', color: '#dce9ff', value: 55 },
        { label: 'Dense cloud', color: '#c3dcff', value: 80 },
      ]
      : [
        { label: 'Outer shield', color: '#e4ecff', value: 35 },
        { label: 'Convective band', color: '#c8dcff', value: 62 },
        { label: 'Core overcast', color: '#adcfff', value: 85 },
      ]

    return {
      layer: {
        type,
          time: cloudFeedTime,
        renderMode: 'vector',
        vectorPoints: fallbackCloudPoints,
        units: '%',
        legend: cloudLegend,
          stale: liveTile ? liveTile.stale : stale,
      },
    }
  }

  const anchorPoints: Array<[number, number]> = [
    [47.61, -122.33], [37.77, -122.42], [34.05, -118.24], [39.74, -104.99],
    [41.88, -87.63], [32.78, -96.8], [29.76, -95.37], [33.75, -84.39],
    [40.71, -74.0], [42.36, -71.06], [25.76, -80.19], [45.52, -73.57],
    [19.43, -99.13], [14.63, -90.55], [-23.55, -46.63], [-34.6, -58.38],
    [51.51, -0.13], [48.86, 2.35], [52.52, 13.4], [41.9, 12.5],
    [59.33, 18.07], [40.42, -3.7], [31.23, 121.47], [35.68, 139.69],
    [37.57, 126.98], [1.35, 103.82], [13.75, 100.5], [19.08, 72.88],
    [25.2, 55.27], [30.04, 31.24], [-1.29, 36.82], [-26.2, 28.04],
    [6.52, 3.38], [-33.87, 151.21], [-36.85, 174.76], [21.31, -157.86],
  ]

  const vectorPoints = type === 'hurricaneRainRadar' || type === 'lightningTracking'
    ? (() => {
      const sourceStorms = type === 'hurricaneRainRadar'
        ? stormCells.filter((storm) => storm.type === 'hurricane')
        : stormCells

      if (type === 'lightningTracking') {
        return sourceStorms.flatMap((storm, stormIndex) => {
          const strikeCount = storm.type === 'hurricane' ? 6 : storm.intensity.category === 'severe' ? 5 : 3
          const [cLat, cLng] = storm.centroid

          return Array.from({ length: strikeCount }).map((_, strikeIndex) => {
            const heading = ((strikeIndex / strikeCount) * Math.PI * 2) + ((jitter + (stormIndex * 77)) / 930)
            const radius = 0.15 + (strikeIndex * 0.08) + (storm.type === 'hurricane' ? 0.08 : 0)
            const ageMinutes = (Math.abs(jitter + (stormIndex * 13) + (strikeIndex * 29)) % 16) + 1

            return {
              lat: Number((cLat + (Math.cos(heading) * radius)).toFixed(4)),
              lng: Number((cLng + (Math.sin(heading) * radius)).toFixed(4)),
              value: Number(ageMinutes.toFixed(2)),
              directionDeg: undefined,
            }
          })
        })
      }

      return sourceStorms.flatMap((storm, stormIndex) => {
        const [cLat, cLng] = storm.centroid
        const ringCount = type === 'hurricaneRainRadar' ? 10 : 8
        const ringPoints = Array.from({ length: ringCount }).map((_, ringIndex) => {
          const angle = ((ringIndex / ringCount) * Math.PI * 2) + ((jitter + (stormIndex * 55)) / 880)
          const stormScale = storm.type === 'hurricane' ? 1.32 : 1
          const baseRadius = type === 'hurricaneRainRadar' ? 0.48 : 0.76
          const radius = (baseRadius + ((ringIndex % 3) * 0.08)) * stormScale

          const lat = cLat + (Math.cos(angle) * radius)
          const lng = cLng + (Math.sin(angle) * radius)
          const cloudValue = clamp(
            storm.intensity.dbz + 18 - (ringIndex * 3) + (storm.type === 'hurricane' ? 12 : 0),
            20,
            100,
          )
          const rainValue = clamp(
            (storm.intensity.dbz * 0.72) + (storm.hurricaneCategory ?? 1) * 3 - ringIndex,
            8,
            70,
          )

          return {
            lat: Number(lat.toFixed(4)),
            lng: Number(lng.toFixed(4)),
            value: Number((type === 'hurricaneRainRadar' ? rainValue : cloudValue).toFixed(2)),
            directionDeg: type === 'hurricaneRainRadar'
              ? (storm.movement.directionDeg + (ringIndex * 16)) % 360
              : undefined,
          }
        })

        return [
          {
            lat: Number(cLat.toFixed(4)),
            lng: Number(cLng.toFixed(4)),
            value: Number((type === 'hurricaneRainRadar'
              ? clamp((storm.intensity.dbz * 0.86) + (storm.hurricaneCategory ?? 1) * 4, 12, 85)
              : clamp(storm.intensity.dbz + (storm.type === 'hurricane' ? 18 : 12), 30, 100)).toFixed(2)),
            directionDeg: type === 'hurricaneRainRadar' ? storm.movement.directionDeg : undefined,
          },
          ...ringPoints,
        ]
      })
    })()
    : bounds
    ? (() => {
      const latSpan = Math.max(1.2, bounds.north - bounds.south)
      const lngSpan = Math.max(1.6, bounds.east - bounds.west)
      const rows = 6
      const cols = 8

      return Array.from({ length: rows * cols }).map((_, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        const latRatio = (row + 0.5) / rows
        const lngRatio = (col + 0.5) / cols

        const latBase = bounds.south + (latSpan * latRatio)
        const lngBase = bounds.west + (lngSpan * lngRatio)
        const lat = clamp(latBase + (Math.sin((jitter / 540) + index) * latSpan * 0.03), bounds.south, bounds.north)
        const lng = clamp(lngBase + (Math.cos((jitter / 460) + (index * 0.7)) * lngSpan * 0.035), bounds.west, bounds.east)

        const value = type === 'pressure'
          ? 992 + ((index * 2.4) % 28)
          : type === 'wind'
            ? 12 + ((index * 3.8) % 58)
            : type === 'smoke'
              ? 10 + ((index * 4.6) % 85)
              : 1 + ((index * 2.9) % 55)

        return {
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
          value: Number(value.toFixed(2)),
          directionDeg: type === 'wind' ? ((index * 19) + (jitter % 210)) % 360 : undefined,
        }
      })
    })()
    : anchorPoints.map(([baseLat, baseLng], index) => {
      const lat = baseLat + (Math.sin((jitter / 560) + index) * 0.9)
      const lng = baseLng + (Math.cos((jitter / 430) + (index * 0.7)) * 1.1)
      const value = type === 'pressure'
        ? 992 + ((index * 2.4) % 28)
        : type === 'wind'
          ? 12 + ((index * 3.8) % 58)
          : type === 'smoke'
            ? 10 + ((index * 4.6) % 85)
            : 1 + ((index * 2.9) % 55)

      return {
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        value: Number(value.toFixed(2)),
        directionDeg: type === 'wind' ? ((index * 19) + (jitter % 210)) % 360 : undefined,
      }
    })

  const legend = type === 'precipitation'
    ? [
      { label: 'Light', color: '#60a5fa', value: 5 },
      { label: 'Moderate', color: '#2563eb', value: 20 },
      { label: 'Heavy', color: '#1d4ed8', value: 40 },
    ]
    : type === 'wind'
      ? [
        { label: 'Breeze', color: '#86efac', value: 10 },
        { label: 'Windy', color: '#22c55e', value: 25 },
        { label: 'Strong', color: '#15803d', value: 45 },
      ]
      : type === 'pressure'
        ? [
          { label: 'Low', color: '#fcd34d', value: 995 },
          { label: 'Mid', color: '#f59e0b', value: 1007 },
          { label: 'High', color: '#d97706', value: 1019 },
        ]
        : type === 'hurricaneRainRadar'
          ? [
            { label: 'Outer Low Bands', color: '#d1d5db', value: 15 },
            { label: 'Middle Swirl Bands', color: '#4b5563', value: 35 },
            { label: 'Funnel Rain Core', color: '#0284c7', value: 55 },
          ]
          : type === 'lightningTracking'
            ? [
              { label: '1-5 min', color: '#fde047', value: 5 },
              { label: '6-10 min', color: '#facc15', value: 10 },
              { label: '11-16 min', color: '#eab308', value: 16 },
            ]
        : [
          { label: 'Trace', color: '#d8b4fe', value: 15 },
          { label: 'Elevated', color: '#c084fc', value: 35 },
          { label: 'Dense', color: '#a855f7', value: 60 },
        ]

  return {
    layer: {
      type,
      time: timeIso,
      renderMode: 'vector',
      vectorPoints,
      units: type === 'pressure'
        ? 'hPa'
        : type === 'wind'
          ? 'kt'
          : type === 'smoke'
            ? 'AQI'
              : type === 'lightningTracking'
                ? 'min ago'
                : 'mm/hr',
      legend,
      stale,
    },
  }
}

weatherRouter.get('/radar/frames', async (c) => {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - (2 * 60 * 60 * 1000)).toISOString();
  const defaultTo = now.toISOString();

  const from = c.req.query('from') ?? defaultFrom;
  const to = c.req.query('to') ?? defaultTo;
  const stepMinutes = parseStepMinutes(c.req.query('stepMinutes'));
  const liveFrames = await fetchRainViewerFrames(from, to);

  return c.json({
    frames: liveFrames ?? buildRadarFrames(from, to, stepMinutes),
  });
});

weatherRouter.get('/storms', (c) => {
  const time = c.req.query('time') ?? new Date().toISOString();
  const bounds = parseBbox(c.req.query('bbox'))
  return c.json({
    time,
    cells: buildStormCells(time, bounds),
  });
});

weatherRouter.get('/layers', async (c) => {
  const rawType = c.req.query('type') ?? 'precipitation';
  const time = c.req.query('time') ?? new Date().toISOString();
  const bounds = parseBbox(c.req.query('bbox'))
  const type: EnvLayerType = rawType === 'wind'
    || rawType === 'pressure'
    || rawType === 'smoke'
    || rawType === 'cloudCoverage'
    || rawType === 'stormCloudCoverage'
    || rawType === 'hurricaneRainRadar'
    || rawType === 'lightningTracking'
    ? rawType
    : 'precipitation'

  return c.json(await buildLayerResponse(type, time, bounds));
});

export default weatherRouter;
