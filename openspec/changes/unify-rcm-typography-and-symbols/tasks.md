## 1. Boolean Symbol & Typography Standardization

- [x] 1.1 Update `src/pages/rcm/RCMTLCPage.tsx` to render Fraud & Key Control as plain text `Y` / `N` instead of icons/dashes, and standardize `control_ref` font.
- [x] 1.2 Update `src/pages/rcm/VerificationDesignPage.tsx` to render Key Control, IPO (C, A, V, RA), and Assertions as `Y` / `N` instead of `✓`, `—`, `<Shield>`, or `'T'`.
- [x] 1.3 Update `src/pages/rcm/RCMITGCPage.tsx` to render Key Control as `Y` / `N` and update header titles to use i18n keys.
- [x] 1.4 Update `src/pages/rcm/RCMELCPage.tsx` to render COSO Principles (1-17) as `Y` / `N` instead of `<Check>` / `—`.
- [x] 1.5 Update `src/components/rcm/TLCTabContent.tsx` to use soft badge styling for risk ratings and consistent `control_ref` typography.

## 2. Validation & Verification

- [x] 2.1 Run `npm run type-check` to verify zero TypeScript errors.
- [x] 2.2 Run `npm run lint` to verify code quality.
- [x] 2.3 Run `npm test` to verify no existing tests break.
- [x] 2.4 Run `npm run build` to verify clean production build.
