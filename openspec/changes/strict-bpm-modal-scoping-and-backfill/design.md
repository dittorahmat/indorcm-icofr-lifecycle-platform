## Context

In IndoGRC Pro, `BPMModal.tsx` functions as the unified "Execution Hub" for a specific sub-process under an account GL. Users report that when opening BPM Modal for Sub-Process A, controls, matrix rows, or logs from Sub-Process B (under the same GL or sharing similar names) bleed into Modal A.

We need a complete isolation design covering:
1. Frontend filter synchronization across all modal tabs.
2. Backend query constraint fixes (`rcm-matrix-service.ts`).
3. An idempotent, robust data backfill script executable on both Neon Tech (cloud) and On-Premises VPS PostgreSQL.

---

## Technical Design & Decisions

### 1. Frontend Scoping Architecture in `BPMModal.tsx`

Every tab must receive and enforce the triple-composite key:
`(workingYear, bpmProcessId, noGL)`

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BPM Modal Context                               │
│           (year: 2026, bpmProcessId: "PROC-1", noGL: "1101")           │
├───────────────────┬────────────────────────────────────────────────────┤
│ Tab               │ Exact Filter Applied                               │
├───────────────────┼────────────────────────────────────────────────────┤
│ Worksheet         │ c.year == year &&                                  │
│                   │ (c.bpmProcessId == bpmProcessId ||                 │
│                   │  (c.subProcess == name && c.fsliCodes.has(noGL)))  │
│                   │ [ELIMINATE: orphan fallback based on noGL alone]   │
├───────────────────┼────────────────────────────────────────────────────┤
│ Sampling          │ transYear == year && bpmProcessId == bpmProcessId   │
│                   │ && noGL == noGL                                    │
├───────────────────┼────────────────────────────────────────────────────┤
│ RCM TLC           │ query: ?year=...&bpmProcessId=...&noGL=...         │
│                   │ backend ANDs all 3 filters                         │
├───────────────────┼────────────────────────────────────────────────────┤
│ RCM ELC           │ Filter ELC by FSLI / relevant COSO Principles      │
├───────────────────┼────────────────────────────────────────────────────┤
│ RCM ITGC          │ Filter ITGC by applications tied to this process   │
├───────────────────┼────────────────────────────────────────────────────┤
│ CSA               │ Inherits strictly filtered controls from BPMModal  │
├───────────────────┼────────────────────────────────────────────────────┤
│ Verification      │ query: ?year=...&bpmProcessId=...&noGL=...         │
├───────────────────┼────────────────────────────────────────────────────┤
│ Lampiran 6 Logs   │ Must match bpmProcessId OR (entityId == noGL &&    │
│                   │ subProcess == targetSubProcess)                    │
└───────────────────┴────────────────────────────────────────────────────┘
```

#### Decision: Disabling Orphan Fallback
Currently, in `BPMModal.tsx` (L121) and `BPMWorksheet.tsx` (L126):
```ts
// REMOVE THIS DANGEROUS FALLBACK:
if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
```
If a control has no `bpmProcessId` and no `subProcess`, it must NOT be rendered in a specific sub-process modal. It should be repaired via the backfill script or assigned properly in the RCM manager.

---

### 2. Backend TLC Matrix Scoping (`worker/services/rcm-matrix-service.ts`)

In `RcmMatrixService.getTlcMatrix`:
Currently lines 101-103:
```ts
if (noGL && (!bpmProcessId || bpmProcessId === 'undefined')) {
  finalConditions = and(finalConditions, like(rcms.id, `%-${noGL}`)) as any;
}
```
**Fix**:
Change the condition so that when `noGL` is passed, it is ALWAYS enforced, whether `bpmProcessId` is present or not:
```ts
if (noGL) {
  finalConditions = and(
    finalConditions, 
    or(
      like(rcms.id, `%-${noGL}`),
      sql`${controls.fsliCodes}::jsonb ? ${noGL}`
    )
  ) as any;
}
```
This guarantees that even if `bpmProcessId` is supplied, rows belonging to other GLs are pruned.

---

### 3. RCM Tab (ELC & ITGC) Scoping

1. **RCM ELC**:
   - `RCMELCPage` will accept `embedded={true}` with `relevantFsli={fsliName}` and `relevantControls={controls}`.
   - It filters ELC rows that are mapped or relevant to the current business process / FSLI, or provides an active indicator that ELC principles apply company-wide to this FSLI.
2. **RCM ITGC**:
   - `RCMITGCPage` receives `relevantAppIds` derived from the active BPM process's controls.
   - It filters the ITGC matrix to only show applications supporting the active sub-process.

---

### 4. Lampiran 6 Logs Scoping (`Lampiran6LogView.tsx`)

In `Lampiran6LogView`:
```ts
// STRICT CONTEXT LOGIC:
let matchesContext = false;
if (bpmProcessId && (logProcessId === bpmProcessId || l.entityId === bpmProcessId)) {
  matchesContext = true;
} else if (targetSub && logSub === targetSub) {
  // If matching by sub-process name, it must also belong to the current entityId/noGL
  matchesContext = (!entityId || l.entityId === entityId || dAfter?.noGL === entityId);
}
```
Eliminate the blanket `if (!matchesContext && entityId) matchesContext = (l.entityId === entityId);` so other sub-processes' changes don't bleed in.

---

### 5. Data Backfill Script Design (`scripts/backfill-controls-bpm.ts`)

#### How the Backfill Works
The script connects to the target database via `DATABASE_URL` (supporting both Neon connection strings and on-premise PostgreSQL URLs: `postgresql://user:password@host:port/dbname`).

**Matching Algorithm**:
1. Query all controls where `bpm_process_id IS NULL`.
2. For each control:
   - Match 1 (High Confidence): Match against `bpm_processes` where `LOWER(TRIM(bpm_processes.name)) = LOWER(TRIM(controls.sub_process))` AND `bpm_processes.organization_id = controls.organization_id` AND (`controls.fsli_codes` contains `bpm_processes.no_gl` OR `bpm_processes.no_gl` matches).
   - Match 2 (Medium Confidence): If only one `bpm_processes` exists in the organization with matching `sub_process` name and matching `year`.
   - Match 3: If control is linked to an `rcm_controls` row that links to `rcms` that links to `bpm_node_rcms` -> `bpm_diagrams` -> `bpm_processes`.
3. Perform dry-run first by default (`--dry-run`), showing matched vs unmatched count.
4. Execute `UPDATE controls SET bpm_process_id = ...` in a transaction when `--apply` flag is passed.

#### How to Run (Neon Tech vs On-Premises VPS)

**On Neon Tech / Local Development:**
```bash
# Dry run
npx tsx scripts/backfill-controls-bpm.ts --dry-run

# Apply backfill
npx tsx scripts/backfill-controls-bpm.ts --apply
```

**On On-Premises VPS:**
```bash
# 1. Export target on-premise database URL
export DATABASE_URL="postgresql://icofr_user:StrongPassword@127.0.0.1:5432/indorcm_db?sslmode=disable"

# 2. Run dry run to verify matches
npx tsx scripts/backfill-controls-bpm.ts --dry-run

# 3. Apply changes with commit log
npx tsx scripts/backfill-controls-bpm.ts --apply
```

---

## Risks / Trade-offs

- **Risk**: Some very old controls might have neither `sub_process` nor matching `noGL`, remaining `NULL`.
  - **Mitigation**: The backfill script outputs an `unmatched_controls.json` report containing control IDs and codes so compliance admins can review and map them via the RCM Manager UI.
- **Risk**: Standalone pages (`/rcm/tlc`, `/rcm/itgc`, `/rcm/elc`) accessed from sidebar might get over-filtered.
  - **Mitigation**: Scoping filters are only active when `embedded={true}` or when query parameters (`filterBpmId`, `noGLFilter`) are explicitly provided.
