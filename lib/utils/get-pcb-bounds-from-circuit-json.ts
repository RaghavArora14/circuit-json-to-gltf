import type { AnyCircuitElement, PcbBoard, PcbPanel } from "circuit-json"
import type { Bounds } from "@tscircuit/math-utils"

/**
 * Get the combined bounds of all pcb_board elements in the circuit.
 * This matches what circuit-to-svg uses for rendering the texture.
 * Falls back to pcb_panel bounds if no boards exist.
 */
export function getPcbBoundsFromCircuitJson(
  circuitJson: AnyCircuitElement[],
): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of circuitJson) {
    if (el.type === "pcb_board") {
      const board = el as PcbBoard
      if (board.center && board.width && board.height) {
        const halfWidth = board.width / 2
        const halfHeight = board.height / 2
        minX = Math.min(minX, board.center.x - halfWidth)
        minY = Math.min(minY, board.center.y - halfHeight)
        maxX = Math.max(maxX, board.center.x + halfWidth)
        maxY = Math.max(maxY, board.center.y + halfHeight)
      }
    }
  }

  // Fallback to pcb_panel if no boards found
  if (minX === Infinity) {
    for (const el of circuitJson) {
      if (el.type === "pcb_panel") {
        const panel = el as PcbPanel
        if (panel.center && panel.width && panel.height) {
          const halfWidth = panel.width / 2
          const halfHeight = panel.height / 2
          minX = panel.center.x - halfWidth
          maxX = panel.center.x + halfWidth
          minY = panel.center.y - halfHeight
          maxY = panel.center.y + halfHeight
          break
        }
      }
    }
  }

  if (minX === Infinity) {
    throw new Error("No pcb_board or pcb_panel found in circuit json")
  }

  return { minX, maxX, minY, maxY }
}
