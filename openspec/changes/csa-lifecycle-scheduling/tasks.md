## 1. Database & Schema

- [x] 1.1 Create table `csa_schedules` in `worker/db/schema.ts` with recurring support
- [x] 1.2 Refactor `csa_samples` schema to use JSONB `controlResults` and link to `gl_rows.id`
- [x] 1.3 Add `bpmCode` (free-text human readable ID) to `bpm_processes` table
- [x] 1.4 Generate and run Drizzle migration (`npx drizzle-kit push`)

## 2. API & Backend Implementation

- [x] 2.1 Implement CRUD endpoints for `csa_schedules` in worker
- [x] 2.4 Implement recurring generation logic in `POST /api/csa/schedules` (Fixed)
- [x] 2.2 Update `POST /api/csa` to process aggregate sub-process assessment data
- [x] 2.3 Update `GET /api/gl-rows` to support filtering by Sub-Process/GL for sampling

## 3. Todo List & Calendar Dashboard

- [x] 3.1 Create `src/pages/csa/TodoListPage.tsx` using a calendar component
- [x] 3.2 Implement status indicators (Not Started, Started, Overdue) on calendar dates
- [x] 3.3 Add "Set Jadwal" wizard for Line 1 managers to define pengujian windows
- [x] 3.4 Integrate sidebar menu for "To-do List" and update "CSA" to "CSA Reports"
- [x] 3.5 Fix "Buka Execution Hub" button logic in Todo List (Fixed)

## 4. Execution Hub (BPM Modal Transformation)

- [x] 4.1 Refactor `src/components/bpm/BPMModal.tsx` to use Radix Tabs
- [x] 4.2 Implement **Worksheet Tab**: Free-text control description editor with BPM Code field
- [x] 4.3 Implement **Detail Transaksi Tab**: GL/Journal table with multi-select sampling logic
- [x] 4.4 Implement **CSA Assessment Tab**: Horizontal multi-control table with auto-population from sampling
- [x] 4.5 Implement **RCM Matrix Tab**: Filtered view of `RCMELCPage`, `RCMTLCPage`, and `RCMITGCPage`
- [x] 4.6 Implement **Lampiran 6 Tab**: Automated change log for sub-process modifications

## 5. Localization, UX & Compliance

- [x] 5.1 Create `src/i18n/locales/{en,id}/csa_hub.json` for new технические terms
- [x] 5.2 Integrate `useUnsavedChanges` hook across all Execution Hub tabs
- [x] 5.3 Implement Zero Tolerance Aggregate logic (Proposal status "Ineffective" if any ❌)
- [x] 5.4 Implement evidence count validation (Total = Controls x Samples)
- [x] 5.5 Optimize CSA workflow by removing the intermediate gate (Gas Pol)

## 6. Finalization & Cleanup

- [x] 6.1 Update `src/pages/csa/CSAPage.tsx` to only display signed-off PDF reports/history
- [x] 6.2 Implement aggregate biometric sign-off for the entire sub-process session
- [x] 6.3 Run verification tests for the new "One Sample, Many Controls" workflow
