## 1. Backend Verification Design & RCM Scoping

- [x] 1.1 In `worker/routes/rcm.ts`, accept both `bpmProcessId` and `bpmId` in `/rcm-matrix/verification-design`, pass `year` and optional `noGL` to filter `rcmControls`, and verify with `npm run test` or type-check.
- [x] 1.2 In `worker/routes/rcm.ts`, ensure `/rcm-matrix/tlc` passes `noGL` from `c.req.query('noGL')` to `matrixService.getTlcMatrix`, and `/rcm-matrix/itgc` passes `year` properly.
- [x] 1.3 In `worker/routes/controls.ts`, ensure `/controls` endpoint supports filtering by fiscal year when `year` parameter is provided.

## 2. Frontend Verification Design & RCM Tab Alignment

- [x] 2.1 In `src/pages/rcm/VerificationDesignPage.tsx`, update query param to send `bpmProcessId=${filterBpmId}`, accept `workingYear` prop, pass it to the query key and URL, and verify the correct URL is queried in embedded mode.
- [x] 2.2 In `src/pages/rcm/RCMTLCPage.tsx`, add `noGLFilter` prop and propagate it to `/api/rcm-matrix/tlc?year=...&bpmProcessId=...&noGL=...`.
- [x] 2.3 In `src/pages/rcm/RCMITGCPage.tsx`, accept `workingYear` prop and send `year` parameter in `/api/rcm-matrix/itgc`.

## 3. Frontend BPM Worksheet & Modal Context Propagation

- [x] 3.1 In `src/components/bpm/BPMWorksheet.tsx`, include `workingYear` in the query key and API request for controls, filtering controls matching the active fiscal year.
- [x] 3.2 In `src/components/bpm/BPMModal.tsx`, propagate `year` and `noGL` to `<VerificationDesignPage>`, `<RCMTLCPage>`, `<RCMITGCPage>`, and `<Lampiran6LogView>`.
- [x] 3.3 In `src/components/bpm/Lampiran6LogView.tsx`, optionally filter logs by fiscal year and/or sub-process context.

## 4. Verification & Quality Assurance

- [x] 4.1 Run `npm run type-check` and verify zero TypeScript errors.
- [x] 4.2 Run `npm run lint` and verify code hygiene.
- [x] 4.3 Run `npm test` to verify no regression across unit and integration tests.
