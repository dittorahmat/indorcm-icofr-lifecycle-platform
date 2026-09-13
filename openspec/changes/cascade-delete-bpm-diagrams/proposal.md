## Why

When a user deletes a BPM process from the BPM Management workspace (`BPMPage.tsx`), the corresponding workflow diagram (`bpm_diagrams`) is not deleted. Because diagrams are matched by sub-process name (`subProcess === bpm.name`), if a user subsequently creates a new process with the same name, the previously drawn diagram—along with its nodes and edges—unexpectedly re-appears. 

Furthermore, deleting a diagram directly can encounter PostgreSQL foreign key constraints (`rcms_diagram_id_bpm_diagrams_id_fk`) if any RCM records still point to `diagram_id`.

A clean cascade deletion mechanism is needed so that deleting a BPM process automatically removes its orphan diagrams, cleans up `bpm_node_rcms` associations, and safely decouples any referencing RCMs without breaking database integrity.

## What Changes

- **Backend (`worker/services/bpm-service.ts`)**:
  - Enhance `deleteProcess` to:
    1. Query the target `bpm_processes` record before deletion to obtain its `name` (sub-process name), `year`, and `organizationId`.
    2. Check if other processes in the same organization and year still use this `name`.
    3. If no other process uses this sub-process name, find associated `bpm_diagrams` matching the sub-process and year.
    4. Decouple referencing `rcms` by setting `rcms.diagramId = null`.
    5. Delete associated `bpm_node_rcms` records.
    6. Delete the matching `bpm_diagrams`.
    7. Decouple controls and CSA records, and delete the process and its GL code mappings (`bpm_process_gl_codes`).
  - Enhance `deleteDiagram` to safely decouple `rcms.diagramId = null` before deleting the diagram, preventing FK constraint violation (`23503`).

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Business process deletion now cleanly cascades to associated diagrams and node-rcm linkages when no other process shares the sub-process.

## Impact

- **Affected Code**: `worker/services/bpm-service.ts`.
- **Database Integrity**: Eliminates orphaned diagrams and avoids FK constraint violations (`23503`).
- **User Experience**: Creating a new BPM process with a previously used name starts with a clean diagram state as expected by the user.
