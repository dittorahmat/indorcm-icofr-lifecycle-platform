## 1. Database & Backend Implementation

- [x] 1.1 Update `updateDiagramMetadata` inside `worker/services/bpm-service.ts` to update and save the `metadata` column in the `bpmDiagrams` table.
- [x] 1.2 Run TS compile / build test to verify type safety in backend changes.

## 2. Localization Locales

- [x] 2.1 Add signature placeholder translations under a new `editor.signatures` path in `src/i18n/locales/en/bpm.json`.
- [x] 2.2 Add Indonesian translations in `src/i18n/locales/id/bpm.json`.

## 3. Frontend Component Updates

- [x] 3.1 Modify `BPMCanvasFooter` inside `src/components/rcm/nodes/BPMCanvasLayout.tsx` to take custom signatures as props (`signatures` object and `onChangeSignature` callback).
- [x] 3.2 Implement text inputs for "Nama" and "Tgl/Sign" fields inside `BPMCanvasFooter` with CSS classes to hide borders and backgrounds when printing/exporting.
- [x] 3.3 Add state management for signatures in `BPMEditor.tsx` with a `useEffect` hook executing the hybrid defaulting logic (overrides $\rightarrow$ workflowHistory $\rightarrow$ diagram creator).
- [x] 3.4 Update the diagram save mutation inside `BPMEditor.tsx` to include the `metadata` payload containing signatures overrides.

## 4. Verification

- [x] 4.1 Perform type checking with `npm run type-check`.
- [x] 4.2 Run ESLint check with `npm run lint`.
- [x] 4.3 Build application using `npm run build`.
- [x] 4.4 Manually verify the hybrid auto-populate, edit override, persist, and print layout behaviors.
