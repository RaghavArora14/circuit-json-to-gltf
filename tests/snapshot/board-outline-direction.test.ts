import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import { getBestCameraPosition } from "../../lib/utils/camera-position"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { CircuitJson } from "circuit-json"

test("board-outline-direction-snapshot", async () => {
  // Exact replication of the DS3234S_T_R board from issue #84
  // The board has:
  // - Circular cutout at TOP
  // - Mounting holes at BOTTOM
  // - Chip in center with pads
  // - Jumper pads on RIGHT side
  // Expected: Circular cutout and mounting holes should be on OPPOSITE sides
  const circuitJson: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 60,
      height: 50,
      thickness: 1.6,
      num_layers: 2,
      // Board outline with semicircular cutout at top
      outline: (() => {
        const points = []
        points.push({ x: -30, y: 25 })
        points.push({ x: -12, y: 25 })

        // Create semicircular cutout (radius = 12mm, center at y=25)
        const radius = 12
        const centerY = 25
        const segments = 16
        for (let i = 0; i <= segments; i++) {
          const angle = Math.PI * (i / segments) // 0 to PI (semicircle)
          const x = -radius * Math.cos(angle)
          const y = centerY - radius * Math.sin(angle)
          points.push({ x, y })
        }

        points.push({ x: 12, y: 25 })
        points.push({ x: 30, y: 25 })
        points.push({ x: 30, y: -25 })
        points.push({ x: -30, y: -25 })
        return points
      })(),
    },
    // Main chip component (DS3234S)
    {
      type: "source_component",
      source_component_id: "U1",
      name: "U1",
      ftype: "simple_chip",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_U1",
      source_component_id: "U1",
      center: { x: 0, y: 0 },
      width: 24,
      height: 16,
      layer: "top",
    },
    // Chip pads - bottom row (pins 1-10) - 2x scale
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin1",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -11.43,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin2",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -8.89,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin3",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -6.35,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin4",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -3.81,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin5",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -1.27,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin6",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 1.27,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin7",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 3.81,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin8",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 6.35,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin9",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 8.89,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin10",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 11.43,
      y: -9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    // Chip pads - top row (pins 11-20) - 2x scale
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin11",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 11.43,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin12",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 8.89,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin13",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 6.35,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin14",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 3.81,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin15",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: 1.27,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin16",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -1.27,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin17",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -3.81,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin18",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -6.35,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin19",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -8.89,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pin20",
      pcb_component_id: "pcb_U1",
      shape: "rect",
      x: -11.43,
      y: 9.46,
      width: 1.19,
      height: 4.72,
      layer: "top",
    },
    // Jumper pads on the RIGHT side
    {
      type: "source_component",
      source_component_id: "JP1",
      name: "JP1",
      ftype: "simple_chip",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_JP1",
      source_component_id: "JP1",
      center: { x: 22, y: 0 },
      width: 4,
      height: 12,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "jp1",
      pcb_component_id: "pcb_JP1",
      shape: "rect",
      x: 22,
      y: 8,
      width: 3,
      height: 3,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "jp2",
      pcb_component_id: "pcb_JP1",
      shape: "rect",
      x: 22,
      y: 4,
      width: 3,
      height: 3,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "jp3",
      pcb_component_id: "pcb_JP1",
      shape: "rect",
      x: 22,
      y: -4,
      width: 3,
      height: 3,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "jp4",
      pcb_component_id: "pcb_JP1",
      shape: "rect",
      x: 22,
      y: -8,
      width: 3,
      height: 3,
      layer: "top",
    },
    // Mounting holes at BOTTOM (should be opposite from circular cutout)
    {
      type: "pcb_hole",
      pcb_hole_id: "hole1",
      x: -20,
      y: -20,
      hole_diameter: 3,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "hole2",
      x: -10,
      y: -20,
      hole_diameter: 3,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "hole3",
      x: 0,
      y: -20,
      hole_diameter: 3,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "hole4",
      x: 10,
      y: -20,
      hole_diameter: 3,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "hole5",
      x: 20,
      y: -20,
      hole_diameter: 3,
    },
  ]

  // First, generate reference PCB SVG to show expected layout
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    layer: "top",
    width: 800,
    height: 640,
  })
  expect(pcbSvg).toContain("svg")
  // In PCB view: circular cutout at TOP, mounting holes at BOTTOM, jumper on RIGHT

  // Convert circuit to GLTF (GLB format for rendering)
  const glbResult = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 512,
    includeModels: false,
    showBoundingBoxes: true,
  })

  // Ensure we got a valid GLB buffer
  expect(glbResult).toBeInstanceOf(ArrayBuffer)
  expect((glbResult as ArrayBuffer).byteLength).toBeGreaterThan(0)

  // Render the GLB to PNG with camera position derived from circuit dimensions
  const cameraOptions = getBestCameraPosition(circuitJson)

  // TOP VIEW - circular cutout should be at TOP, holes at BOTTOM, jumper on RIGHT
  // This should match the PCB SVG orientation
  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer, cameraOptions),
  ).toMatchPngSnapshot(import.meta.path, "board-outline-direction-top")

  // ANGLED VIEW to clearly see the 3D structure
  const angledCameraOptions = {
    ...cameraOptions,
    camPos: [
      cameraOptions.camPos[0] * 1.5,
      cameraOptions.camPos[1] * 0.8,
      cameraOptions.camPos[2] * 1.2,
    ] as const,
  }
  expect(
    renderGLTFToPNGBufferFromGLBBuffer(
      glbResult as ArrayBuffer,
      angledCameraOptions,
    ),
  ).toMatchPngSnapshot(import.meta.path, "board-outline-direction-angled")
})
