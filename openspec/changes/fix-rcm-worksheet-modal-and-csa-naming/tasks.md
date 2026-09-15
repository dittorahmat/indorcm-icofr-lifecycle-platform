## 1. Helper Utilities & Unit Tests

- [x] 1.1 Implement `formatCsaReference` helper in `src/lib/csa-utils.ts` supporting `CSA-{BPM_CODE}-{YEAR}-{PERIOD}` with fallback hierarchy (BPMCode -> GL -> Process ID).
- [x] 1.2 Add unit tests for `formatCsaReference` in `src/test/csa-reference.test.ts` and verify all test cases pass with `npm test`.

## 2. BPMModal Tab Routing & State Reset

- [x] 2.1 Update `BPMModalProps` in `src/components/bpm/BPMModal.tsx` to accept `initialTab?: string` (defaulting to `"worksheet"`).
- [x] 2.2 Reset `activeTab` to `initialTab` on open, and clear `selectedSamples` to `[]` on modal close in `BPMModal.tsx`.
- [x] 2.3 Update `BPMPage.tsx` to pass `initialTab="worksheet"` when triggering modal from `onOpenWorksheet`.
- [x] 2.4 Update `TodoListPage.tsx` to explicitly pass `initialTab="csa"` to preserve execution hub workflow.
- [x] 2.5 Guard view state in `src/hooks/use-csa.ts` to ensure it reliably defaults to `"list"` view and does not enter `"form"` from stale sample state.

## 3. Structured Period Selector & Reference Code Display

- [x] 3.1 Replace free-text `period` input with a structured quarter selector (`Q1`, `Q2`, `Q3`, `Q4 / Annual`) in `src/components/bpm/CSAForm.tsx`.
- [x] 3.2 Display the calculated system-generated Reference Code badge in `src/components/bpm/CSAForm.tsx`.
- [x] 3.3 Update `src/components/bpm/CSAList.tsx` to display the generated Reference Code alongside period and status badges.
- [x] 3.4 Update default period generation in `src/hooks/csa/use-csa-form.ts` and `src/components/bpm/CSATabContent.tsx` to dynamically bind to the active fiscal year.

## 4. Verification & Mandat Penyelesaian Tahap

- [x] 4.1 Verify manual interaction: Clicking "Open RCM Worksheet" in BPMPage opens the worksheet tab and does not trigger CSA detail form.
- [x] 4.2 Verify manual interaction: CSA creation generates proper reference code and saves structured period.
- [x] 4.3 Run `npm run type-check`, `npm run lint`, `npm test`, and `npm run build` to verify code integrity.
