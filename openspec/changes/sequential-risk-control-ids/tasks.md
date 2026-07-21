## 1. Backend API & Database Service Updates

- [x] 1.1 Implement next sequence query endpoint `/api/bpm-processes/:id/next-sequences` in worker routing.
- [x] 1.2 Update the `bpm-service.ts` to scan existing risk and control entities using regex patterns matching process code prefixes.
- [x] 1.3 Ensure the `syncRisksAndControlsFromNodes` method supports custom alphanumeric IDs without resetting them to default UUID structures.

## 2. BPM Process Dialog Updates

- [x] 2.1 Modify the "Create Process" dialog in `BPMPage.tsx` to add a new "BPM Code" text input field.
- [x] 2.2 Add fuzzy search logic in the `useBPMPage` hook to find matching or similar process names and prefill the "BPM Code" input field.
- [x] 2.3 Update the mutation call to pass the inputted `bpmCode` inside the create process payload.

## 3. BPM Editor & Property Sheet UI Updates

- [x] 3.1 Modify `BPMEditor.tsx` to load the current process's `bpmCode` and hit the sequence endpoint when new node pairs are added.
- [x] 3.2 Update `addNewRisk` and `addControlToRisk` in `RegulatoryPropertySheet.tsx` to initialize IDs with the computed next sequence codes instead of random UUIDs.
- [x] 3.3 Change the Risk ID and Control ID labels to editable text Input boxes in the `RegulatoryPropertySheet.tsx` markup.
- [x] 3.4 Verify that manual overrides are correctly stored back into React Flow node states on blur/edit.

## 4. Verification & Testing

- [x] 4.1 Verify fully localized strings in `src/i18n/locales/**` for all new/modified UI text fields.
- [x] 4.2 Run `npm run type-check` to ensure full TypeScript compile compliance.
- [x] 4.3 Run `npm run lint` and verify there are no code hygiene errors.
- [x] 4.4 Run `npm run build` to confirm compilation is successful.
