## 1. UI Enhancements

- [x] 1.1 Replace hardcoded "Significant" badge in `ScopingPage.tsx` with dynamic logic.
- [x] 1.2 Update "Reason" column in the table to display qualitative reasons if `isQuantitative` is false.
- [x] 1.3 Add visual styling (color/variant) to distinguish between Significant and Insignificant accounts.

## 2. Logic Updates

- [x] 2.1 Update `handleDataImported` in `ScopingPage.tsx` to automatically filter out insignificant accounts during GL upload.
- [x] 2.2 Ensure that accounts added via `QualitativeScopingWizard` are correctly marked as significant.

## 3. Data & Verification

- [x] 3.1 Verify that accounts with balance >= PM are automatically flagged as significant.
- [x] 3.2 Verify that accounts below PM without qualitative reasons are correctly identified as insignificant or filtered out.
- [x] 3.3 Ensure the "Cakupan Ruang Lingkup" metrics still calculate correctly after filtering.
