import type { AnyCircuitElement, PcbBoard, PcbPanel } from "circuit-json"

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function isPcbBoard(el: AnyCircuitElement): el is PcbBoard {
  return el.type === "pcb_board"
}

export function isPcbPanel(el: AnyCircuitElement): el is PcbPanel {
  return el.type === "pcb_panel"
}

export function getBoundsFromElement(element: {
  center: { x: number; y: number }
  width: number
  height: number
}): Bounds {
  const halfWidth = element.width / 2
  const halfHeight = element.height / 2
  return {
    minX: element.center.x - halfWidth,
    maxX: element.center.x + halfWidth,
    minY: element.center.y - halfHeight,
    maxY: element.center.y + halfHeight,
  }
}

export function isPointInsideBounds(
  x: number,
  y: number,
  bounds: Bounds,
): boolean {
  return (
    x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
  )
}

export function isPointInsideAnyBounds(
  x: number,
  y: number,
  boundsArray: Bounds[],
): boolean {
  for (const bounds of boundsArray) {
    if (isPointInsideBounds(x, y, bounds)) {
      return true
    }
  }
  return false
}
