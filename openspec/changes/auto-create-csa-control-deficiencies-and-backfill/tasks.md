# Tasks

## 1. Deficiency Deduplication & Service Enhancement

- [x] 1.1 Update `DeficiencyService.createAutoDeficiency` deduplication query in `worker/services/deficiency-service.ts` to strictly scope by `(organizationId, controlId, period, status = 'Open')` and verify with unit tests.
- [x] 1.2 Update `CsaDomainService.saveCsaRecord` in `worker/services/csa-domain-service.ts` to parse `body.samples`, collect distinct failed control IDs (`implemented === false`), and trigger `createAutoDeficiency` per failed control.
- [x] 1.3 Update Line 2 validation flow in `worker/routes/csa.ts` to support multi-control CSA records during workflow transitions.

## 2. Historical Data Backfill

- [x] 2.1 Create an idempotent backfill script `worker/scripts/backfill-csa-deficiencies.ts` to scan existing Ineffective CSA records without control IDs and insert missing deficiencies and action plans.
- [x] 2.2 Run the backfill script against local PostgreSQL database and verify that 3 deficiencies are generated for the October 1, 2026 CSA record (`Persetujuan Kredit`).

## 3. Verification & Compliance Validation

- [x] 3.1 Run automated backend and frontend test suite (`npm test`) to ensure no regressions across CSA and deficiency modules.
- [x] 3.2 Verify type integrity and build (`npm run type-check` and `npm run build`).
- [x] 3.3 Confirm visual appearance of the backfilled deficiencies on the Deficiency Kanban Board (`/deficiencies`) under the "Ineffective" column with source "Lini 1 - CSA".
