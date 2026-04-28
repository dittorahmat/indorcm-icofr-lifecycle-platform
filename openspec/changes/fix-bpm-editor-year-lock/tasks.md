## 1. Database & Backend Alignment

- [x] 1.1 Verify `bpm_diagrams` table schema in `worker/db/schema.ts` (ensure `year` and `subProcess` are present).
- [x] 1.2 Update `POST /api/bpm-diagrams` handler in `worker/user-routes.ts` to accept and persist `year` and `subProcess`.
- [x] 1.3 Update `PUT /api/bpm-diagrams/:id` handler in `worker/user-routes.ts` to ensure `year` and `subProcess` are maintained.
- [x] 1.4 Generate and run Drizzle migrations if schema changes are required. (Verified: No schema changes needed)

## 2. Frontend Prop & Context Integration

- [x] 2.1 Update `BPMEditorProps` in `src/components/rcm/BPMEditor.tsx` to include `workingYear: string`.
- [x] 2.2 In `src/pages/bpm/BPMPage.tsx`, pass the `viewYear` state as the `workingYear` prop to the `BPMEditor`.
- [x] 2.3 Update the `saveMutation` in `BPMEditor.tsx` to include `year` and `subProcess` in the request body.

## 3. Dynamic Locking Logic

- [x] 3.1 In `BPMEditor.tsx`, ensure the `settings` query is available for the `isPeriodLocked` check.
- [x] 3.2 Refactor `isLocked` in `BPMEditor.tsx` to use `workingYear` and `settings.isPeriodLocked` instead of the system clock.
- [x] 3.3 Update `useEffect` node hydration in `BPMEditor.tsx` to handle localization for initial nodes properly.

## 4. Localization & UX Refinements

- [x] 4.1 Add/Update translations in `src/i18n/locales/*/bpm.json` for "LOCKED", "Audit Baseline", and all node type labels.
- [x] 4.2 Integrate `useUnsavedChanges` hook in `BPMEditor.tsx` to track `isDirty` state.
- [x] 4.3 Ensure `UnsavedChangesDialog` is rendered and logic is bypassed if `isLocked` is true.

## 5. Verification & Testing

- [x] 5.1 Verify that a 2025 diagram can be saved when `viewYear` is set to 2025.
- [x] 5.2 Verify that a 2025 diagram is locked (Read-Only) when `viewYear` is set to 2026.
- [x] 5.3 Verify that newly created diagrams correctly appear in the filtered process list for the selected year.
