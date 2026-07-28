## 1. RegulatoryPropertySheet UI Component Extension

- [x] 1.1 Add `Control Type`, `Control Nature`, and `Frequency` dropdown fields in `RegulatoryPropertySheet.tsx` under each control item accordion panel.
- [x] 1.2 Bind change handlers to `updateSpecificControl` for `controlType`, `controlNature`, and `frequency`.
- [x] 1.3 Update `addNewRisk` and `addControlToRisk` functions to initialize default fallback values for `controlType`, `controlNature`, and `frequency`.

## 2. Localization & Verification

- [x] 2.1 Verify i18n key translations in `src/i18n/locales/id/rcm.json` and `src/i18n/locales/en/rcm.json` for property labels.
- [x] 2.2 Validate type-check (`npm run type-check`), linter (`npm run lint`), build (`npm run build`), and tests (`npm test`).
