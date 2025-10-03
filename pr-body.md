## Problem

Components with `layer: "bottom"` in Circuit JSON were being placed above the PCB board instead of below it in the generated GLTF/GLB files. This made the 3D visualization incorrect as all components appeared on the same side of the board.

## Root Cause

The `convertCircuitJsonTo3D` function was using hardcoded Y position calculations that ignored the `layer` property of PCB components:

```typescript
// Before (broken):
y: boardThickness / 2 + compHeight / 2,  // Always above board
```

This affected both CAD components with 3D models and generic components without models.

## Solution

Added a `getComponentYPosition()` helper function that calculates the correct Y position based on the component's layer:

```typescript
function getComponentYPosition(layer, boardThickness, componentHeight) {
  const isBottomLayer = layer === "bottom"
  
  if (isBottomLayer) {
    return -(boardThickness / 2 + componentHeight / 2)  // Below board
  } else {
    return boardThickness / 2 + componentHeight / 2     // Above board
  }
}
```

## Changes Made

1. **lib/converters/circuit-to-3d.ts**: Added layer-aware positioning for both CAD and generic components
2. **lib/browser.ts**: Updated browser version with same fix for consistency
3. **package.json**: Added missing dependencies (`graphics-debug` and `@tscircuit/soup-util`) to resolve test failures

## Testing

Added comprehensive test coverage:

- **Unit tests**: Verify correct Y positioning based on layer property
- **Visual tests**: Generate snapshot showing components above and below board
- **All existing tests**: Continue to pass, ensuring no regressions

Test results:
```
✓ bottom-layer components should be placed below board
✓ components without layer specified should default to top
✓ 22 total tests pass
```

## Behavior

| Component Layer | Y Position | Placement |
|---|---|---|
| `"top"` | Positive | Above PCB board |
| `"bottom"` | Negative | Below PCB board |
| `undefined` | Positive | Above PCB board (default) |

## Backward Compatibility

- Components without a `layer` property default to top layer (Y > 0)
- All existing circuits continue to render correctly
- No breaking changes to the API

## Visual Verification

The fix is demonstrated by the included snapshot test which shows components correctly distributed above and below the PCB board, instead of all components floating above it.

Closes #34