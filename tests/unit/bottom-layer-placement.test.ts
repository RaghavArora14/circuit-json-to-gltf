import { test, expect } from "bun:test"
import { convertCircuitJsonTo3D } from "../../lib"

test("bottom-layer components should be placed below board", async () => {
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 50,
      height: 30,
      thickness: 1.6,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_top",
      source_component_id: "src_top",
      center: { x: -10, y: 0 },
      width: 8,
      height: 6,
      layer: "top",
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp_bottom",
      source_component_id: "src_bottom",
      center: { x: 10, y: 0 },
      width: 10,
      height: 10,
      layer: "bottom",
    },
    {
      type: "source_component",
      source_component_id: "src_top",
      name: "R1",
      display_value: "10k",
    },
    {
      type: "source_component",
      source_component_id: "src_bottom",
      name: "U1",
      display_value: "ATMEGA328",
    },
  ]

  // Convert circuit to 3D scene
  const scene = await convertCircuitJsonTo3D(circuitJson as any, {
    renderBoardTextures: false,
    boardThickness: 1.6,
  })

  // Find the board and components
  const boardBox = scene.boxes[0] // First box should be the board
  expect(boardBox).toBeDefined()
  expect(boardBox?.center.y).toBe(0) // Board should be at Y=0

  // Find top and bottom components
  const topComponent = scene.boxes.find((box) => box.label === "R1")
  const bottomComponent = scene.boxes.find((box) => box.label === "U1")

  expect(topComponent).toBeDefined()
  expect(bottomComponent).toBeDefined()

  // Top component should be above the board (positive Y)
  expect(topComponent!.center.y).toBeGreaterThan(0)

  // Bottom component should be below the board (negative Y)
  expect(bottomComponent!.center.y).toBeLessThan(0)

  // The absolute distance from board center should be similar for both
  const boardCenterY = boardBox!.center.y
  const topDistance = Math.abs(topComponent!.center.y - boardCenterY)
  const bottomDistance = Math.abs(bottomComponent!.center.y - boardCenterY)

  // Distances should be similar (within 1.0mm tolerance, accounting for extra bottom clearance)
  expect(Math.abs(topDistance - bottomDistance)).toBeLessThan(1.0)
})

test("components without layer specified should default to top", async () => {
  const circuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 50,
      height: 30,
      thickness: 1.6,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: 0, y: 0 },
      width: 8,
      height: 6,
      // No layer specified - should default to top
    },
    {
      type: "source_component",
      source_component_id: "src1",
      name: "R1",
      display_value: "10k",
    },
  ]

  const scene = await convertCircuitJsonTo3D(circuitJson as any, {
    renderBoardTextures: false,
    boardThickness: 1.6,
  })

  const component = scene.boxes.find((box) => box.label === "R1")
  expect(component).toBeDefined()

  // Component without layer should be placed on top (positive Y)
  expect(component!.center.y).toBeGreaterThan(0)
})
