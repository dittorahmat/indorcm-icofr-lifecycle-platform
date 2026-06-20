## Why

Currently, a visual workflow diagram/sub-process in the BPM Editor is bound to a single GL code. However, multiple GL accounts often share the exact same business process and workflow diagram (e.g., cash reception across different bank accounts). Forcing users to duplicate the diagram and process metadata for each GL code leads to redundant data, increased manual workload, and sync errors. Linking a single BPM process and diagram to multiple GL codes eliminates duplicates and simplifies workflow management.

## What Changes

- **Database Relation**: Introduce a junction table `bpm_process_gl_codes` to model the many-to-many relationship between `bpm_processes` and GL codes, while keeping the primary `no_gl` column on `bpm_processes` as a backwards-compatible fallback.
- **Backend API Update**:
  - Modify `GET /api/bpm-processes` to return a process when it is associated with the queried GL code via the junction table.
  - Modify `GET /api/bpm-diagrams/:id` to return a list of associated GL codes (`noGLs`) for the diagram's process.
  - Modify `PUT /api/bpm-diagrams/:id` to clear and re-insert the associated GL codes in the junction table.
- **Frontend BPM Editor Configuration**:
  - Add a "Linked GL Accounts" searchable checkbox dropdown in the top-right panel of the `BPMEditor` using the project's `<MultiSelect>` component.
  - Auto-select/check the current GL code in the dropdown by default to ensure seamless user experience.
  - Send the selected GL codes (`noGLs`) in the diagram save payload.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `bpm-execution-hub`: Update diagram-to-process matching and data linking to support and resolve multiple GL codes per process.

## Impact

- **Database**: New table `bpm_process_gl_codes`.
- **Backend Services**: `worker/services/bpm-service.ts` (`getDiagramById`, `updateDiagram`, `getAllProcesses`).
- **Worker APIs**: `worker/routes/bpm.ts` and `worker/routes/rcm.ts` (TLC Matrix joins).
- **Frontend Components**: `src/components/rcm/BPMEditor.tsx`, `src/pages/bpm/BPMPage.tsx`.
