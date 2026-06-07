## 1. Localization and Metadata

- [ ] 1.1 Update `src/i18n/locales/id/bpm.json` to add `verification` key in `modal.tabs`.
- [ ] 1.2 Update `src/i18n/locales/en/bpm.json` (if exists) for consistency.

## 2. BPMModal Refactoring

- [ ] 2.1 Import `VerificationDesignPage` in `src/components/bpm/BPMModal.tsx`.
- [ ] 2.2 Reorder `TabsTrigger` components in `BPMModal.tsx`: Worksheet, Sampling, RCM, CSA, Verification, Logs.
- [ ] 2.3 Reorder `TabsContent` components and insert `VerificationDesignPage` content with appropriate props (`bpmProcessId`, `embedded={true}`).

## 3. Component Integration Polish

- [ ] 3.1 Verify `VerificationDesignPage.tsx` handles `embedded` mode correctly (styling and overflow).
- [ ] 3.2 Add `ClipboardCheck` icon from `lucide-react` for the new tab trigger.

## 4. Verification

- [ ] 4.1 Run `npm run type-check` to ensure no regression.
- [ ] 4.2 Manually verify tab order and content in the browser.
