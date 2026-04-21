## 1. Terminology & i18n Alignment

- [x] 1.1 Add `testing.effective` and `testing.ineffective` keys to `src/i18n/locales/en/reports.json`
- [x] 1.2 Add `testing.effective` and `testing.ineffective` keys to `src/i18n/locales/id/reports.json`
- [x] 1.3 Update `ReportsPage.tsx` to import `getTestResultLabel` and `useTranslation`
- [x] 1.4 Replace hardcoded "PASS/FAIL" labels in `ReportsPage.tsx` with localized calls using `t('reports:testing.effective')` or `t('reports:testing.ineffective')` based on `test.result`

## 2. Database Migration

- [x] 2.1 Update `worker/db/schema.ts` to improve the comment for `testRecords.result` column
- [x] 2.2 Run `bun x drizzle-kit generate` to create the migration for terminology alignment
- [x] 2.3 (Optional/If needed) Create a manual data migration script or update seed data to normalize "Pass/Fail" to "Effective/Ineffective"

## 3. Verification

- [x] 3.1 Manually verify the Reports Page display in both English and Indonesian
- [x] 3.2 Ensure the Print version of the report uses the localized terminology
- [x] 3.3 Verify migration files are staged for commit
