## 1. Backend Schema & Migration

- [x] 1.1 Add `standardTestProcedure` to `bpmProcesses` in `worker/db/schema.ts`.
- [x] 1.2 Add `testProcedure` and `archiveLocation` to `csaRecords` in `worker/db/schema.ts`.
- [x] 1.3 Update `POST /api/csa` and `GET /api/bpm-processes` routes to handle new fields.
- [x] 1.4 Run `npx drizzle-kit push` to sync database schema.

## 2. Master Data UI (Templates)

- [x] 2.1 Update BPM Worksheet or Process Editor to include "Standard Test Procedure" text area.
- [x] 2.2 Implement auto-population logic in `CSATabContent.tsx` to fetch procedure from process master.

## 3. CSA Assessment UI Expansion

- [x] 3.1 Add `testProcedure` (textarea) and `archiveLocation` (input) fields to `CSATabContent.tsx` form.
- [x] 3.2 Ensure new fields are integrated with `useForm` and saved during draft/final submission.
- [x] 3.3 Apply `UnsavedChangesDialog` consistency to the updated CSA form.

## 4. Reporting & PDF Export (Lampiran 7a)

- [x] 4.1 Create branded header component for reports (contek `BPMCanvasHeader`).
- [x] 4.2 Create `Appendix7aDetailed` print component with formal regulatory layout.
- [x] 4.3 Create `Appendix7aSummary` print component for aggregated effectiveness view.
- [x] 4.4 Add "Export Appendix 7a" dropdown button in `CSATabContent.tsx` with layout options.
- [x] 4.5 Integrate QR code placeholder for document verification in the PDF footer.

## 5. Safety & Localization

- [x] 5.1 Update `@src/i18n/` (ID/EN) with labels for procedures, archive location, and export actions.
- [x] 5.2 Perform full type check (`npx tsc --noEmit`) and fix any regressions.
- [x] 5.3 Run `npm run build` to verify production readiness and chunk optimization.

## 6. Verification

- [ ] 6.1 Verify that standard procedures auto-populate correctly for new assessments.
- [ ] 6.2 Confirm that Company Logo and Name appear correctly in the report headers.
- [ ] 6.3 Confirm that Detailed PDF matches the regulatory sample matrix format.
- [ ] 6.4 Confirm that Summary PDF correctly aggregates results per control.
