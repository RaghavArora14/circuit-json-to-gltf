import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import type { CircuitJson } from "circuit-json"

test("bottom-layer-components-angled-view-snapshot", async () => {
  // Circuit demonstrating proper bottom layer component placement
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 60,
      height: 40,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4" as const,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_top1",
      source_component_id: "src_top1",
      center: { x: -20, y: -10 },
      width: 12,
      height: 8,
      layer: "top" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_top2",
      source_component_id: "src_top2",
      center: { x: -20, y: 10 },
      width: 10,
      height: 6,
      layer: "top" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_bottom1",
      source_component_id: "src_bottom1",
      center: { x: 20, y: -10 },
      width: 14,
      height: 10,
      layer: "bottom" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_bottom2",
      source_component_id: "src_bottom2",
      center: { x: 20, y: 10 },
      width: 16,
      height: 12,
      layer: "bottom" as const,
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "source_component",
      source_component_id: "src_top1",
      name: "R1",
      ftype: "simple_resistor" as const,
      resistance: 10000,
      display_value: "R1",
    },
    {
      type: "source_component",
      source_component_id: "src_top2",
      name: "C1",
      ftype: "simple_capacitor" as const,
      capacitance: 100e-9,
      display_value: "C1",
    },
    {
      type: "source_component",
      source_component_id: "src_bottom1",
      name: "U1",
      ftype: "simple_chip" as const,
      display_value: "U1",
    },
    {
      type: "source_component",
      source_component_id: "src_bottom2",
      name: "U2",
      ftype: "simple_chip" as const,
      display_value: "U2",
    },
  ] as CircuitJson

  // Convert circuit to GLTF (GLB format for rendering)
  const glbResult = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 512,
    includeModels: true,
  })

  expect(glbResult).toBeInstanceOf(ArrayBuffer)

  // Optimal camera position to clearly show both top and bottom layer components
  const cameraOptions = {
    position: { x: 50, y: 35, z: 40 },
    target: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    fov: 40,
    width: 800,
    height: 600,
  }

  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer, cameraOptions),
  ).toMatchPngSnapshot(import.meta.path)
})