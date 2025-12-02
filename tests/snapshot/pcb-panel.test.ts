import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import { getBestCameraPosition } from "../../lib/utils/camera-position"
import type { CircuitJson } from "circuit-json"
import * as fs from "node:fs"
import * as path from "node:path"

test("pcb-panel-snapshot", async () => {
  const panelPath = path.join(__dirname, "../fixtures/panel.json")
  const circuitData = fs.readFileSync(panelPath, "utf-8")
  const circuitJson: CircuitJson = JSON.parse(circuitData)

  const glbResult = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 512,
    includeModels: true,
    showBoundingBoxes: false,
  })

  expect(glbResult).toBeInstanceOf(ArrayBuffer)
  expect((glbResult as ArrayBuffer).byteLength).toBeGreaterThan(0)

  const cameraOptions = getBestCameraPosition(circuitJson)
  const rotatedCameraOptions = {
    camPos: [
      -cameraOptions.camPos[0],
      cameraOptions.camPos[1],
      -cameraOptions.camPos[2],
    ] as const,
    lookAt: [
      -cameraOptions.lookAt[0],
      cameraOptions.lookAt[1],
      -cameraOptions.lookAt[2],
    ] as const,
  }

  expect(
    renderGLTFToPNGBufferFromGLBBuffer(
      glbResult as ArrayBuffer,
      rotatedCameraOptions,
    ),
  ).toMatchPngSnapshot(import.meta.path, "pcb-panel")
})
