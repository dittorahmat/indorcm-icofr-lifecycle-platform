## 1. UI Grid Integration

- [x] 1.1 Update `GLDataGrid.tsx` balance column cells to display `fsliBalance` instead of the sum of GL balances for grouped rows when `fsliBalance` is non-zero.
- [x] 1.2 Update `GLDataGrid.tsx` `quantFlag` column `aggregationFn` to evaluate significance against `pmValue` using `fsliBalance` when present.
- [x] 1.3 Update `GLDataGrid.tsx` `finalStatus` column `aggregationFn` to evaluate in-scope status using `fsliBalance` when present.

## 2. Exporter Update

- [x] 2.1 Update `handleExportExcel` in `GLDataGrid.tsx` to export the pre-calculated `fsliBalance` for FSLI group rows.

## 3. Verification

- [x] 3.1 Verify that loading the demo spreadsheet `demo/Laporan Keuangan_20251231_Demo SMI_v4.xlsx` displays the correct FSLI balance in the grid for FSLIs with zero GL account balances (e.g. Penyertaan Modal).
- [x] 3.2 Verify that the quantitative significance flag and scoping status are correctly calculated for those FSLIs.
- [x] 3.3 Verify Excel export output matches FSLI balances shown in the UI.
- [x] 3.4 Run typecheck, lint, and build tests to ensure zero regressions.
