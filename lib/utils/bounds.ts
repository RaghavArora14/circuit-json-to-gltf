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

export function getCircuitJsonTextureBounds(
  circuitJson: AnyCircuitElement[],
): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const boards = circuitJson.filter(isPcbBoard)

  if (boards.length > 0) {
    for (const board of boards) {
      if (board.center && board.width && board.height) {
        const bounds = getBoundsFromElement({
          center: board.center,
          width: board.width,
          height: board.height,
        })
        minX = Math.min(minX, bounds.minX)
        minY = Math.min(minY, bounds.minY)
        maxX = Math.max(maxX, bounds.maxX)
        maxY = Math.max(maxY, bounds.maxY)
      }
    }
  }

  if (!Number.isFinite(minX)) {
    const panel = circuitJson.find(isPcbPanel)
    if (panel && panel.center && panel.width && panel.height) {
      const bounds = getBoundsFromElement(panel)
      minX = bounds.minX
      minY = bounds.minY
      maxX = bounds.maxX
      maxY = bounds.maxY
    }
  }

  if (!Number.isFinite(minX)) {
    return { minX: -10, maxX: 10, minY: -10, maxY: 10 }
  }

  return { minX, maxX, minY, maxY }
}

export function getIndividualBoardBounds(
  circuitJson: AnyCircuitElement[],
): Bounds[] {
  const boards = circuitJson.filter(isPcbBoard)
  const bounds: Bounds[] = []

  for (const board of boards) {
    if (board.center && board.width && board.height) {
      bounds.push(
        getBoundsFromElement({
          center: board.center,
          width: board.width,
          height: board.height,
        }),
      )
    }
  }

  return bounds
}

export interface Triangle {
  vertices: [
    { x: number; y: number; z: number },
    { x: number; y: number; z: number },
    { x: number; y: number; z: number },
  ]
  normal: { x: number; y: number; z: number }
}

export interface BoxCenter {
  x: number
  z: number
}

export function getTriangleCenterPcbCoords(
  triangle: Triangle,
  boxCenter: BoxCenter,
): { pcbX: number; pcbY: number } {
  const centerX =
    (triangle.vertices[0].x + triangle.vertices[1].x + triangle.vertices[2].x) /
    3
  const centerZ =
    (triangle.vertices[0].z + triangle.vertices[1].z + triangle.vertices[2].z) /
    3

  return {
    pcbX: centerX + boxCenter.x,
    pcbY: -centerZ + boxCenter.z,
  }
}

export function isTriangleInsideAnyBoardBounds(
  triangle: Triangle,
  boxCenter: BoxCenter,
  boardBounds: Bounds[],
): boolean {
  const { pcbX, pcbY } = getTriangleCenterPcbCoords(triangle, boxCenter)
  return isPointInsideAnyBounds(pcbX, pcbY, boardBounds)
}
