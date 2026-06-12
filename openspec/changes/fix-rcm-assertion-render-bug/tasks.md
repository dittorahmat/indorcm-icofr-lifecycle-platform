## 1. Frontend Modifications

- [x] 1.1 Update `src/pages/rcm/RCMTLCPage.tsx` to change IPO columns rendering from `row.ipoX ? '✓' : '—'` to `row.ipoX === 'Y' ? 'Y' : 'N'`.
- [x] 1.2 Update `src/pages/rcm/RCMTLCPage.tsx` to change Assertion columns rendering from `row.assertionX ? '✓' : '—'` to `row.assertionX === 'Y' ? 'Y' : 'N'`.

## 2. Verification & Compliance Mandates

- [x] 2.1 Run `npm run type-check` to verify TypeScript integrity.
- [x] 2.2 Run `npm run lint` to check for styling and code standards.
- [x] 2.3 Run `npm run build` to verify compiling output.
- [x] 2.4 Run `npm test` to prevent any regressions.
