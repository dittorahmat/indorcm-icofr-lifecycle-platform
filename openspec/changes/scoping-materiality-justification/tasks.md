## 1. Types & Data Modeling

- [x] 1.1 Define `MaterialityJustification` interface and attach optional property to `MaterialitySimulation` in `shared/types.ts`, verifying with `npm run type-check`.
- [x] 1.2 Implement helper `generateMaterialityNarrative` in a new utility file `src/pages/scoping/services/materiality-justification.ts` with unit test verifying correct synthesis across all 4 factors in English and Indonesian.

## 2. UI Components & Justification Modal

- [x] 2.1 Add localization keys in `src/i18n/locales/id/scoping.json` and `src/i18n/locales/en/scoping.json` for 4 factors, options, alerts, and narrative templates.
- [x] 2.2 Create `MaterialityJustificationModal.tsx` following `AGENTS.md` anti-AI slop standards (minimum 12px font, solid surfaces, institutional rounded-md borders, no backdrop blur), verifying manual interaction and narrative preview updates.
- [x] 2.3 Integrate Justification trigger button and status badge ("Justified" vs "Justification Required") into `src/pages/scoping/components/MaterialityParamsCard.tsx`.

## 3. Prerequisite Locking Guard & Integration

- [x] 3.1 Update lock/freeze handler in `src/pages/scoping/components/ScopingEditorHeader.tsx` and `useScopingPage.ts` to validate that all 4 factors are present before locking, verifying that incomplete justification prevents lock and opens the modal.
- [x] 3.2 Ensure locked simulations render the justification in read-only audit mode, and verify that changes are persisted through simulation mutation API.

## 4. Verification & Quality Gates

- [x] 4.1 Run `npm run type-check` and verify zero TypeScript errors.
- [x] 4.2 Run `npm run lint` and verify zero ESLint errors.
- [x] 4.3 Run `npm test` and verify all tests pass.
- [x] 4.4 Run `npm run build` and verify successful production compilation.
