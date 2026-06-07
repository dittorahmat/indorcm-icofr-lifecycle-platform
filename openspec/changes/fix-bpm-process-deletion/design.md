## Context

Deleting a `bpm_processes` record is blocked by foreign key constraints in `controls` and `csa_records`. These tables link back to the process to track where a control is executed or where a CSA was performed.

## Goals / Non-Goals

**Goals:**
- Allow successful deletion of BPM processes.
- Ensure no foreign key violations occur during deletion.
- Maintain data integrity in `controls` and `csa_records` (by decoupling them instead of deleting them, as they represent historical audit artifacts).

**Non-Goals:**
- Physical deletion of control or CSA records (these should remain, just unlinked from the specific sub-process).

## Decisions

### 1. Decouple rather than Delete
In `BpmService.deleteProcess`, we will update the `bpmProcessId` to `null` for all referencing records in `controls` and `csa_records`.
- **Rationale**: Controls and CSA records represent substantial work and historical data. Deleting the process (the "folder" or "context") should not necessarily wipe out the "content" if it has historical value. Setting the link to null allows the process to be deleted while preserving the audit trail.

### 2. Sequential Decoupling (Non-Transactional)
Execute the decoupling updates and the process deletion sequentially.
- **Rationale**: The `neon-http` driver used in this project does not support database transactions (`No transactions support in neon-http driver`). While transactions are preferred for atomicity, sequential execution in this specific context (deleting a process) carries a low risk of inconsistent state that would be critical, and it is the only viable path with the current infrastructure.
- **Order of Operations**:
  1. Update `controls.bpmProcessId` to null.
  2. Update `csaRecords.bpmProcessId` to null.
  3. Delete `bpm_processes`.
  This ensures that the "leaves" are decoupled before the "root" is removed, respecting the FK constraints in each step.

## Risks / Trade-offs

- **[Risk] Orphaned Records** → Controls without a `bpmProcessId` might be harder to find in the UI. Mitigation: These controls will likely appear in "Backlog" or "Unmapped" lists in the BPM Editor, which is appropriate.
