## Context

Risks and controls created in the BPM Editor on node shapes other than rectangles (e.g. Hexagon risk nodes, Cylinder system media nodes) are not showing up in TLC/ELC/ITGC lists because the backend only runs RCM sync on `activity` and `automated-activity` nodes.

## Goals / Non-Goals

**Goals:**
- Enable RCM synchronization for all valid compliance node types in `worker/services/bpm-service.ts`.
- Ensure all custom node types hydrate their RCM badges and details properly from the database.
- Provide a CLI utility script to backfill existing diagrams and recover data for the RCM database tables.

**Non-Goals:**
- Modifying how the frontend renders nodes.
- Changing database schemas.

## Decisions

### 1. Generalize Node Type Filtering in `BpmService`
- **Decision**: Define a helper or inline check in `worker/services/bpm-service.ts`:
  ```typescript
  const skipTypes = ['start', 'end', 'reference', 'swimlane'];
  const isValidRcmNode = (type?: string) => type && !skipTypes.includes(type);
  ```
  Replace `node.type === 'activity' || node.type === 'automated-activity'` checks in:
  - `hydrateDiagramNodes`
  - `syncRisksAndControlsFromNodes`
- **Rationale**: This aligns the backend sync constraints with the frontend sheet constraints in `RegulatoryPropertySheet.tsx` where only those 4 types are excluded.

### 2. Backfill Script Execution
- **Decision**: Implement a script `scripts/backfill-bpm-custom-nodes.ts` that:
  - Queries all records from the `bpm_diagrams` table.
  - Instantiates `BpmService`.
  - For each diagram, calls `updateDiagram` (or a helper sync method) with the existing nodes/edges data.
  - This is idempotent and will write missing rows to `rcms`, `controls`, and `rcmControls` without overwriting custom modifications on existing ones.

## Risks / Trade-offs

- [Risk] Mismatched properties or empty fields in custom nodes -> Mitigation: The sync logic handles default fallbacks (e.g. "Draft Control" or node label) safely.
- [Risk] Performance on large databases during backfill -> Mitigation: Run the script sequentially per diagram.
