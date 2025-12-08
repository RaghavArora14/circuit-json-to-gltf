import type { AnyCircuitElement, PcbBoard, PcbPanel } from "circuit-json"
import type { Bounds } from "@tscircuit/math-utils"

/**
 * Get the bounds for texture mapping.
 * Computes bounds from all pcb_board and pcb_panel elements.
 * Returns board bounds for texture mapping (texture only covers board area).
 */
export function getTextureBoundsFromCircuitJson(
  circuitJson: AnyCircuitElement[],
): Bounds {
  let boardMinX = Infinity
  let boardMinY = Infinity
  let boardMaxX = -Infinity
  let boardMaxY = -Infinity
  let hasBoardBounds = false

  let panelMinX = Infinity
  let panelMinY = Infinity
  let panelMaxX = -Infinity
  let panelMaxY = -Infinity
  let hasPanelBounds = false

  // Process all elements to determine bounds
  for (const el of circuitJson) {
    if (el.type === "pcb_panel") {
      const panel = el as PcbPanel
      if (panel.center && panel.width && panel.height) {
        const halfWidth = panel.width / 2
        const halfHeight = panel.height / 2
        panelMinX = Math.min(panelMinX, panel.center.x - halfWidth)
        panelMinY = Math.min(panelMinY, panel.center.y - halfHeight)
        panelMaxX = Math.max(panelMaxX, panel.center.x + halfWidth)
        panelMaxY = Math.max(panelMaxY, panel.center.y + halfHeight)
        hasPanelBounds = true
      }
    } else if (el.type === "pcb_board") {
      const board = el as PcbBoard
      if (board.center && board.width && board.height) {
        const halfWidth = board.width / 2
        const halfHeight = board.height / 2
        boardMinX = Math.min(boardMinX, board.center.x - halfWidth)
        boardMinY = Math.min(boardMinY, board.center.y - halfHeight)
        boardMaxX = Math.max(boardMaxX, board.center.x + halfWidth)
        boardMaxY = Math.max(boardMaxY, board.center.y + halfHeight)
        hasBoardBounds = true
      }
    }
  }

  // Use board bounds for texture mapping (texture rendered with useOnlyBoardBounds: true)
  if (hasBoardBounds && Number.isFinite(boardMinX)) {
    return {
      minX: boardMinX,
      maxX: boardMaxX,
      minY: boardMinY,
      maxY: boardMaxY,
    }
  }

  // Fallback to panel bounds if no boards exist
  if (hasPanelBounds && Number.isFinite(panelMinX)) {
    return {
      minX: panelMinX,
      maxX: panelMaxX,
      minY: panelMinY,
      maxY: panelMaxY,
    }
  }

  throw new Error("No pcb_board or pcb_panel found in circuit json")
}
