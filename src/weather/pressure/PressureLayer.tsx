import type { PressureModel } from './types'

type PressureLayerProps = {
  model: PressureModel
}

// Placeholder declarative component for future SVG/canvas pressure rendering.
// Current production map rendering is driven by Leaflet imperative drawing.
export function PressureLayer({ model }: PressureLayerProps) {
  return (
    <div className="hidden" data-pressure-contours={model.contours.length} data-pressure-fronts={model.fronts.length} />
  )
}
