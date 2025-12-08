import { rotateX } from "@jscad/modeling/src/operations/transforms"
import { subtract } from "@jscad/modeling/src/operations/booleans"
import * as geom3 from "@jscad/modeling/src/geometries/geom3"
import measureBoundingBox from "@jscad/modeling/src/measurements/measureBoundingBox"
import type { PcbHole, PCBPlatedHole, PcbPanel } from "circuit-json"
import type { STLMesh } from "../types"
import { createBoundingBox, geom3ToTriangles } from "./pcb-board-geometry"
import { createBoardOutlineGeom, createHoleGeoms } from "./pcb-board-geometry"
import { createCutoutGeoms } from "./pcb-board-cutouts"
import type { BoardGeometryOptions } from "./pcb-board-geometry"

export const createPanelMesh = (
  panel: PcbPanel,
  options: BoardGeometryOptions,
): STLMesh => {
  const { thickness, holes = [], platedHoles = [], cutouts = [] } = options
  const center = panel.center ?? { x: 0, y: 0 }

  let panelGeom = createBoardOutlineGeom(panel, center, thickness)

  // Subtract holes and cutouts from panel
  const holeGeoms = createHoleGeoms(center, thickness, holes, platedHoles)
  if (holeGeoms.length > 0) {
    panelGeom = subtract(panelGeom, ...holeGeoms)
  }

  // Handle cutouts if present
  if (cutouts.length > 0) {
    const cutoutGeoms = createCutoutGeoms(center, thickness, cutouts)
    if (cutoutGeoms.length > 0) {
      panelGeom = subtract(panelGeom, ...cutoutGeoms)
    }
  }

  panelGeom = rotateX(-Math.PI / 2, panelGeom)

  const polygons = geom3.toPolygons(panelGeom)
  const triangles = geom3ToTriangles(panelGeom, polygons)

  const bboxValues = measureBoundingBox(panelGeom)
  const boundingBox = createBoundingBox(bboxValues)

  return {
    triangles,
    boundingBox,
  }
}
