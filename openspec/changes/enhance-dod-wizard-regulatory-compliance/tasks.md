## 1. Data Model Expansion

- [x] 1.1 Update `Deficiency` type in `shared/types.ts` to include `exposureValue`, `assertions`, and `preAssessment` results.
- [x] 1.2 Update backend deficiency API schema (if applicable) to persist new fields.

## 2. DoD Wizard Logic & UI

- [x] 2.1 Implement "Step 0: Automatic MW Indicators" UI in `DoDWizard.tsx`.
- [x] 2.2 Add skipping logic to `handleAnswer` if any automatic indicator is selected.
- [x] 2.3 Integrate `performanceMateriality` prop into `DoDWizard.tsx` and parent `DeficiencyBoard.tsx`.
- [x] 2.4 Add exposure value input field in Box 3 of the wizard.
- [x] 2.5 Implement auto-suggestion logic for Box 3 (Magnitude) based on exposure vs PM.
- [x] 2.6 Add assertion multi-select UI in the final result step.

## 3. Integration & Rationale

- [x] 3.1 Update the final result summary to include a comparison table (Exposure vs PM).
- [x] 3.2 Refine the rationale generation to pre-fill with quantitative findings.
- [x] 3.3 Ensure all Lampiran 10 data points are saved upon clicking "Apply Severity".

## 4. Localization (i18n)

- [x] 4.1 Update `src/i18n/locales/en/` JSON files with new DoD Wizard strings.
- [x] 4.2 Update `src/i18n/locales/id/` JSON files with Indonesian translations.
- [x] 4.3 Wrap all new UI text in `DoDWizard.tsx` with the `t()` function.

## 5. Verification

- [x] 4.1 Verify automatic MW trigger with manual test.
- [x] 4.2 Verify magnitude auto-suggest logic with different PM values.
- [x] 4.3 Verify persistence of assertion mapping in the deficiency database.
