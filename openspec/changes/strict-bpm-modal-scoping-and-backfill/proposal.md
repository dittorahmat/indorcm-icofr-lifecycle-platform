## Why

When users open the BPM Modal (`BPMModal.tsx` / Execution Hub) for Sub-Process A under a specific GL Account (e.g. `1101`), controls and data belonging to other Sub-Processes (or even other GLs) frequently leak into Sub-Process A's modal.
This happens because:
1. **Leaky Fallback Filter in Frontend (`BPMModal.tsx` & `BPMWorksheet.tsx`)**:
   - `BPMModal` and `BPMWorksheet` fetch controls with an orphan fallback condition:
     ```ts
     if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
     ```
     Any historical or unlinked control on the same GL is pulled into every Sub-Process modal for that GL.
   - Name matching (`cSub === targetSub`) does not enforce GL or parent process scoping, causing cross-GL collisions when sub-processes share names (e.g. "Penerimaan Kas", "Rekonsiliasi Bank").
2. **Backend RCM TLC Matrix Bypasses GL Filter (`rcm-matrix-service.ts`)**:
   - In `getTlcMatrix`, the query condition contains:
     ```ts
     if (noGL && (!bpmProcessId || bpmProcessId === 'undefined')) {
       finalConditions = and(finalConditions, like(rcms.id, `%-${noGL}`));
     }
     ```
     If `bpmProcessId` is present, `noGL` is completely ignored! If a risk-control mapping has relationships to multiple GLs or if controls are multi-mapped, rows belonging to other GLs leak through.
3. **Unscoped ELC and ITGC in RCM Tab**:
   - In `BPMModal.tsx`, `RCMELCPage` is embedded with `<RCMELCPage embedded={true} />` without any process, FSLI, or COSO principle filter, rendering the entire organization's ELC controls.
   - `RCMITGCPage` does not filter ITGC controls down to the applications used by the sub-process.
4. **Lampiran 6 Audit Trail Log Leakage (`Lampiran6LogView.tsx`)**:
   - When matching context, it falls back to:
     ```ts
     if (!matchesContext && entityId) { matchesContext = l.entityId === entityId; }
     ```
     Because `entityId` is passed as `noGL`, any change log anywhere in that GL (including from other BPMs) leaks into this BPM modal.
5. **Legacy Database Controls with NULL `bpm_process_id`**:
   - Existing controls in PostgreSQL (Neon Tech or On-Premises VPS) may have `bpm_process_id = NULL`, which forces the frontend to keep loose fallback logic unless a backfill migration script populates them.

Eliminating these leaks ensures strict compliance with Regulation SK-5/DKU.MBU/11/2024 and prevents audit documentation contamination.

## What Changes

- **Mandatory 3-Way Hard Scoping (Year ∧ BPM Process ∧ GL)**:
  - Eliminate loose orphan fallback in `BPMModal.tsx` and `BPMWorksheet.tsx`. Controls displayed must strictly match:
    - `c.bpmProcessId === bpmProcessId` (Primary)
    - Or if matched by name, it MUST also match `c.fsliCodes.includes(noGL)` and `year`.
- **Backend RCM TLC Hard Scoping**:
  - Update `RcmMatrixService.getTlcMatrix` so that `noGL` is enforced **in addition to** `bpmProcessId`, ensuring that only risks and controls linked to the specified GL in that BPM process are returned.
- **RCM Tab Scoping (ELC & ITGC)**:
  - Scope `RCMELCPage` in embedded mode to filter by relevant COSO principles / FSLI if specified, or provide clear scoped indicators.
  - Scope `RCMITGCPage` in embedded mode to filter by the applications associated with the active BPM process / controls.
- **Strict Lampiran 6 Logs Scoping**:
  - In `Lampiran6LogView.tsx`, enforce that if `bpmProcessId` is present, logs must strictly match the process context (`bpmProcessId` or `subProcessName`), rather than opening the floodgates for all logs on that GL.
- **Dedicated Data Backfill CLI Script**:
  - Provide an idempotent standalone Node/TypeScript CLI script (`scripts/backfill-controls-bpm.ts`) with clear instructions to run on Neon Tech demo and on-premises VPS environments.
  - The script inspects controls where `bpm_process_id IS NULL`, matches them against `bpm_processes` using `sub_process`, `business_process`, and `fsli_codes` (noGL), updates `bpm_process_id`, and outputs a detailed execution report.

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Enforces strict data isolation per tab (Worksheet, Sampling, RCM TLC/ELC/ITGC, CSA, Verification, Logs) so that data from BPM modal A never leaks into BPM modal B.
- `rcm-matrix`: Enforces concurrent `bpmProcessId` AND `noGL` AND `year` filtering in `/api/rcm-matrix/tlc`.

### New Capabilities
- `controls-bpm-backfill`: Standalone migration/backfill tooling for reconciling unlinked controls to their exact `bpm_processes` record in Neon and On-Premises PostgreSQL.

## Impact

- **Frontend**:
  - `src/components/bpm/BPMModal.tsx`
  - `src/components/bpm/BPMWorksheet.tsx`
  - `src/components/bpm/TransactionSamplingTab.tsx`
  - `src/components/bpm/Lampiran6LogView.tsx`
  - `src/pages/rcm/RCMTLCPage.tsx`
  - `src/pages/rcm/RCMELCPage.tsx`
  - `src/pages/rcm/RCMITGCPage.tsx`
- **Backend API**:
  - `worker/services/rcm-matrix-service.ts`
  - `worker/routes/rcm.ts`
- **Scripts**:
  - `scripts/backfill-controls-bpm.ts`
