## 1. Database Schema

- [x] 1.1 Add `bpmProcessGlCodes` junction table to `worker/db/schema.ts` and export it.
- [x] 1.2 Generate and run drizzle migrations to apply the database schema update.

## 2. Backend Services & Routes

- [x] 2.1 Update `getDiagramById` in `worker/services/bpm-service.ts` to retrieve and return associated `noGLs` from the junction table.
- [x] 2.2 Update `updateDiagram` in `worker/services/bpm-service.ts` to parse `noGLs: string[]` from the body and sync them inside `bpm_process_gl_codes`.
- [x] 2.3 Update `getAllProcesses` in `worker/services/bpm-service.ts` to filter processes using the junction table so they are returned when querying any associated GL code.
- [x] 2.4 Update the TLC Matrix routing in `worker/routes/rcm.ts` to resolve `account_assertions` using the context's target GL code instead of relying on `bpmProcesses.noGL`.

## 3. Frontend Implementation

- [x] 3.1 Update `BPMEditor` in `src/components/rcm/BPMEditor.tsx` to accept a `currentGL?: string` prop.
- [x] 3.2 Pass the active `selectedGLRow.noGL` to `<BPMEditor>` in `src/pages/bpm/BPMPage.tsx`.
- [x] 3.3 Add a popover to the `BPMEditor` toolbar containing a searchable `<MultiSelect>` checkbox list of GL accounts.
- [x] 3.4 Prefill the `<MultiSelect>` selection with saved GL codes or fallback to `currentGL` if it's a new diagram.
- [x] 3.5 Modify `saveMutation` in `BPMEditor.tsx` to send the selected GL codes in the diagram update payload.

## 4. Verification

- [x] 4.1 Run TypeScript verification: `npm run type-check`.
- [x] 4.2 Run ESLint check: `npm run lint`.
- [x] 4.3 Verify build compiles successfully: `npm run build`.

## 5. RCM Instantiation per GL Code

- [x] 5.1 Extract base ID from risk and control IDs in `syncRisksAndControlsFromNodes` to prevent repeating suffixes.
- [x] 5.2 Loop through all associated GL codes (`noGLs`) to create GL-suffixed records in `rcms`, `controls`, and `rcm_controls` when syncing.
- [x] 5.3 Filter diagram node hydration in `getDiagramById` and `getDiagramByGL` using `noGL` so that the frontend loads only target GL data.
- [x] 5.4 Update process summary counts using unique base IDs to reflect visual nodes in diagram.
- [x] 5.5 Filter the TLC matrix query by GL code suffix.
