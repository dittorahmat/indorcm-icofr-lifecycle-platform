## Context

The Smart Import Wizard currently uses a mocked backend to simulate RCM data ingestion. To provide a functional system, we need a robust parser that can read Excel (.xls, .xlsx) and CSV files, normalizing diverse user column headers into a standardized JSON structure that the backend migration endpoint (`/api/migration/finalize`) can process. 

## Goals / Non-Goals

**Goals:**
- Implement `rcm-parser.ts` to parse RCM spreadsheet files.
- Auto-detect column mappings using a predefined dictionary (`RCM_COLUMN_MAPPING`).
- Enforce relational integrity by requiring `Entity_Code` and `No_GL`/`FSLI` columns.
- Integrate the parser directly into the frontend `SmartImportWizard` component.

**Non-Goals:**
- Full backend validation of the RCM data against the existing Risk Library (this relies on the AI extraction mapping which is a future enhancement).
- Handling merged cells or complex, non-tabular spreadsheet formatting.

## Decisions

### 1. Parsing Libraries
- **Choice**: Reuse `papaparse` for CSV and `xlsx` for Excel files.
- **Rationale**: These are already installed, proven to work well in `gl-parser.ts`, and run entirely in the browser, reducing server load.

### 2. Auto-Mapping Strategy
- **Choice**: Implement `detectRCMColumns` using case-insensitive matching against arrays of common column name variations.
- **Rationale**: Users often have slight variations in header naming (e.g., "Proses Bisnis" vs "Process"). This reduces friction by automatically finding the right columns without forcing strict template compliance, as long as the meaning is clear.

### 3. Enforcing Relational Keys
- **Choice**: The parser will fail validation if `entityCode` and either `noGL` or `fsli` columns cannot be mapped.
- **Rationale**: An RCM record without a link to a business entity and a financial account cannot participate in the ICOFR traceability flow (GL -> Process -> Risk -> Control).

## Risks / Trade-offs

- **[Risk] Large File Parsing**: Parsing huge Excel files in the browser might block the main thread.
  - **Mitigation**: The current use case typically involves matrices with thousands of rows, which modern browsers handle well. We will use standard async wrapping.
- **[Risk] Ambiguous Mappings**: The auto-mapper might incorrectly map a column if a user has confusingly named headers.
  - **Mitigation**: The `RCM_COLUMN_MAPPING` dictionary will be strictly defined based on standard accounting/audit terminology.
