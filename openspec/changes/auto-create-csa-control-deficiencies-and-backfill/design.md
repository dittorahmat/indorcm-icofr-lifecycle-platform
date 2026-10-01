# Design

## Context

See `proposal.md` for motivation and background.

Currently:
1. In `CsaDomainService.saveCsaRecord`, when a CSA form is submitted with `result = 'Ineffective'`, it calls `DeficiencyService.createAutoDeficiency` passing `controlId: newCsa.controlId`. For BPM-level assessments, `newCsa.controlId` is `null` because controls are evaluated inside `body.samples[].controlResults`.
2. `DeficiencyService.createAutoDeficiency` deduplicates with `sql`description LIKE ${`%${period}%`}`` and `controlId ? eq(deficiencies.controlId, controlId) : sql`TRUE``. When `controlId` is null, any existing open deficiency with the same period stops a new deficiency from being created.
3. In `worker/routes/csa.ts` line 144, workflow sign-off checks `if (csaRecord.result === 'Ineffective' && csaRecord.controlId)`, skipping auto-deficiency creation entirely for BPM-level records.

## Goals / Non-Goals

**Goals:**
- Extract all failed controls (`implemented === false`) from `body.samples` upon submitting an Ineffective CSA in `CsaDomainService.saveCsaRecord`.
- Call `createAutoDeficiency` for every distinct failed control ID, with a clear description referencing the control code and name.
- Fallback to process-level deficiency if no failed control keys can be extracted from sample items.
- Fix deduplication in `DeficiencyService.createAutoDeficiency` to compare `(organizationId, controlId, period)` specifically.
- Provide an idempotent standalone backfill script and API route to backfill existing Ineffective CSA records without control deficiencies into `deficiencies` and `action_plans`.

**Non-Goals:**
- Modifying UI Kanban drag-and-drop mechanics or column configurations.
- Altering the CSA sampling structure or data schema in `csa_records` and `csa_samples`.

## Decisions

### 1. Granular Control Extraction & Card Representation (Option B: BPM-Centric Single Card)
- **Decision**: In `saveCsaRecord`, inspect `body.samples` when `newCsa.result === 'Ineffective'` to collect all failed control IDs (`implemented === false`), then generate **exactly ONE consolidated deficiency card** for the BPM sub-process, explicitly enumerating all failed controls in the description:
  > `Hasil CSA Ineffective untuk proses [Nama Sub-Proses (No GL)] (periode [Period]). Kontrol gagal: CTRL-001, CTRL-002, ...`
- **Architectural Consideration & Rationale (Option B vs Option A)**:
  - *Option A (Control-Centric Multiple Cards)*: Generates a separate Kanban card for every failed control. While granular for multi-team assignments, it severely pollutes and clutters the Deficiency Kanban board when a single business process assessment fails across 3-5 controls simultaneously.
  - *Option B (BPM-Centric Single Card - Selected)*: Keeps the Deficiency Board clean, actionable, and aligned with **Process Ownership**. The Process Owner oversees the remediation of the sub-process holistically. During retesting, the tester opens the full BPM evaluation sheet (`CSATabContent`) where all controls and transaction samples remain visible in context.
- **Alternative considered**: Option A was initially considered, but deliberately replaced with Option B to avoid board clutter and keep retesting synchronized across the process.

### 2. Scoped Deduplication in `DeficiencyService`
- **Decision**: Differentiate between control-specific deficiencies and process-level deficiencies in the SQL query:
  ```typescript
  const conditions = [
    eq(deficiencies.organizationId, organizationId),
    sql`description LIKE ${`%${period}%`}`,
    eq(deficiencies.status, 'Open')
  ];
  if (controlId) {
    conditions.push(eq(deficiencies.controlId, controlId));
  } else {
    conditions.push(sql`${deficiencies.controlId} IS NULL`);
  }
  ```
- **Rationale**: Prevents a control-specific deficiency from colliding with a null-control deficiency, and prevents control A from blocking control B in the same period.

### 3. Idempotent Data Backfill
- **Decision**: Implement a backfill function that iterates through `csa_records` with `result = 'Ineffective'`, joins `csa_samples`, and creates a consolidated deficiency per ineffective BPM record with the failed control codes listed.
- **Rationale**: Idempotency is naturally preserved by `createAutoDeficiency`'s duplicate check. Existing remediated or open items will not be duplicated.

## Risks / Trade-offs

- **[Trade-off] Single PIC on Kanban Card vs Multiple Control Specialists**:
  → *Mitigation*: The Action Plan is owned by the Sub-Process Owner (e.g. Unit Manager / Kepala Divisi terkait), while the specific failed controls are clearly enumerated in the card description so each specialist knows their required corrective action before retesting.
- **[Risk] High volume of deficiencies if many controls fail across multiple samples**:
  → *Mitigation*: Option B directly eliminates this risk by consolidating all failed controls of the assessment session into a single trackable card.

## Migration Plan

1. Deploy code changes to `worker/services/csa-domain-service.ts` and `worker/services/deficiency-service.ts`.
2. Run database backfill migration script via node/tsx CLI command.
3. Validate that the October 1, 2026 CSA record (`6a6e5236-...`) generates 3 distinct open deficiencies in the `Ineffective` column of `/deficiencies`.
