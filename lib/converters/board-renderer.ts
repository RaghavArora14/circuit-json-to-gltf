import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg, getPcbTextureBounds } from "circuit-to-svg"
import type { BoardRenderOptions } from "../types"
import type { Bounds } from "@tscircuit/math-utils"
import { getIndividualBoardBounds } from "../utils/get-individual-board-bounds"

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
    useOnlyBoardBounds: true,
    showSolderMask: true,
    colorOverrides: {
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

  return await convertSvgToPng({ svgString: svg, resolution, backgroundColor })
}

// Intelligent SVG to PNG conversion based on platform
async function convertSvgToPng({
  svgString,
  resolution,
  backgroundColor,
}: {
  svgString: string
  resolution: number
  backgroundColor: string
}): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const { svgToPngDataUrl } = await import("../utils/svg-to-png-browser")

    return await svgToPngDataUrl(svgString, {
      width: resolution,
      background: backgroundColor,
    })
  }

  // Node.js/Bun: Use native #svg for high-quality rendering
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
    return convertSvgToCanvasBrowser({ svgString, resolution, backgroundColor })
  }
}

// Browser-based Canvas SVG conversion
async function convertSvgToCanvasBrowser({
  svgString,
  resolution,
  backgroundColor,
}: {
  svgString: string
  resolution: number
  backgroundColor: string
}): Promise<string> {
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

    // Create Image from SVG
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

export async function renderBoardTextures(
  circuitJson: CircuitJson,
  resolution = 1024,
): Promise<{
  top: string
  bottom: string
  bounds: Bounds
  boardBounds: Bounds[]
}> {
  // Use getPcbTextureBounds from circuit-to-svg to get the exact bounds used for SVG rendering
  // This matches the bounds used when rendering with useOnlyBoardBounds: true
  const bounds = getPcbTextureBounds(circuitJson)
  const boardBounds = getIndividualBoardBounds(circuitJson)

  const [top, bottom] = await Promise.all([
    renderBoardLayer(circuitJson, {
      layer: "top",
      resolution,
      backgroundColor: "#0F3812",
    }),
    renderBoardLayer(circuitJson, {
      layer: "bottom",
      resolution,
      backgroundColor: "#0F3812",
    }),
  ])

  return {
    top,
    bottom,
    bounds,
    boardBounds,
  }
}
