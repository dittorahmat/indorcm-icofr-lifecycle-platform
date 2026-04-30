## Context

The BPM Editor is a central component for ICOFR compliance, allowing users to visualize business processes and link them to risks and controls. Currently, the implementation uses basic geometric shapes that don't match the formal "Golden Standard" expected by BUMN users (Microsoft Office/Visio) or the specific requirements of **SK-5/2024**. The system also lacks safety nets for unsaved edits, functional swimlanes (Lampiran 4), and formal reporting layouts.

## Goals / Non-Goals

**Goals:**
- Implement high-fidelity regulatory node shapes using SVG paths.
- Implement a **Swimlane** system using React Flow grouping to represent Divisions/Departments.
- Enable Risk & Control mapping for ALL node types via a universal badge system.
- Implement a double-layer "Unsaved Changes" guard.
- Standardize all terminology in i18n files according to SK-5.
- Add configurable formal Header/Footer overlay to the canvas for reporting.

**Non-Goals:**
- Real-time collaborative editing (multi-user on same diagram).
- Full Visio file import/export (.vsdx).

## Decisions

### 1. Custom SVG Node Types
- **Choice**: Use dedicated SVG path components for each node type (e.g., `ArchiveTriangle`, `ManualInputShape`).
- **Rationale**: CSS borders are insufficient for complex shapes like the "Manual Input" slanted top or the "Document" wavy bottom. SVG ensures pixel-perfect alignment with MS Office standards.

### 2. Swimlane Implementation
- **Choice**: Use React Flow "Parent Nodes" (Grouping) to create draggable columns.
- **Rationale**: This allows nodes to be pinned to specific functional lanes. If a lane moves, all nodes within it move. Labels for "Department" and "Function" will be implemented as editable text components in the lane header.

### 3. Universal RCM Docking
- **Choice**: Refactor `DockedRiskNode` and `DockedControlNode` to be relative-positioned overlays that can mount to any `parentId`.
- **Rationale**: Previously hardcoded for `activity`, moving to a `parentId` system allows any node to act as a container for RCM markers.

### 4. Smart ID Assignment Strategy
- **Choice**: Generate RCM IDs only when `regulatoryData` is non-empty (i.e., user types description).
- **Rationale**: Prevents populating the database with empty RCM rows for placeholder nodes.

### 5. Navigation Guard Implementation
- **Choice**: Use a combination of `react-router-dom` `useBlocker` (for internal links) and a global `window.addEventListener('beforeunload')` (for external).
- **Rationale**: This "double-layer" approach is the only way to catch both SPA navigation and browser-level actions (Refresh/Tab Close).

### 6. Configurable Header/Footer
- **Choice**: Fetch Logo and Signatories from the global `Settings` Durable Object.
- **Rationale**: Ensures consistency across all process diagrams within the same organization.

## Risks / Trade-offs

- **[Risk]**: `useBlocker` behavior in React Router v6.x can be tricky with some browsers. → **Mitigation**: Standardize on a Shadcn `AlertDialog` for consistent confirmation UI.
- **[Trade-off]**: Complex swimlane nesting might impact canvas performance. → **Mitigation**: Use simple rectangle wrappers for lanes and avoid deep nesting.

## Migration Plan

1. **Schema Update**: Execute `npx drizzle-kit generate` and `push` to update the database to support swimlane metadata and universal RCM mapping.
2. **Localization**: Update all `bpm.json` and `rcm.json` keys.
3. **Refactor Components**: Surgical updates to `BPMEditor.tsx` and `RegulatoryPropertySheet.tsx`.
