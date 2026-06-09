## 1. Data Migration

- [x] 1.1 Create `scripts/fix-transaction-years.ts` to update existing 2024 transactions to 2026.
- [x] 1.2 Run the migration script and verify database state.

## 2. Backend Implementation

- [x] 2.1 Update `GET /api/transaction-details` in `worker/routes/transactions.ts` to support the `year` query parameter.
- [x] 2.2 Refactor `POST /api/transaction-details` in `worker/routes/transactions.ts` to handle batch `rows` and `mode` (replace/append).

## 3. Frontend Implementation

- [x] 3.1 Integrate `useFiscalYearStore` into `src/components/bpm/TransactionSamplingTab.tsx`.
- [x] 3.2 Update the `rowsData` query in `TransactionSamplingTab.tsx` to include `year: workingYear` in the query key and URL.
- [x] 3.3 Update the `filteredRows` memo in `TransactionSamplingTab.tsx` to filter by the current `workingYear`.
- [x] 3.4 Verify `TransactionUploadModal.tsx` payload matches new backend `POST` structure.

## 4. Verification

- [x] 4.1 Test batch upload functionality with a sample Excel file.
- [x] 4.2 Verify that switching the global fiscal year correctly updates the transaction list.
