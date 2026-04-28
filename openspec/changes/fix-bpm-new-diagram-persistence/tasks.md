## 1. Backend Persistence Fixes

- [x] 1.1 Update `POST /api/bpm-diagrams` in `worker/user-routes.ts` to extract and save `year` and `subProcess` from the request body.
- [x] 1.2 Update `PUT /api/bpm-diagrams/:id` in `worker/user-routes.ts` to include `year` and `subProcess` in the database update operation.

## 2. Frontend Editor Fixes

- [x] 2.1 Modify the `useEffect` node hydration logic in `src/components/rcm/BPMEditor.tsx` to use `diagram.nodes?.length > 0` instead of a simple logical OR.
- [x] 2.2 Update the `saveMutation` in `src/components/rcm/BPMEditor.tsx` to include `year` and `subProcess` in the payload sent to the backend.
- [x] 2.3 Localize BPM Editor labels (Start, Activity, etc.) in `src/i18n/locales/*/bpm.json`.
- [x] 2.4 Refactor `BPMEditor.tsx` to use `t()` for all hardcoded node and action labels.

## 3. Database & Verification

- [x] 3.1 Generate Drizzle migration using `npx drizzle-kit generate`.
- [x] 3.2 Apply migration if pending changes are detected.
- [x] 3.3 Create a new diagram from the BPM Page and verify it is successfully saved with the correct year.
- [x] 3.4 Confirm that the new diagram correctly renders the default "Mulai" (Start) node upon first open.
- [x] 3.5 Verify that the "Unsaved Changes" dialog appears when navigating away with modifications.
