## Context

Currently, a visual workflow diagram / sub-process is bound to a single GL code. To eliminate redundancy, we need to allow a single sub-process/diagram to be associated with multiple GL codes. This design outlines the schema changes, API refactoring, and UI adjustments needed to support this.

## Goals / Non-Goals

**Goals:**
- Allow a `BPMProcess` and its corresponding workflow diagram to be associated with multiple GL codes.
- Add a searchable multi-select checkbox dropdown in the `BPMEditor` to manage the GL code associations.
- Automatically pre-select/check the current GL code in the editor dropdown.
- Ensure that the process appears on the main `BPMPage.tsx` process list for any of the associated GL codes.

**Non-Goals:**
- Allowing sharing diagrams across different FSLIs (we keep the scope within the active FSLI).
- Modifying how RCM risks/controls are mapped to diagram nodes (they remain linked to nodes).

## Decisions

### Decision 1: Junction Table `bpm_process_gl_codes`
We will introduce a junction table `bpm_process_gl_codes` to store the many-to-many relationship:
- `id` (PK)
- `organizationId`
- `bpmProcessId` (Foreign Key to `bpm_processes.id`)
- `noGL` (GL Code string)

*Alternative considered*: Storing GL codes as a JSONB array or comma-separated string on `bpm_processes`. This was rejected because it violates normalization, makes indexing harder, and complicates SQL joins for matrix views.

### Decision 2: Backwards Compatibility Fallback
We will keep the `noGL` (or `no_gl`) column on the `bpm_processes` table to serve as a fallback. When querying or filtering, the backend will check both the junction table and the `noGL` fallback column.

### Decision 3: Atomic Saving with Diagram Put
When the user clicks the "Save" button in the visual editor, the save payload sent to `PUT /api/bpm-diagrams/:id` will include the `noGLs: string[]` array. The backend will handle updating the junction table within the diagram update flow, ensuring saving remains a single, atomic action for the user.

### Decision 4: Using `<MultiSelect>`
We will reuse the existing, pre-built `<MultiSelect>` component from `src/components/ui/multi-select.tsx` to handle searchable checkboxes for GL selection in the diagram editor's header toolbar.

## Risks / Trade-offs

- **Risk**: Deleting and re-inserting GL mappings in the junction table could be slow or cause brief inconsistency if the operation fails mid-way.
  - *Mitigation*: Perform the deletion and insertion inside a Drizzle transaction block.
- **Risk**: Assertion mappings (`account_assertions`) differ by GL code, so a shared process might show incorrect assertions in the RCM matrix.
  - *Mitigation*: Update RCM matrix endpoints to join assertions using the actively queried `noGL` code rather than the static `bpmProcesses.noGL`.
