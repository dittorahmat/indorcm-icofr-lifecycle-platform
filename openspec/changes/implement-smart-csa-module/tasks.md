## 1. Database & Type Definitions

- [x] 1.1 Update `shared/types.ts` with `CSATestSample` and updated `CSARecord` interfaces.
- [x] 1.2 Define new tables `csa_records` and `csa_samples` in `worker/db/schema.ts` (or equivalent).
- [x] 1.3 Generate Drizzle migrations: `bun run drizzle-kit generate`.
- [x] 1.4 Push migrations to Neon database: `bun run drizzle-kit push`.

## 2. API Development (Worker)

- [x] 2.1 Implement CRUD endpoints for `CSARecord` (GET list, POST create, GET detail).
- [x] 2.2 Implement backend logic for dynamic sample insertion/update.
- [x] 2.3 Implement Audit Trail logging for CSA sign-off.
- [x] 2.4 Implement PDF generation endpoint `/api/csa/:id/export-pdf` using `jspdf` or similar.

## 3. Frontend: Components & Logic

- [x] 3.1 Create `CSAListTable` component to show historical CSA records in `CSATabContent.tsx`.
- [x] 3.2 Create `Lampiran7Form` component with `react-hook-form` and `useFieldArray`.
- [x] 3.3 Implement Smart UI logic to toggle between Manual (Attributes A-D) and ITAC columns.
- [x] 3.4 Implement "Zero Tolerance" validation logic (A/B/C/D failure -> Ineffective suggestion).
- [x] 3.5 Integrate `sonner` toasts for success/error notifications.

## 4. I18n & Localization

- [x] 4.1 Update `src/i18n/locales/en/bpm.json` and `id/bpm.json` with CSA-specific keys (headers, labels, messages).
- [x] 4.2 Update `common.json` for general action buttons (Add Sample, Print PDF).

## 5. Verification & Testing

- [x] 5.1 Verify that creating a Manual CSA correctly displays A, B, C, D columns.
- [x] 5.2 Verify that creating an ITAC CSA correctly displays ITAC-specific columns.
- [x] 5.3 Verify that PDF Export produces a file matching Lampiran 7 format.
- [x] 5.4 Verify that sign-off creates an Audit Trail entry.
