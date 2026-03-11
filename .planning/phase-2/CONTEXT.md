# Phase 2: BPM & RCM Integration - Context

## Objectives
- Enhance BPM Visualization with React Flow standardized shapes (Lampiran 3).
- Connect RCM items to visual BPM nodes (Risk-to-Node mapping).
- Implement a formal Change Management Log (Lampiran 6) that persists records when RCM/BPM changes are approved.
- Stabilize the "Change Request and Approval" workflow between Line 1 and Line 2.

## Technical Architecture
- **Diagramming**: React Flow in `src/components/rcm/BPMEditor.tsx`.
- **RCM State**: Durable Objects storage with `bpmData` containing nodes and edges.
- **Change Log**: `ChangeLogEntity` in Durable Objects, synced via `/api/changelogs`.
- **Workflow**: 
  - Line 1 saves changes -> Status: `Pending Change Approval`.
  - Line 2 approves -> Status: `Active`, creates `ChangeLog` entry.

## Regulatory References
- **Lampiran 3**: Visual legends (Oval=Start/End, Hexagon=Risk, Rectangle=Activity).
- **Lampiran 6**: Change Log documentation requirements (Before/After descriptions, Effective Date, Approval).
