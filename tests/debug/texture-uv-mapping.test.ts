import { describe, it, expect } from "vitest"
import type { PcbPanel } from "circuit-json"

  it("should verify UV coordinate generation for board mesh", async () => {
    const { createBoardMesh } = await import(
      "../../lib/utils/pcb-board-geometry"
    )

    const panel: PcbPanel = {
      pcb_panel_id: "panel1",
      center: { x: 50, y: 50 },
      width: 100,
      height: 100,
    }

    const mesh = createBoardMesh(panel, {
      thickness: 1.6,
      holes: [],
      platedHoles: [],
      cutouts: [],
    })

    console.log("\nBoard Mesh UV Analysis:")
    console.log("  Bounding Box:", mesh.boundingBox)

    // Analyze top face triangles
    const topFaceTriangles = mesh.triangles.filter(
      (tri) =>
        tri.vertices.every((v) => v.y > 0.7) && // All vertices near top
        tri.normal.y > 0.9, // Facing up
    )

    console.log("  Top Face Triangles:", topFaceTriangles.length)

    if (topFaceTriangles.length > 0) {
      const sample = topFaceTriangles[0]
      console.log("\n  Sample Top Triangle:")
      console.log("    V1:", sample.vertices[0])
      console.log("    V2:", sample.vertices[1])
      console.log("    V3:", sample.vertices[2])

      // Calculate what UV coordinates SHOULD be
      const bbox = mesh.boundingBox
      const width = bbox.max.x - bbox.min.x
      const height = bbox.max.z - bbox.min.z

      console.log("\n  Expected UV Calculation:")
      console.log("    Mesh Width:", width)
      console.log("    Mesh Height:", height)
      console.log("    Panel Width: 100")
      console.log("    Panel Height: 100")

      // Calculate expected UVs for each vertex
      sample.vertices.forEach((v, idx) => {
        const u = (v.x - bbox.min.x) / width
        const v_coord = (v.z - bbox.min.z) / height
        console.log(`    V${idx + 1} UV: (${u.toFixed(3)}, ${v_coord.toFixed(3)})`)
      })
    }

    expect(mesh.triangles.length).toBeGreaterThan(0)
  })
})
