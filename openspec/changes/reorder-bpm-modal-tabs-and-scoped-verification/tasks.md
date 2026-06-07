## 1. Refactor VerificationDesignPage

- [x] 1.1 Update `VerificationDesignPage` interface to accept `embedded` and `filterBpmId` props.
- [x] 1.2 Update `useQuery` in `VerificationDesignPage` to support `filterBpmId` as query parameter.
- [x] 1.3 Conditionally hide `AppLayout` and `RCMPageHeader` based on `embedded` prop.

## 2. Update Localization

- [x] 2.1 Add `verification` tab label in `src/i18n/locales/id/bpm.json`.
- [x] 2.2 Add `verification` tab label in `src/i18n/locales/en/bpm.json`.

## 3. Reorder Tabs in BPMModal

- [x] 3.1 Import `VerificationDesignPage` in `src/components/bpm/BPMModal.tsx`.
- [x] 3.2 Rearrange `TabsTrigger` order in `BPMModal.tsx`.
- [x] 3.3 Rearrange `TabsContent` order in `BPMModal.tsx`.
- [x] 3.4 Insert `VerificationDesignPage` into the new tab content with `embedded` and `filterBpmId={bpmProcessId}`.

## 4. Quality & Verification

- [x] 4.1 Run `npm run type-check` to verify prop integrity.
- [ ] 4.2 Verify tab order in browser.
- [ ] 4.3 Verify that Verification Design tab only shows relevant data for the selected BPM.
