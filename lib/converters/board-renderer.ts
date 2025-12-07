import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { BoardRenderOptions } from "../types"

export interface TextureBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface BoardBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Calculate the bounds that circuit-to-svg uses for rendering.
 * circuit-to-svg uses the bounds of pcb_board elements (not pcb_panel).
 * If there's a pcb_panel but no pcb_board, it uses the panel bounds.
 */
export function calculateSvgBounds(circuitJson: CircuitJson): TextureBounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  // First, try to find pcb_board elements (circuit-to-svg prioritizes these)
  const boards = (circuitJson as any[]).filter((el) => el.type === "pcb_board")

  if (boards.length > 0) {
    // Use the combined bounds of all boards
    for (const board of boards) {
      if (board.center && board.width && board.height) {
        const hw = board.width / 2
        const hh = board.height / 2
        minX = Math.min(minX, board.center.x - hw)
        minY = Math.min(minY, board.center.y - hh)
        maxX = Math.max(maxX, board.center.x + hw)
        maxY = Math.max(maxY, board.center.y + hh)
      }
    }
  }

  // If no boards found, try pcb_panel
  if (!Number.isFinite(minX)) {
    const panel = (circuitJson as any[]).find((el) => el.type === "pcb_panel")
    if (panel && panel.center && panel.width && panel.height) {
      const hw = panel.width / 2
      const hh = panel.height / 2
      minX = panel.center.x - hw
      minY = panel.center.y - hh
      maxX = panel.center.x + hw
      maxY = panel.center.y + hh
    }
  }

  // If still no bounds found, use defaults
  if (!Number.isFinite(minX)) {
    return { minX: -10, maxX: 10, minY: -10, maxY: 10 }
  }

  return { minX, maxX, minY, maxY }
}

/**
 * Get the bounds of each individual pcb_board element.
 * Used to filter out cutout areas when applying textures.
 */
export function getIndividualBoardBounds(
  circuitJson: CircuitJson,
): BoardBounds[] {
  const boards = (circuitJson as any[]).filter((el) => el.type === "pcb_board")
  const bounds: BoardBounds[] = []

  for (const board of boards) {
    if (board.center && board.width && board.height) {
      const hw = board.width / 2
      const hh = board.height / 2
      bounds.push({
        minX: board.center.x - hw,
        maxX: board.center.x + hw,
        minY: board.center.y - hh,
        maxY: board.center.y + hh,
      })
    }
  }

  return bounds
}

export async function renderBoardLayer(
  circuitJson: CircuitJson,
  options: BoardRenderOptions,
): Promise<string> {
  const {
    layer,
    resolution = 1024,
    backgroundColor = "transparent",
    copperColor = "#ffe066",
    silkscreenColor = "#ffffff",
    drillColor = "rgba(0,0,0,0.5)",
  } = options

  const svg = convertCircuitJsonToPcbSvg(circuitJson, {
    layer,
    matchBoardAspectRatio: true,
    backgroundColor,
    drawPaddingOutsideBoard: false,
    colorOverrides: {
      soldermask: {
        top: "#4CAF50",
        bottom: "#4CAF50",
      },
      copper: {
        top: copperColor,
        bottom: copperColor,
      },
      silkscreen: {
        top: silkscreenColor,
        bottom: silkscreenColor,
      },
      drill: drillColor,
    },
  })

  // Use the SVG without transformation
  const finalSvg = svg

  // Use the best SVG-to-PNG conversion method for the platform
  return await convertSvgToPng(finalSvg, resolution, backgroundColor)
}

// Intelligent SVG to PNG conversion based on platform
async function convertSvgToPng(
  svgString: string,
  resolution: number,
  backgroundColor: string,
): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const { svgToPngDataUrl } = await import("../utils/svg-to-png-browser")

    return await svgToPngDataUrl(svgString, {
      width: resolution,
      background: backgroundColor,
    })
  } else {
    // Node.js/Bun: Use native Resvg for high-quality rendering
    try {
      const { svgToPngDataUrl } = await import("../utils/svg-to-png")
      return await svgToPngDataUrl(svgString, {
        width: resolution,
        background: backgroundColor,
      })
    } catch (error) {
      console.warn(
        "Failed to load native svg-to-png, falling back to browser method:",
        error,
      )
      // Fallback to canvas method if native import fails
      return convertSvgToCanvasBrowser(svgString, resolution, backgroundColor)
    }
  }
}

// Browser-based Canvas SVG conversion
async function convertSvgToCanvasBrowser(
  svgString: string,
  resolution: number,
  backgroundColor: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    canvas.width = resolution
    canvas.height = resolution
    const ctx = canvas.getContext("2d")!

    // Fill with background color first
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, resolution, resolution)

    // Create SVG data URL
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`

    // Create image from SVG
    const img = new Image()
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, resolution, resolution)
        resolve(canvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = (error: any) => {
      console.error("Failed to load SVG image:", error)
      reject(error)
    }
    img.src = svgDataUrl
  })
}

// Default PCB background color used in textures
export const PCB_BACKGROUND_COLOR = "#0F3812"

export async function renderBoardTextures(
  circuitJson: CircuitJson,
  resolution = 1024,
): Promise<{
  top: string
  bottom: string
  bounds: TextureBounds
  boardBounds: BoardBounds[]
  backgroundColor: string
}> {
  // Calculate the bounds that circuit-to-svg will use
  const bounds = calculateSvgBounds(circuitJson)
  // Get individual board bounds for filtering cutout areas
  const boardBounds = getIndividualBoardBounds(circuitJson)

  const [top, bottom] = await Promise.all([
    renderBoardLayer(circuitJson, {
      layer: "top",
      resolution,
      backgroundColor: PCB_BACKGROUND_COLOR,
    }),
    renderBoardLayer(circuitJson, {
      layer: "bottom",
      resolution,
      backgroundColor: PCB_BACKGROUND_COLOR,
    }),
  ])

  return { top, bottom, bounds, boardBounds, backgroundColor: PCB_BACKGROUND_COLOR }
}
