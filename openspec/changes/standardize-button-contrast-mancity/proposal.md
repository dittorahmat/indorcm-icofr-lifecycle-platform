## Why

The application recently adopted a "Manchester City" primary theme (Sky Blue background with Dark Navy text). However, many UI elements—specifically primary action buttons, dialog headers, and banners—still use a hardcoded dark theme (`bg-slate-900` or `bg-indigo-900`) combined with the default text color. Due to the theme update, the default text color has become Dark Navy, resulting in dark text on dark backgrounds that are nearly unreadable. Standardizing these elements to the Manchester City theme will resolve accessibility issues, ensure visual consistency, and modernize the application's look and feel.

## What Changes

- **Standardize Action Buttons**: Replace hardcoded `bg-slate-900` and `bg-indigo-900` background classes on primary action buttons across all modules (BPM, CSA, RCM, Scoping, Remediation) with `bg-mancity-pattern` and `text-primary-foreground`.
- **Align Dialog Headers**: Update dialog and modal headers that still use the old dark theme to use the Manchester City patterned theme.
- **Update Banners and Cards**: Convert high-impact visual banners and informational cards from the old dark theme to the new primary theme.
- **Accessibility Fix**: Ensure all affected elements use `text-primary-foreground` to guarantee a sharp contrast ratio (Dark Navy on Sky Blue).

## Capabilities

### New Capabilities
- `mancity-button-standard`: A standardized utility or set of conventions for primary action buttons using the Manchester City theme.

### Modified Capabilities
- `mancity-theme-ui`: Expanding the scope of the Manchester City theme implementation to cover interactive elements (buttons) and more complex headers.

## Impact

- **UI Components**: `Button`, `Badge`, `DialogHeader`, `Card`.
- **Affected Files**:
  - `src/components/bpm/BPMAccountAssertion.tsx`
  - `src/components/bpm/CSAForm.tsx`
  - `src/components/csa/TODVerificationDialog.tsx`
  - `src/components/rcm/TLCTabContent.tsx`
  - `src/pages/bpm/BPMPage.tsx`
  - `src/components/deficiencies/RemediationForm.tsx`
  - `src/components/reports/Appendix7aSummary.tsx`
  - `src/components/scoping/SetBenchmarkModal.tsx`
  - `src/components/scoping/SmartImportWizard.tsx`
  - `src/components/testing/ControlTestCard.tsx`
  - `src/pages/WelcomePage.tsx`
  - `src/components/rcm/BPMEditor.tsx`
  - `src/components/rcm/ELCTabContent.tsx`
  - `src/components/reports/AIAnalyticsMockup.tsx`
  - `src/components/reports/Appendix7aDetailed.tsx`
  - `src/components/reports/ReportHeader.tsx`
- **Dependencies**: No new dependencies; uses existing Tailwind utilities and CSS variables.
