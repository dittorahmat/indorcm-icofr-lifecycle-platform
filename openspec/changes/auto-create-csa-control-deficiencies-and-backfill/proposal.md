# Proposal

## Why

When Control Self-Assessments (CSA) are submitted with result `Ineffective` at the Business Process Model (BPM) level (such as "Persetujuan Kredit"), the record in `csa_records` has `control_id = null` because multiple controls are assessed across sample transactions. Under the current implementation, `createAutoDeficiency` is invoked with `controlId = null` and a generic description, causing the duplicate detector to match pre-existing remediated/in-progress deficiencies for the same period (e.g. `2025-Q1`) and fail to register deficiencies for the specific controls that failed testing. Consequently, failed controls do not appear on the Deficiency Kanban Board.

Fixing this now ensures full regulatory alignment with Regulation SK-5/DKU.MBU/11/2024, guarantees immediate visibility of all failed controls across Line 1 and Line 2, and resolves existing orphaned ineffective CSA records through an automated backfill.

## What Changes

- **Per-Control Deficiency Generation**: When a BPM-level CSA record is submitted as `Ineffective`, parse all samples in `csa_samples` to identify every distinct control where `implemented === false`. Automatically generate a discrete deficiency and accompanying draft action plan for each failed control.
- **Accurate Duplicate Detection**: Enhance `DeficiencyService.createAutoDeficiency` deduplication logic so that when `controlId` is specified, it scopes deduplication strictly to `(organizationId, controlId, period, status = 'Open')` and does not collide with records having `controlId = null` or different controls.
- **Historical Data Backfill**: Create a dedicated idempotent backfill migration script/routine that scans historical `csa_records` where `result = 'Ineffective'` and `control_id IS NULL`, identifies failed controls from their `csa_samples`, and populates missing deficiencies and action plans so they appear in the Deficiency Board.

## Capabilities

### Modified Capabilities
- `csa-management`: Update CSA assessment submission behavior to automatically extract and record individual deficiencies for every failed control in the assessment samples.
- `remediation-tracking`: Guarantee that control-level deficiencies spawned from Line 1 CSA assessments are linked with their control IDs, formatted descriptions, and initialized into the `Ineffective` Kanban column with valid action plans.

## Impact

- **Backend**:
  - `worker/services/csa-domain-service.ts`: Update `saveCsaRecord` to detect failed controls from `body.samples` and invoke `createAutoDeficiency` for each failed control.
  - `worker/services/deficiency-service.ts`: Improve duplicate detection query for open deficiencies.
  - `worker/routes/csa.ts`: Align Line 2 validation workflow for multi-control CSA records.
- **Database / Migration**:
  - Script to backfill deficiencies and action plans for existing Ineffective CSA records (including October 1, 2026 data on BPM "Persetujuan Kredit").
- **Frontend**:
  - `src/pages/deficiencies/DeficiencyBoard.tsx`: Verified to seamlessly reflect the newly backfilled and runtime-generated deficiencies grouped under source "Lini 1 - CSA".
