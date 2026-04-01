# Design: TOD/TOE Regulatory Report

## UI/UX
- **Tab Content**: The "Laporan Hasil Pengujian" tab will feature a comprehensive table.
- **Table Columns**:
  1. **Ref**: Audit reference / Sequence.
  2. **Control**: Code & Name.
  3. **Type**: TOD or TOE Badge.
  4. **Method**: Inspection, Inquiry, etc.
  5. **Attributes**: A compact visual summary of the 6 mandatory attributes (e.g., icons or a "6/6" score).
  6. **Sample**: Sample Size (for TOE).
  7. **Result**: Pass/Fail Badge with color coding.
  8. **Comments**: Walkthrough/Testing notes.
- **Filters**: Select inputs for Test Type and Status above the table.

## Data Integration
- **Queries**: 
  - Fetch `controls` to get metadata.
  - Fetch `tests` (`TestRecord[]`) to get implementation results.
- **Aggregation**: Map through `tests`, joining with `controls` by `controlId`.

## Technical Approach
- Use `shadcn/ui` Table and Badge components.
- Implement a helper function to render evaluation attributes as tooltips or compact status indicators.
- Use `tanstack/react-query` for data fetching.

## Logic Rules
- **TOD Focus**: Focuses on design effectiveness.
- **TOE Focus**: Focuses on operating effectiveness over a period, requiring sample size documentation.
- **Compliance Alignment**: Attributes mapped to Tabel 21 (Pencapaian objektif, Ketepatan waktu, Wewenang, Keandalan informasi, Cakupan periode, Kecukupan bukti).
