## 1. Backend Auto-Deficiency & Endpoint Enhancement

- [x] 1.1 Update `worker/routes/rcm.ts` and `worker/routes/csa.ts` to prepend `[<controlCode>] <controlName>` to auto-generated deficiency descriptions when evaluation is `Ineffective`.
- [x] 1.2 Update `/api/deficiencies` endpoint handler in `worker/routes/remediation.ts` to query and return `riskCode` alongside `controlCode` and `controlName`.

## 2. Frontend Types & UI Redesign

- [x] 2.1 Update `shared/types.ts` (or `Deficiency` interface) to include optional control/risk metadata fields (`controlCode`, `controlName`, `riskCode`).
- [x] 2.2 Redesign `src/components/deficiencies/DeficiencyCard.tsx` layout: make Control Code & Control Name the primary prominent card title, display Risk Code badge, and move test outcome description to a subtle background note box.
- [x] 2.3 Update i18n localization keys in `src/i18n/locales/*/deficiency.json` for finding notes and control headers.
- [x] 2.4 Update `src/components/deficiencies/RemediationForm.tsx` to replace `relatedFunction` and `picName` text inputs with dynamic Select dropdowns populated from `/api/departments` and `/api/users`.

## 3. Validation & Verification

- [x] 3.1 Verify full build (`npm run build`), lint (`npm run lint`), type-check (`npm run type-check`), and tests (`npm test`).
