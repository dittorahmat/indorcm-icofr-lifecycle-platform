## 1. Data Fetching & Integration

- [x] 1.1 Add `tests` query to `ReportsPage.tsx` using `useQuery`.
- [x] 1.2 Add `controls` query to `ReportsPage.tsx` if not already present or used for joining.

## 2. UI Implementation (Audit Results Tab)

- [x] 2.1 Implement the data table in the "Laporan Hasil Pengujian" tab.
- [x] 2.2 Add columns: No, Control Name, Test Type, Method, Sample Size, Result, Comments.
- [x] 2.3 Create a compact indicator component for the 6 mandatory evaluation attributes (Tabel 21).
- [x] 2.4 Add filtering controls (Type & Status) above the table.

## 3. Verification & Compliance

- [x] 3.1 Verify data correctly joins between tests and controls.
- [x] 3.2 Ensure TOE records show the sample size while TOD records show "N/A" or "1".
- [x] 3.3 Verify visual indicators for evaluation attributes are accurate.
