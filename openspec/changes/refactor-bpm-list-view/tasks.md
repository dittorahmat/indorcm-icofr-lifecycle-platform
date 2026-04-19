# Tasks: Refactor BPM List View

## 1. Infrastructure & Types
- [x] 1.1 Update `shared/types.ts`: Add `riskCount` and `controlCount` to `BPMProcess`.
- [x] 1.2 Update `shared/types.ts`: Ensure `Control` interface includes `bpmProcessId`.
- [x] 1.3 Update `worker/db/schema.ts`: Add `bpmProcessId` to the `controls` table.
- [x] 1.4 Generate and apply migration for `controls.bpmProcessId`.

## 2. Backend API Refactor
- [x] 2.1 Update `worker/user-routes.ts` (GET /api/bpm-processes): Implement SQL LEFT JOIN with `controls` and aggregate counts.
- [x] 2.2 Update `worker/user-routes.ts` (POST /api/controls): Explicitly handle and save `bpmProcessId` from request body.
- [x] 2.3 Update `worker/user-routes.ts` (PUT /api/controls): Ensure `bpmProcessId` can be updated if necessary.

## 3. Frontend UI Implementation
- [x] 3.1 Update `src/pages/bpm/BPMPage.tsx`:
  - [x] Add `searchTerm` state and `<Input />` for searching sub-processes.
  - [x] Replace cards/buttons with `<Table />` component.
  - [x] Implement table columns: Action (Open Modal), Sub Process, Perusahaan, Lokasi, Risk Count, Control Count.
  - [x] Reposition "Create BPM" button to the header of the table.
- [x] 3.2 Update `src/components/bpm/BPMWorksheet.tsx`:
  - [x] Ensure that existing rows correctly link to `bpmProcessId` and that filters are consistent.
  - [x] Verify that adding a new row uses the current `bpmProcessId`.

## 4. Verification & Testing
- [x] 4.1 Create a new BPM and verify it appears in the table.
- [x] 4.2 Add several rows to the worksheet and verify "Risk" and "Control" counts update in the main table.
- [x] 4.3 Test the search bar functionality within a GL account.
- [x] 4.4 Verify metadata (Perusahaan/Lokasi) is correctly derived from the selected GL account.
