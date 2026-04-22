## Context

Current BPM edges use default `reactflow` styles which are thin and light grey. The `ArrowClosed` marker also uses default dimensions.

## Goals / Non-Goals

**Goals:**
- Increase visibility of BPM flow connections.
- Ensure consistent styling for both new and existing edges.

**Non-Goals:**
- Allowing user-customizable edge colors or widths.

## Decisions

### 1. Unified Style Configuration
- **Rationale**: Hardcoding the style in both `onConnect` and the hydration `useEffect` ensures consistent behavior.
- **Config**: 
  - `markerEnd`: `{ type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#1e293b' }`
  - `style`: `{ strokeWidth: 2, stroke: '#1e293b' }`

## Risks / Trade-offs

- **[Risk]** → Visual clutter.
  - **Mitigation** → 20px is a standard size for large markers and should remain legible without being overwhelming.
