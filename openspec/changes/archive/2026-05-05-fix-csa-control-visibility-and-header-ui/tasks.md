## 1. Backend Data Integrity Fixes

- [x] 1.1 Update `PUT /api/bpm-diagrams/:id` to resolve `bpmProcessId` by matching Sub-Process name case-insensitively.
- [x] 1.2 Inject resolved `bpmProcessId` and `fsliCodes` into all control upsert operations in the same route.
- [x] 1.3 Ensure the lookup uses `LOWER()` in SQL to be robust against text casing.

## 2. Frontend Filtering & Visibility

- [x] 2.1 Implement additive filtering in `BPMModal.tsx` (ID OR Name OR Account) with `.trim()` and lowercase matching.
- [x] 2.2 Implement additive filtering in `CSAModal.tsx` (ID OR Name OR Account) with `.trim()` and lowercase matching.
- [x] 2.3 Implement additive filtering in `BPMWorksheet.tsx` (ID OR Name OR Account) with `.trim()` and lowercase matching.
- [x] 2.4 Fix `setSelectedHubProcess` typo and state initialization in `TodoListPage.tsx`.

## 3. Execution Hub Header Refactor

- [x] 3.1 Restructure `BPMModal` header to make Sub-Process name the primary title.
- [x] 3.2 Display GL Code and FSLI Name as secondary metadata with clear visual separation.
- [x] 3.3 Ensure the Sub-Process name is correctly passed from parent pages (`BPMPage`, `TodoListPage`).

## 4. Verification

- [x] 4.1 Verify that controls for "Penerimaan Setoran Tunai" (or any mixed case) appear in both Worksheet and Assessment tabs.
- [x] 4.2 Verify that clicking "Save" in the Visual Editor fixes orphaned data in the database.
