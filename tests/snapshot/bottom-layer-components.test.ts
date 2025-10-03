import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import { getBestCameraPosition } from "../../lib/utils/camera-position"
import type { CircuitJson } from "circuit-json"

test("bottom-layer-components-snapshot", async () => {
  // Circuit with components on both top and bottom layers
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 50,
      height: 30,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4" as const,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_top",
      source_component_id: "src_top",
      center: { x: -15, y: 0 },
      width: 8,
      height: 6,
      layer: "top" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_bottom",
      source_component_id: "src_bottom",
      center: { x: 15, y: 0 },
      width: 10,
      height: 10,
      layer: "bottom" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_top2",
      source_component_id: "src_top2",
      center: { x: 0, y: -8 },
      width: 6,
      height: 4,
      layer: "top" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_bottom2",
      source_component_id: "src_bottom2",
      center: { x: 0, y: 8 },
      width: 12,
      height: 6,
      layer: "bottom" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "source_component",
      source_component_id: "src_top",
      name: "R1",
      ftype: "simple_resistor" as const,
      resistance: 10000,
      display_value: "10k",
    },
    {
      type: "source_component",
      source_component_id: "src_bottom",
      name: "U1",
      ftype: "simple_chip" as const,
      display_value: "ATMEGA328",
    },
    {
      type: "source_component",
      source_component_id: "src_top2",
      name: "C1",
      ftype: "simple_capacitor" as const,
      capacitance: 100e-9,
      display_value: "100nF",
    },
    {
      type: "source_component",
      source_component_id: "src_bottom2",
      name: "U2",
      ftype: "simple_chip" as const,
      display_value: "ESP32",
    },
  ] as CircuitJson

  // Convert circuit to GLTF (GLB format for rendering)
  const glbResult = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 512,
    includeModels: true,
  })

  expect(glbResult).toBeInstanceOf(ArrayBuffer)

  const cameraOptions = getBestCameraPosition(circuitJson)

  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer, cameraOptions),
  ).toMatchPngSnapshot(import.meta.path)
})
