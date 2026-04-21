## Why

The current Degree of Deficiency (DoD) Wizard in `DoDWizard.tsx` implements the structural logic of SK-5/2024 Figure 5 but lacks critical regulatory procedural requirements from Chapter VII. Specifically, it misses the five "Automatic Material Weakness Indicators" and doesn't utilize performance materiality (PM) thresholds from the Scoping module to validate magnitude assessments, leading to potential inconsistencies in regulatory reporting.

## What Changes

- **Automatic MW Indicators**: Add a preliminary assessment step (Step 0) for the five indicators (Management Fraud, Material Fraud Impact, Restatements, etc.) that automatically concludes as "Material Weakness" if any are present.
- **Scoping Materiality Link**: Integrate the Performance Materiality (PM) threshold from the Scoping/Materiality module into the "Box 3: Magnitude" step.
- **Enhanced Step 3 Logic**: Auto-suggest "YES" for Magnitude if the exposure value exceeds the PM threshold.
- **Lampiran 10 Data Capture**: Add fields for specific assertion mapping (C, A, E/O, etc.) and quantitative exposure values as required by the Lampiran 10 worksheet format.
- **Rationale Refinement**: Update the rationale prompt to include justification for assertion selections.
- **Multi-language Support (i18n)**: Translate all new UI elements (Wizard steps, labels, and results) into English and Indonesian within `src/i18n/locales`.

## Capabilities

### New Capabilities
- `deficiency-regulatory-assessment`: Comprehensive deficiency evaluation covering automatic indicators, materiality-linked magnitude checks, and Lampiran 10 data structure.

### Modified Capabilities
<!-- No requirement changes to existing specs as this is a new regulatory-focused capability -->

## Impact

- **Frontend**: `src/components/deficiencies/DoDWizard.tsx` (Logic and UI), `src/pages/deficiencies/DeficiencyBoard.tsx` (Data passing).
- **Types**: `shared/types.ts` (Potential new fields for Deficiency to support Lampiran 10).
- **Integration**: Linkage between `deficiencies` and `scoping` data stores.
- **Localization**: `src/i18n/locales/en/` and `src/i18n/locales/id/` JSON files.
