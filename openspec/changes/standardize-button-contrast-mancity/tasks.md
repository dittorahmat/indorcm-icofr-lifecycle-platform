## 1. BPM and CSA Module Updates

- [x] 1.1 Update `src/components/bpm/BPMAccountAssertion.tsx`: Replace `bg-slate-900` with `bg-mancity-pattern text-primary-foreground` on the Save button.
- [x] 1.2 Update `src/components/bpm/CSAForm.tsx`: Update TableHeader, Draft/Save buttons to use the Manchester City theme.
- [x] 1.3 Update `src/components/csa/TODVerificationDialog.tsx`: Update DialogHeader and Submit button to use `bg-mancity-pattern`.
- [x] 1.4 Update `src/pages/bpm/BPMPage.tsx`: Update primary action buttons and headers in the BPM editor view.

## 2. RCM and Testing Module Updates

- [x] 2.1 Update `src/components/rcm/TLCTabContent.tsx`: Convert the navigation button to the Manchester City theme.
- [x] 2.2 Update `src/components/rcm/BPMEditor.tsx`: Standardize the floating toolbar and action buttons.
- [x] 2.3 Update `src/components/rcm/ELCTabContent.tsx`: Update the main banner background from `bg-slate-900` to `bg-mancity-pattern`.
- [x] 2.4 Update `src/components/testing/ControlTestCard.tsx`: Update primary action buttons to Manchester City theme.

## 3. Scoping and Reports Updates

- [x] 3.1 Update `src/components/scoping/SetBenchmarkModal.tsx`: Change DialogHeader from `bg-slate-900` to `bg-mancity-pattern`.
- [x] 3.2 Update `src/components/scoping/SmartImportWizard.tsx`: Update DialogHeader and action buttons (Next/Finalize).
- [x] 3.3 Update `src/components/reports/Appendix7aSummary.tsx`: Convert the summary background section to the primary theme.
- [x] 3.4 Update `src/components/reports/Appendix7aDetailed.tsx`: Update TableHeader and summary section backgrounds.
- [x] 3.5 Update `src/components/reports/ReportHeader.tsx`: Update the container background to the Manchester City theme.
- [x] 3.6 Update `src/components/reports/AIAnalyticsMockup.tsx`: Update the main card background.

## 4. General Pages and Remediation

- [x] 4.1 Update `src/components/deficiencies/RemediationForm.tsx`: Change DialogHeader from `bg-indigo-900` to `bg-mancity-pattern` and ensure text readability.
- [x] 4.2 Update `src/pages/WelcomePage.tsx`: Convert the main "Get Started" style container to the new theme.
- [x] 4.3 Update `src/pages/HomePage.tsx`: Ensure the primary hero button matches the Manchester City standard.

## 5. Global Audit and Final Polish

- [x] 5.1 Audit `src/components/ui/button.tsx`: Verify if the `default` variant already handles `text-primary-foreground` correctly for pure `bg-primary`.
- [x] 5.2 Global search and replace for legacy Tooltip/Badge backgrounds that hinder readability.
- [x] 5.3 Final visual verification of all affected screens to ensure contrast ratios are accessible.
