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
- [/] 3.2 Create `Lampiran7Form` component with `react-hook-form` and `useFieldArray` (Needs update for dynamic questions).
- [ ] 3.6 Implement **BPM Gate Confirmation** modal/step before CSA form access.
- [ ] 3.7 Implement **Frequency Validation Engine** based on Table 22 (Min samples check).
- [ ] 3.8 Implement **Hard-Lock UI Logic**: Disable "Effective" conclusion if any sample fails.
- [ ] 3.9 Implement **Dynamic Attr Labels**: Pull labels from `control.attributeQuestions`.

## 4. I18n & Localization

- [/] 4.1 Update `src/i18n/locales/en/bpm.json` and `id/bpm.json` with CSA-specific keys (headers, labels, messages) - (Updated for Smart Logic).
- [x] 4.2 Update `common.json` for general action buttons (Add Sample, Print PDF).

## 5. Verification & Testing

- [x] 5.1 Verify that creating a Manual CSA correctly displays A, B, C, D columns.
- [x] 5.2 Verify that creating an ITAC CSA correctly displays ITAC-specific columns.
- [x] 5.3 Verify that PDF Export produces a file matching Lampiran 7 format.
- [x] 5.4 Verify that sign-off creates an Audit Trail entry.
