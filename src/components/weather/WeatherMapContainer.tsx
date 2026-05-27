import { useEffect, useRef, useState } from 'react'
import type { CircleMarker, LayerGroup, Map as LeafletMap, Polyline, Polygon, TileLayer, Tooltip } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/weather.css'
import type { WeatherEnvLayerType, WeatherLayerData, WeatherMapView, WeatherRadarFrame, WeatherStormCell } from '@/modules/weather/types'
import { RadarLayer } from './RadarLayer'

function findNearestPoint(
  points: Array<{ lat: number; lng: number; value: number }>,
  lat: number,
  lng: number,
): { lat: number; lng: number; value: number } | undefined {
  let nearest: { lat: number; lng: number; value: number } | undefined
  let bestScore = Number.POSITIVE_INFINITY

  points.forEach((point) => {
    const dLat = point.lat - lat
    const dLng = point.lng - lng
    const score = (dLat * dLat) + (dLng * dLng)
    if (score < bestScore) {
      bestScore = score
      nearest = point
    }
  })

  return nearest
}

type LeafletModule = typeof import('leaflet')

type WeatherMapContainerProps = {
  mapView: WeatherMapView
  frame?: WeatherRadarFrame
  stormCells: WeatherStormCell[]
  selectedStormId?: string
  envLayers: Partial<Record<WeatherEnvLayerType, WeatherLayerData>>
  stormsVisible: boolean
  envVisibility: Record<WeatherEnvLayerType, boolean>
  envOpacity: Record<WeatherEnvLayerType, number>
  radarVisible: boolean
  radarOpacity: number
  loading?: boolean
  noDataMessage?: string | null
  onStormSelect: (stormId: string) => void
  onMapViewChange: (
    center: [number, number],
    zoom: number,
    bounds: { west: number; south: number; east: number; north: number },
  ) => void
}

export function WeatherMapContainer({
  mapView,
  frame,
  stormCells,
  selectedStormId,
  envLayers,
  stormsVisible,
  envVisibility,
  envOpacity,
  radarVisible,
  radarOpacity,
  loading = false,
  noDataMessage,
  onStormSelect,
  onMapViewChange,
}: WeatherMapContainerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const baseLayerRef = useRef<TileLayer | null>(null)
  const radarLayerRef = useRef<TileLayer | null>(null)
  const stormLayerRef = useRef<LayerGroup | null>(null)
  const envLayerRefs = useRef<Partial<Record<WeatherEnvLayerType, LayerGroup>>>({})
  const leafletRef = useRef<LeafletModule | null>(null)
  const hoverTimerRef = useRef<number | null>(null)
  const envProbeTooltipRef = useRef<Tooltip | null>(null)
  const stormHoverTimerRef = useRef<number | null>(null)
  const stormPrecipTooltipRef = useRef<Tooltip | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let disposed = false

    const mount = async () => {
      if (!rootRef.current) return

      const leaflet = await import('leaflet')
      if (disposed || !rootRef.current) return

      leafletRef.current = leaflet
      const map = leaflet.map(rootRef.current, {
        zoomControl: true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 12,
      }).setView(mapView.center, mapView.zoom)

      map.createPane('weatherRadarPane')
      map.getPane('weatherRadarPane')!.style.zIndex = '420'
      map.createPane('weatherEnvPane')
      map.getPane('weatherEnvPane')!.style.zIndex = '460'
      map.createPane('weatherStormPane')
      map.getPane('weatherStormPane')!.style.zIndex = '470'

      const baseProviders = [
        {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          options: { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' },
        },
        {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          options: { maxZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO' },
        },
      ] as const

      let providerIndex = 0
      let providerErrors = 0

      const mountBaseLayer = () => {
        const provider = baseProviders[Math.min(providerIndex, baseProviders.length - 1)]
        baseLayerRef.current?.remove()
        const layer = leaflet.tileLayer(provider.url, {
          ...provider.options,
          crossOrigin: true,
        }).addTo(map)

        layer.on('tileerror', () => {
          providerErrors += 1
          if (providerErrors < 6) return

          if (providerIndex < baseProviders.length - 1) {
            providerIndex += 1
            providerErrors = 0
            mountBaseLayer()
          }
        })

        baseLayerRef.current = layer
      }

      mountBaseLayer()

      stormLayerRef.current = leaflet.layerGroup().addTo(map)
      envLayerRefs.current = {
        precipitation: leaflet.layerGroup().addTo(map),
        wind: leaflet.layerGroup().addTo(map),
        pressure: leaflet.layerGroup().addTo(map),
        smoke: leaflet.layerGroup().addTo(map),
      }

      map.on('moveend', () => {
        const center = map.getCenter()
        const bounds = map.getBounds()
        onMapViewChange(
          [Number(center.lat.toFixed(4)), Number(center.lng.toFixed(4))],
          map.getZoom(),
          {
            west: Number(bounds.getWest().toFixed(4)),
            south: Number(bounds.getSouth().toFixed(4)),
            east: Number(bounds.getEast().toFixed(4)),
            north: Number(bounds.getNorth().toFixed(4)),
          },
        )
      })

      const forceSize = () => map.invalidateSize({ pan: false, animate: false })
      const observer = new ResizeObserver(() => forceSize())
      observer.observe(rootRef.current)

      requestAnimationFrame(() => {
        forceSize()
        requestAnimationFrame(() => forceSize())
      })

      mapRef.current = map
      setMapReady(true)

      ;(map as LeafletMap & { __weatherResizeObserver?: ResizeObserver }).__weatherResizeObserver = observer
    }

    void mount()

    return () => {
      disposed = true
      baseLayerRef.current?.remove()
      baseLayerRef.current = null
      radarLayerRef.current?.remove()
      radarLayerRef.current = null
      stormLayerRef.current?.remove()
      stormLayerRef.current = null
      Object.values(envLayerRefs.current).forEach((layer) => layer?.remove())
      envLayerRefs.current = {}
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (stormHoverTimerRef.current) {
        window.clearTimeout(stormHoverTimerRef.current)
        stormHoverTimerRef.current = null
      }
      envProbeTooltipRef.current?.remove()
      envProbeTooltipRef.current = null
      stormPrecipTooltipRef.current?.remove()
      stormPrecipTooltipRef.current = null
      const map = mapRef.current as (LeafletMap & { __weatherResizeObserver?: ResizeObserver }) | null
      map?.__weatherResizeObserver?.disconnect()
      map?.remove()
      mapRef.current = null
      leafletRef.current = null
      setMapReady(false)
    }
  }, [onMapViewChange])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const center = map.getCenter()
    const centerChanged = Math.abs(center.lat - mapView.center[0]) > 0.0001 || Math.abs(center.lng - mapView.center[1]) > 0.0001
    const zoomChanged = map.getZoom() !== mapView.zoom

    if (centerChanged || zoomChanged) {
      map.setView(mapView.center, mapView.zoom, { animate: false })
    }
  }, [mapView])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!map || !leaflet) return

    radarLayerRef.current?.remove()
    radarLayerRef.current = null

    if (!radarVisible || !frame) return

    radarLayerRef.current = leaflet.tileLayer(frame.tileUrlTemplate, {
      opacity: radarOpacity,
      className: 'weather-radar-tile',
      attribution: frame.attribution ?? 'Weather radar',
      zIndex: 450,
      pane: 'weatherRadarPane',
      maxNativeZoom: 6,
      minNativeZoom: 0,
      updateWhenZooming: false,
      crossOrigin: true,
      errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    }).addTo(map)
  }, [frame, mapReady, radarOpacity, radarVisible])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    const leaflet = leafletRef.current
    const stormLayer = stormLayerRef.current
    if (!map || !leaflet || !stormLayer) return

    const precipitationPoints = envLayers.precipitation?.vectorPoints ?? []

    const clearStormPrecipProbe = () => {
      if (stormHoverTimerRef.current) {
        window.clearTimeout(stormHoverTimerRef.current)
        stormHoverTimerRef.current = null
      }
      stormPrecipTooltipRef.current?.remove()
      stormPrecipTooltipRef.current = null
    }

    stormLayer.clearLayers()
    if (!stormsVisible) return

    const polygons: Polygon[] = []
    const arrows: Polyline[] = []
    const centroids: CircleMarker[] = []

    stormCells.forEach((storm) => {
      const polygonColor = storm.type === 'hurricane'
        ? '#fb7185'
        : storm.intensity.category === 'severe'
          ? '#ef4444'
          : storm.intensity.category === 'moderate'
            ? '#f59e0b'
            : '#22d3ee'
      const isSelected = selectedStormId === storm.id

      const polygon = leaflet.polygon(storm.polygon, {
        color: polygonColor,
        fillColor: polygonColor,
        fillOpacity: isSelected ? 0.56 : 0.4,
        opacity: isSelected ? 1 : 0.95,
        weight: isSelected ? 4.1 : 3,
        dashArray: storm.type === 'hurricane' ? '8 6' : undefined,
        pane: 'weatherStormPane',
        className: 'weather-storm-polygon',
      }).addTo(stormLayer)

      const label = storm.type === 'hurricane'
        ? `${storm.name} · Cat ${storm.hurricaneCategory ?? '?'} · ${storm.intensity.dbz} dBZ`
        : `${storm.name} · ${storm.intensity.dbz} dBZ`
      polygon.bindTooltip(label, { direction: 'top', opacity: 0.92 })
      polygon.on('click', () => onStormSelect(storm.id))
      polygon.on('mouseover', (event: { latlng?: { lat: number; lng: number } }) => {
        clearStormPrecipProbe()
        if (!envVisibility.precipitation || precipitationPoints.length === 0 || !event.latlng) return

        const { lat, lng } = event.latlng
        stormHoverTimerRef.current = window.setTimeout(() => {
          const nearest = findNearestPoint(precipitationPoints, lat, lng)
          if (!nearest) return

          stormPrecipTooltipRef.current = leaflet.tooltip({
            direction: 'top',
            offset: [0, -12],
            opacity: 0.95,
            className: 'weather-smoke-cursor-tooltip',
            pane: 'tooltipPane',
          })

          stormPrecipTooltipRef.current
            .setLatLng([lat, lng])
            .setContent(`Precipitation ${nearest.value.toFixed(1)} mm/hr`)
            .addTo(map)
        }, 2000)
      })
      polygon.on('mouseout', clearStormPrecipProbe)
      polygons.push(polygon)

      const centroid = leaflet.circleMarker(storm.centroid, {
        radius: isSelected ? 8.2 : 6.4,
        color: '#f8fafc',
        fillColor: polygonColor,
        fillOpacity: 1,
        opacity: 1,
        weight: storm.type === 'hurricane' ? 2.4 : 1.8,
        pane: 'weatherStormPane',
      }).addTo(stormLayer)
      centroid.on('click', () => onStormSelect(storm.id))
      centroid.on('mouseover', () => {
        clearStormPrecipProbe()
        if (!envVisibility.precipitation || precipitationPoints.length === 0) return

        const lat = storm.centroid[0]
        const lng = storm.centroid[1]
        stormHoverTimerRef.current = window.setTimeout(() => {
          const nearest = findNearestPoint(precipitationPoints, lat, lng)
          if (!nearest) return

          stormPrecipTooltipRef.current = leaflet.tooltip({
            direction: 'top',
            offset: [0, -12],
            opacity: 0.95,
            className: 'weather-smoke-cursor-tooltip',
            pane: 'tooltipPane',
          })

          stormPrecipTooltipRef.current
            .setLatLng([lat, lng])
            .setContent(`Precipitation ${nearest.value.toFixed(1)} mm/hr`)
            .addTo(map)
        }, 2000)
      })
      centroid.on('mouseout', clearStormPrecipProbe)
      centroids.push(centroid)

      const distance = 0.95
      const heading = (storm.movement.directionDeg * Math.PI) / 180
      const arrowLat = storm.centroid[0] + (Math.cos(heading) * distance)
      const arrowLng = storm.centroid[1] + (Math.sin(heading) * distance)
      const arrow = leaflet.polyline([storm.centroid, [arrowLat, arrowLng]], {
        color: storm.type === 'hurricane' ? '#fda4af' : '#f8fafc',
        opacity: 0.98,
        weight: isSelected ? 3.6 : 3,
        pane: 'weatherStormPane',
        className: 'weather-storm-vector',
      }).addTo(stormLayer)
      arrows.push(arrow)
    })

    return () => {
      clearStormPrecipProbe()
    }
  }, [envLayers.precipitation?.vectorPoints, envVisibility.precipitation, mapReady, onStormSelect, selectedStormId, stormCells, stormsVisible])

  useEffect(() => {
    if (!mapReady) return
    const leaflet = leafletRef.current
    const layers = envLayerRefs.current
    if (!leaflet) return

    const envTypes: WeatherEnvLayerType[] = ['precipitation', 'wind', 'pressure', 'smoke']
    envTypes.forEach((type) => {
      const targetLayer = layers[type]
      if (!targetLayer) return

      targetLayer.clearLayers()
      if (!envVisibility[type]) return

      if (type === 'smoke' || type === 'pressure' || type === 'precipitation') {
        // Smoke, pressure, and precipitation are shown via hover probes instead of full-screen overlays.
        return
      }

      const data = envLayers[type]
      if (!data || !Array.isArray(data.vectorPoints)) return

      data.vectorPoints.forEach((point, index) => {
        const color = '#22c55e'

        if (type === 'wind' && typeof point.directionDeg === 'number') {
          const windStride = mapView.zoom >= 11
            ? 7
            : mapView.zoom >= 10
              ? 5
            : mapView.zoom >= 8
              ? 3
              : mapView.zoom >= 6
                ? 2
                : 1

          if (index % windStride !== 0) return

          const heading = (point.directionDeg * Math.PI) / 180
          const lineLength = mapView.zoom >= 11
            ? 0.14
            : mapView.zoom >= 10
              ? 0.22
            : mapView.zoom >= 8
              ? 0.5
              : mapView.zoom >= 6
                ? 0.7
                : 0.9
          const startLat = point.lat - (Math.cos(heading) * lineLength * 0.48)
          const startLng = point.lng - (Math.sin(heading) * lineLength * 0.48)
          const endLat = point.lat + (Math.cos(heading) * lineLength * 0.52)
          const endLng = point.lng + (Math.sin(heading) * lineLength * 0.52)

          const line = leaflet.polyline([[startLat, startLng], [endLat, endLng]], {
            color,
            opacity: mapView.zoom >= 11
              ? 0.2 + (envOpacity.wind * 0.16)
              : 0.38 + (envOpacity.wind * 0.22),
            weight: mapView.zoom >= 11 ? 1.05 : mapView.zoom >= 9 ? 1.4 : 2,
            pane: 'weatherEnvPane',
            className: 'weather-wind-line',
          }).addTo(targetLayer)

          const arrowSize = mapView.zoom >= 11 ? 0.06 : mapView.zoom >= 10 ? 0.08 : mapView.zoom >= 8 ? 0.14 : 0.18
          const wingAngle = Math.PI / 6
          const leftLat = endLat - (Math.cos(heading - wingAngle) * arrowSize)
          const leftLng = endLng - (Math.sin(heading - wingAngle) * arrowSize)
          const rightLat = endLat - (Math.cos(heading + wingAngle) * arrowSize)
          const rightLng = endLng - (Math.sin(heading + wingAngle) * arrowSize)

          leaflet.polyline([[endLat, endLng], [leftLat, leftLng]], {
            color,
            opacity: mapView.zoom >= 11
              ? 0.22 + (envOpacity.wind * 0.14)
              : 0.4 + (envOpacity.wind * 0.24),
            weight: mapView.zoom >= 11 ? 0.9 : mapView.zoom >= 9 ? 1.2 : 1.7,
            pane: 'weatherEnvPane',
            className: 'weather-wind-arrowhead',
          }).addTo(targetLayer)

          leaflet.polyline([[endLat, endLng], [rightLat, rightLng]], {
            color,
            opacity: mapView.zoom >= 11
              ? 0.22 + (envOpacity.wind * 0.14)
              : 0.4 + (envOpacity.wind * 0.24),
            weight: mapView.zoom >= 11 ? 0.9 : mapView.zoom >= 9 ? 1.2 : 1.7,
            pane: 'weatherEnvPane',
            className: 'weather-wind-arrowhead',
          }).addTo(targetLayer)

          line.bindTooltip(`wind: ${point.value}${data.units ? ` ${data.units}` : ''}`, {
            direction: 'top',
            opacity: 0.92,
          })
          return
        }

        const normalized = type === 'wind'
            ? Math.max(0, Math.min(1, point.value / 70))
            : Math.max(0, Math.min(1, point.value / 55))

        const radius = type === 'wind'
          ? 4.5 + (normalized * 5.2)
          : 5.6 + (normalized * 6.2)

        const marker = leaflet.circleMarker([point.lat, point.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.42 + (envOpacity[type] * 0.55),
          opacity: 0.58 + (envOpacity[type] * 0.42),
          weight: 1.8,
          pane: 'weatherEnvPane',
          className: 'weather-env-point',
        }).addTo(targetLayer)

        marker.bindTooltip(`${type}: ${point.value}${data.units ? ` ${data.units}` : ''}`, {
          direction: 'top',
          opacity: 0.92,
        })

      })
    })
  }, [envLayers, envOpacity, envVisibility, mapReady, mapView.zoom])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!map || !leaflet) return

    const smokePoints = envLayers.smoke?.vectorPoints ?? []
    const pressurePoints = envLayers.pressure?.vectorPoints ?? []

    const clearHoverProbe = () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      envProbeTooltipRef.current?.remove()
      envProbeTooltipRef.current = null
    }

    const onMouseMove = (event: { latlng: { lat: number; lng: number } }) => {
      clearHoverProbe()

      const smokeEnabled = envVisibility.smoke && smokePoints.length > 0
      const pressureEnabled = envVisibility.pressure && pressurePoints.length > 0
      if (!smokeEnabled && !pressureEnabled) return

      const lat = event.latlng.lat
      const lng = event.latlng.lng

      hoverTimerRef.current = window.setTimeout(() => {
        const nearestSmoke = smokeEnabled ? findNearestPoint(smokePoints, lat, lng) : undefined
        const nearestPressure = pressureEnabled ? findNearestPoint(pressurePoints, lat, lng) : undefined
        if (!nearestSmoke && !nearestPressure) return

        const lines: string[] = []
        if (nearestSmoke) lines.push(`AQI ${Math.round(nearestSmoke.value)}`)
        if (nearestPressure) lines.push(`Pressure ${Math.round(nearestPressure.value)} hPa`)

        envProbeTooltipRef.current = leaflet.tooltip({
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95,
          className: 'weather-smoke-cursor-tooltip',
          pane: 'tooltipPane',
        })

        envProbeTooltipRef.current
          .setLatLng([lat, lng])
          .setContent(lines.join('<br/>'))
          .addTo(map)
      }, 2000)
    }

    map.on('mousemove', onMouseMove)
    map.on('mouseout', clearHoverProbe)
    map.on('mousedown', clearHoverProbe)
    map.on('zoomstart', clearHoverProbe)
    map.on('movestart', clearHoverProbe)

    return () => {
      map.off('mousemove', onMouseMove)
      map.off('mouseout', clearHoverProbe)
      map.off('mousedown', clearHoverProbe)
      map.off('zoomstart', clearHoverProbe)
      map.off('movestart', clearHoverProbe)
      clearHoverProbe()
    }
  }, [envLayers.pressure?.vectorPoints, envLayers.smoke?.vectorPoints, envVisibility.pressure, envVisibility.smoke, mapReady])

  return (
    <div className="weather-map-surface">
      <div ref={rootRef} className="weather-map-canvas" />
      {loading ? <div className="weather-map-loading">Loading weather layers...</div> : null}
      {noDataMessage ? <div className="weather-map-empty" data-testid="weather-map-empty">{noDataMessage}</div> : null}
      <RadarLayer frame={frame} visible={radarVisible} opacity={radarOpacity} />
    </div>
  )
}
