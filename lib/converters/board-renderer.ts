import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { BoardRenderOptions } from "../types"
import {
  type Bounds,
  isPcbBoard,
  isPcbPanel,
  getBoundsFromElement,
} from "../utils/bounds"

export type TextureBounds = Bounds
export type BoardBounds = Bounds

export function calculateSvgBounds(circuitJson: CircuitJson): TextureBounds {
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
  circuitJson: CircuitJson,
): BoardBounds[] {
  const boards = circuitJson.filter(isPcbBoard)
  const bounds: BoardBounds[] = []

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

  return await convertSvgToPng(svg, resolution, backgroundColor)
}

async function convertSvgToPng(
  svgString: string,
  resolution: number,
  backgroundColor: string,
): Promise<string> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const { svgToPngDataUrl } = await import("../utils/svg-to-png-browser")
    return await svgToPngDataUrl(svgString, {
      width: resolution,
      background: backgroundColor,
    })
  }

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
    return convertSvgToCanvasBrowser(svgString, resolution, backgroundColor)
  }
}

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

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, resolution, resolution)

    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`
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
  const bounds = calculateSvgBounds(circuitJson)
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

  return {
    top,
    bottom,
    bounds,
    boardBounds,
    backgroundColor: PCB_BACKGROUND_COLOR,
  }
}
