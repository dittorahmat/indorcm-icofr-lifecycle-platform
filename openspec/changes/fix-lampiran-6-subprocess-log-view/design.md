## Context

Currently, `Lampiran6LogView` receives `entityId` containing a General Ledger account number (`noGL`), but records in `audit_logs` are keyed by entity UUIDs (such as `control.id` or `diagram.id`). As a result, the equality check `l.entityId !== entityId` filters out all logs.

See `proposal.md` for background context and motivation.

## Goals / Non-Goals

**Goals:**
- Target `Lampiran6LogView` specifically to the active Sub-Process / BPM Diagram context using `subProcessName` and `bpmProcessId`.
- Match audit entries by examining `dataAfter` / `dataBefore` subProcess attributes or process ID mappings, as well as direct entity IDs.
- Ensure audit logging in `ControlService.approve` and `ControlService.update` stores `bpmProcessId` and `subProcess` in the audit snapshot.
- Comply with Institutional anti-slop UI standards (minimum 12px font, solid surfaces, no decorative italic or excessive rounded borders).

**Non-Goals:**
- Modifying the global regulatory report at `/reports/regulatory` (which already retrieves organization-wide regulatory change logs).
- Changing the underlying schema of `audit_logs` (the existing JSON columns `data_before` and `data_after` already support storing arbitrary entity snapshot metadata).

## Decisions

### 1. Multi-Criteria Sub-Process Log Resolution
- **Choice**: Match logs if:
  1. `log.dataAfter?.subProcess` or `log.dataBefore?.subProcess` matches `subProcessName` (case-insensitive trimmed comparison), OR
  2. `log.dataAfter?.bpmProcessId` or `log.dataBefore?.bpmProcessId` matches `bpmProcessId`, OR
  3. `log.entityId` equals `bpmProcessId` (for diagram-level updates).
- **Alternative considered**: Filter only by `entityId === bpmProcessId`.
  - *Why rejected*: Control modifications have `entityId === control.id`, so filtering purely by `entityId` would miss control approvals inside the sub-process.

### 2. Props Signature for `Lampiran6LogView`
- **Choice**: Update `Lampiran6LogViewProps` to accept:
  ```typescript
  interface Lampiran6LogViewProps {
    subProcessName?: string;
    bpmProcessId?: string;
    year?: string;
    entityId?: string; // Kept for backward compatibility
  }
  ```
- **Alternative considered**: Remove `entityId` completely.
  - *Why rejected*: Keeping `entityId` optional avoids breaking any other hypothetical callers while prioritizing sub-process matching.

### 3. Snapshot Completeness in `ControlService`
- **Choice**: When approving or updating controls, ensure the snapshot contains `subProcess`, `bpmProcessId`, and `businessProcess`.
- **Alternative considered**: Perform dynamic table joins on `audit_logs` with `controls` and `rcm_controls` on the backend.
  - *Why rejected*: Audit logs represent an immutable historical point-in-time record. Snapshot data must be self-contained so that even if a control is renamed or moved in the future, the log accurately reflects the state at approval time.

## Risks / Trade-offs

- **[Risk]** Historical audit logs created before this update may not have `subProcess` or `bpmProcessId` populated in `dataAfter`.
  - **Mitigation**: Provide fallback matching against control codes or fallback query in development/seed environments, plus clear empty state indicator when no historical logs are found.
