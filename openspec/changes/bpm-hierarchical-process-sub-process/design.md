## Context

See `proposal.md` for background and regulatory rationale under SK-5/DKU.MBU/11/2024.
Currently, `bpmProcesses` in `worker/db/schema.ts` stores process records with a foreign key to `organizationId` and `noGL`, but with no parent-child relationship. The frontend `BPMPage.tsx` and `BPMDiagramList.tsx` list all processes flatly. Diagram linkages via `bpmDiagrams` use the sub-process name or ID.

## Goals / Non-Goals

**Goals:**
- Add self-referencing `parentId` to `bpmProcesses` to support 2-level hierarchy: Macro Process (parent) and Micro Sub-Process (child).
- Update the BPM table to render an expandable tree structure where processes can be expanded/collapsed.
- Implement a batch migration modal (`BPMMigrationModal.tsx`) allowing users to demote independent processes into sub-processes under a selected parent or promote sub-processes to root-level processes.
- Ensure risk and control counts roll up from sub-processes to parent processes.
- Provide Macro diagram access on the Process row, and Micro diagram + RCM Worksheet access on the Sub-Process row.

**Non-Goals:**
- Multi-tier arbitrary depth (>2 levels): SK-5 strictly requires Process -> Sub-Process. We explicitly constrain depth to 2 levels (Process -> Sub-Process).
- Automatic re-mapping of GL codes: The user continues to operate within the scoped GL code or multi-GL linkages already established.

## Decisions

### 1. Self-Referencing Schema vs Separate Sub-Process Table
- **Decision**: Add `parentId` (`text("parent_id").references((): any => bpmProcesses.id, { onDelete: 'set null' })`) and `level` (`text("level").default("process")`) directly on `bpm_processes`.
- **Rationale**:
  - Reuses all existing schema fields, audit trails, workflow history, and RCM linkages without needing duplicate tables.
  - Making migration (promote/demote) a trivial single-column update (`parentId = null` vs `parentId = targetId`), avoiding complex cross-table data copying.
- **Alternative Considered**: Creating a distinct `bpm_sub_processes` table. Rejected because moving 4 processes into sub-processes would require deleting from one table and re-inserting into another, breaking audit trails and existing foreign keys.

### 2. Frontend Expandable Tree Architecture
- **Decision**: Transform the flat list returned by the API into a tree structure client-side in `useBPMPage.ts`:
  ```typescript
  export interface BPMProcessWithChildren extends BPMProcess {
    children?: BPMProcess[];
  }
  ```
- **Rationale**:
  - Keeps API response lightweight and backward-compatible.
  - Allows easy toggling of row expansion using local state `expandedProcessIds: Set<string>`.
  - Enables clean rollup calculation of total risks and controls on the parent row:
    `totalRisks = sum(children.riskCount) + (parent.riskCount || 0)`.

### 3. Bidirectional Batch Migration API Endpoint
- **Decision**: Provide a dedicated endpoint `POST /api/bpm-processes/batch-reorganize`:
  ```typescript
  // Payload:
  {
    action: "demote" | "promote",
    targetParentId?: string,
    processIds: string[]
  }
  ```
- **Validation**:
  - Demote requires a valid `targetParentId`. A parent cannot be demoted under itself.
  - Promote sets `parentId = null` for all given `processIds`.
  - Performed inside a database transaction (`db.transaction`).

### 4. Diagram Distinction (Macro vs Micro)
- **Decision**:
  - When clicking "Diagram" on a **Process (Parent)**: Opens diagram named `${process.name} (Macro)` or linked diagram.
  - When clicking "Diagram" on a **Sub-Process (Child)**: Opens the existing micro workflow diagram where activities and docked RCM controls live.
  - When clicking "RCM Worksheet": Available primarily on the Sub-Process row, where atomic risk-control assertions are evaluated.

## Risks / Trade-offs

- [Risk] Demoting a process that already has sub-processes could create 3-level nesting.
  → Mitigation: Validate that `targetParentId` must be a root process (`parentId IS NULL`), and any process being demoted must not have existing children (or automatically detach children to root).
- [Risk] Circular parent references if arbitrary selection is allowed.
  → Mitigation: In the Demote modal, filter out the selected processes from the candidate parent dropdown.
- [Risk] Unsaved changes during expand/collapse.
  → Mitigation: Expansion state is purely UI display state; it does not mutate entity data and will not trigger unsaved changes warnings.
