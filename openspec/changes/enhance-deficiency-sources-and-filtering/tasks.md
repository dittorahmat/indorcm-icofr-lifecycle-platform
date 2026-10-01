## 1. Localization & Types

- [x] 1.1 Update `src/i18n/locales/en/deficiency.json` and `src/i18n/locales/id/deficiency.json` with granular source labels (`sources.all`, `sources.csa`, `sources.tod`, `sources.toe`, `sources.audit`) and verify keys exist.
- [x] 1.2 Verify `shared/types.ts` has consistent `Deficiency['source']` union values to support `'Lini 1 - CSA' | 'Lini 2 - TOD Review' | 'Lini 2 - CSA Validation' | 'Lini 2 - TOE Review' | 'Lini 3 - Audit'`.

## 2. Component Enhancements

- [x] 2.1 Update `src/components/deficiencies/DeficiencyCard.tsx` with dedicated source badge styling, icons, and localized labels adhering to `design-taste-frontend` rules.
- [x] 2.2 Update `src/pages/deficiencies/DeficiencyBoard.tsx` to implement granular filtering logic (`all`, `csa`, `tod`, `toe`, `audit`) and render updated segmented filter buttons.

## 3. Testing & Verification

- [x] 3.1 Add or update unit tests in `src/pages/deficiencies/__tests__/` to verify filtering behavior across all deficiency sources.
- [x] 3.2 Run `npm run type-check`, `npm run lint`, and `npm test` to verify no regressions.
