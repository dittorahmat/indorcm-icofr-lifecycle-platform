## Context

Currently, the application supports detailed, interactive DoD evaluation in `DoDWorksheetDialog.tsx` on the Deficiencies page. However, on the Regulatory Reports page (`/reports`), the `DoDReport` component inside `RegulatoryReportComponents.tsx` is an empty stub (`<CardContent>DoD Report Content</CardContent>`). 

Per Regulation SK-5/DKU.MBU/11/2024 (Lampiran 10), state-owned enterprises must provide a formal 24-column paper/tabular record of all deficiency evaluations, both individual and aggregate.

## Goals / Non-Goals

**Goals:**
- Implement a dedicated enterprise tabular component `DoDLampiran10Report.tsx` (or `DoDLampiran10Table.tsx`) rendering all 24 columns (i–xxiv) with institutional typography (>=12px font, solid clean surfaces, semantic tokens).
- Group table headers cleanly into 4 distinct regulatory tiers:
  1. Header Temuan (Kolom i–vi)
  2. Klasifikasi Agregasi (Kolom vii–x)
  3. Asersi Laporan Keuangan (Kolom xi–xvii: C, A, E/O, CO, R&O, V/A, PD)
  4. Pohon Keputusan 7 Kotak AS 2201 (Kolom xviii–xxiv)
- Provide responsive horizontal scrolling wrapper with sticky headers for deep desktop viewing.
- Support instant client-side CSV export formatted with all 24 headers.
- Provide clean `@media print` styles and digital sign-off blocks (Auditor Lini 3 & Komite Audit).

**Non-Goals:**
- Creating a separate backend persistence table (existing `deficiencies` API and metadata `dodWorksheet` are reused directly).
- Modifying the interactive evaluation logic in `DoDWorksheetDialog.tsx`.

## Decisions

### 1. Component Extraction (`DoDLampiran10Report.tsx`)
- **Decision**: Rather than bloating `RegulatoryReportComponents.tsx` beyond the 500-line limit rule, create an isolated component `src/components/reports/DoDLampiran10Report.tsx` and import it into `RegulatoryReportComponents.tsx`.
- **Alternative considered**: Inlining directly in `RegulatoryReportComponents.tsx`. Rejected to avoid breaking file size guidelines.

### 2. Deriving Missing DoD Data Gracefully
- **Decision**: If a deficiency does not yet have explicit `dodWorksheet` metadata, derive default display values from its `severity`, `exposureValue`, and linked controls, or display clean placeholders (e.g. `"-"` or `"N/A"`), ensuring the table never crashes.
- **Alternative considered**: Filtering out un-evaluated deficiencies. Rejected because auditors need visibility into which findings are still pending evaluation.

### 3. Print & Export Architecture
- **Decision**: Use native browser window printing with tailored CSS classes (`print:hidden`, `print:block`, `print:text-[10px]`) and lightweight client-side CSV generation via Blob URL.
- **Alternative considered**: Heavy third-party PDF generators (jsPDF, pdfmake). Rejected due to unnecessary bundle bloat and runtime overhead.

## Risks / Trade-offs

- **[Risk] Wide 24-column layout on standard laptop screens** → **Mitigation**: Wrap in an overflow container (`overflow-x-auto`) with minimum table width (`min-w-[1600px]`), zebra striping, sticky first column (`Ref Temuan`), and a clear scroll indicator.
- **[Risk] Anti-AI Slop Font Compliance** → **Mitigation**: Strictly enforce `text-xs` (12px) minimum font across all cells in normal screen view, avoiding sub-12px classes (`text-[8px]`, `text-[10px]`) except in ultra-compact print view.
