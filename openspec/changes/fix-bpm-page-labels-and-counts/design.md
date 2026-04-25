## Context

The BPM Page requires better terminology alignment and accurate data synchronization. Currently, the process table shows "0" for risks and controls because it relies on a faulty direct join that doesn't account for the relational structure used in the visual editor. Additionally, the label "Active Source" is misleading in the context of FSLI selection.

## Goals / Non-Goals

**Goals:**
- Correct the FSLI label on the BPM page.
- Implement reliable Risk/Control count synchronization.
- Ensure the BPM Page is integrated with the Unsaved Changes warning system.
- Maintain schema integrity with Drizzle migrations.

**Non-Goals:**
- Changing the Scoping Page labels.
- Modifying the visual layout of the BPM Editor itself.

## Decisions

### 1. Data Synchronization Strategy
**Decision:** Denormalize `risk_count` and `control_count` into the `bpm_processes` table.
**Rationale:** Calculating these counts on the fly requires complex multiple joins across `bpm_diagrams`, `bpm_node_rcms`, `rcms`, and `rcm_controls` for every row in the process list. By denormalizing, we improve read performance.
**Alternatives:** 
- Keep on-the-fly calculation: Too complex for the `GET /api/bpm-processes` query and likely to perform poorly as data grows.

### 2. Count Recalculation Trigger
**Decision:** Recalculate counts during the `PUT /api/bpm-diagrams/:id` operation.
**Rationale:** The counts only change when the diagram (workflow) is modified. This is the natural integration point for synchronization.
**Implementation:** After saving diagram nodes and relational mappings, query the database for unique risks and controls associated with that diagram's subprocess name and update the corresponding `bpm_processes` record.

### 3. Localization Strategy
**Decision:** Add a new key `fsliLabel` to `bpm.json`.
**Rationale:** Decouples BPM terminology from Scoping terminology while keeping translations organized.

### 4. Unsaved Changes Integration
**Decision:** Use the existing `useUnsavedChanges` hook to track the `isAssertionDirty` state.
**Rationale:** Follows the project standard established in `implement-unsaved-changes-warning`.

## Risks / Trade-offs

- **[Risk]** Synchronization mismatch if a process name is changed. 
  → **Mitigation:** Ensure the diagram name and process name remain linked or handled via CASCADE updates.
- **[Risk]** Migration failure in production.
  → **Mitigation:** Test migration locally with `npx drizzle-kit push` before deploying.
