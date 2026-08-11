## 1. UI Default & Cleanups

- [x] 1.1 Update `GLDataGrid.tsx` qualitative column rendering to fallback missing rating values to `"Low"` instead of `""`.
- [x] 1.2 Remove `#minNoUrut` badge rendering inside benchmark `CommandItem` in `SmartImportWizard.tsx`.

## 2. Database Backfill & Persistence Integrity

- [x] 2.1 Create database backfill script `scripts/backfill-scoping-assertions.ts` to populate default qualitative ratings ("Low") for existing simulations in the database.
- [x] 2.2 Execute `npx tsx scripts/backfill-scoping-assertions.ts` to repair all existing database records.
- [x] 2.3 Update `useScopingEditor` in `useScopingPage.ts` to merge qualitative defaults for missing FSLI entries upon simulation load and recalculate.
- [x] 2.4 Update `PUT /api/simulations/:id` route in `worker/routes/scoping.ts` to ensure unrated FSLI accounts receive defaults instead of being overwritten.

## 3. Verification & Validation

- [x] 3.1 Run `npm run type-check` and `npm run test` to verify TypeScript types and unit tests.
- [x] 3.2 Verify simulation grid renders "Low" for all 8 pillars on new and existing simulations.
