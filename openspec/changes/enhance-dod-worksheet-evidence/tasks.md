## 1. Type Definitions & Data Models

- [x] 1.1 Add `DoDBoxEvaluation`, `DoDWorksheetData`, and `DoDEvidenceContext` interfaces to `shared/types.ts` and verify with `npm run type-check`
- [x] 1.2 Extend `Deficiency` type to store `dodWorksheet` evaluation history and verify backwards compatibility with existing mock data

## 2. Evidence Context Hook & Data Fetching

- [x] 2.1 Implement `useDoDEvidenceContext` hook to fetch and aggregate TOD/TOE sample results, GL account balances, and RCM compensating controls
- [x] 2.2 Verify evidence context returns expected default fallback when test run or GL data is absent with unit tests

## 3. Modular DoD Worksheet Components (Anti-AI Slop & Design Standards)

- [x] 3.1 Create `DoDHeaderSummary.tsx` displaying Lampiran 10 header columns (deficiency ref, description, remediation status, ineffective period, 7 assertions, COSO components) adhering to min-12px font rules
- [x] 3.2 Create `DoDEvidenceContextCard.tsx` displaying sample failure rates, workpaper links, exposure vs PM comparison card, and compensating control picker
- [x] 3.3 Create `DoDLogicMatrix.tsx` rendering Kotak 1 through Kotak 7 tabular rows with inline radio toggle, mandatory justification textarea, suggestion chips, and linked evidence tags
- [x] 3.4 Create `DoDConclusionFooter.tsx` showing the derived terminal severity (CD/SD/MW), governance routing summary badge (Tabel 24 Hal. 65), and save/cancel actions

## 4. Orchestration & Integration in Deficiency Board

- [x] 4.1 Implement `DoDWorksheetDialog.tsx` combining all modular sub-components with auto-calculation logic adhering to Gambar 5 SK-5/2024
- [x] 4.2 Update `src/pages/deficiencies/DeficiencyBoard.tsx` and `DeficiencyCard.tsx` to trigger the new `DoDWorksheetDialog` instead of the legacy `DoDWizard`
- [x] 4.3 Add full bilingual localization keys (id/en) for all 24 columns, evidence labels, and validation errors in `src/i18n/locales/*/deficiency.json`

## 5. Verification & Test Suite

- [x] 5.1 Write unit tests in `src/pages/deficiencies/__tests__/DoDWorksheetDialog.test.tsx` verifying:
  - Rendering of all Lampiran 10 columns and evidence context
  - Blocking submission when justification is empty
  - Accurate terminal severity calculation (Box 5 'No' -> Material Weakness, Box 4 'No' -> Control Deficiency)
- [x] 5.2 Execute full validation suite sequentially (`npm run type-check`, `npm run lint`, `npm run build`, `npm test`) to ensure zero regressions
