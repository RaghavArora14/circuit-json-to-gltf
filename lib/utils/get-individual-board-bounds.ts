import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { Bounds } from "@tscircuit/math-utils"

/**
 * Get bounds for each individual pcb_board element.
 * Used to determine which areas should receive texture vs solid color.
 */
export function getIndividualBoardBounds(
  circuitJson: AnyCircuitElement[],
): Bounds[] {
  const bounds: Bounds[] = []

  for (const el of circuitJson) {
    if (el.type === "pcb_board") {
      const board = el as PcbBoard
      if (board.center && board.width && board.height) {
        const halfWidth = board.width / 2
        const halfHeight = board.height / 2
        bounds.push({
          minX: board.center.x - halfWidth,
          maxX: board.center.x + halfWidth,
          minY: board.center.y - halfHeight,
          maxY: board.center.y + halfHeight,
        })
      }
    }
  }

  return bounds
}
