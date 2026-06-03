## Why

Currently, the Smart Import Wizard uses hardcoded dummy data (like "BSN-01") when processing uploaded RCM files. This prevents users from mapping their actual operational risks and controls to the financial scoping data (GL TB). We need a real parser that reads CSV/XLSX files, detects the correct columns, and ensures traceability by linking RCM data to specific Entities and GL Accounts.

## What Changes

- Add a new `rcm-parser.ts` service that leverages `papaparse` and `xlsx` (similar to the existing GL parser).
- Define `RCM_COLUMN_MAPPING` to automatically detect user-friendly headers (e.g., `Entity_Code`, `No_GL`, `Risiko`, `Kontrol`).
- Update `SmartImportWizard.tsx` to process the uploaded RCM file using the new parser instead of generating dummy data.
- **BREAKING (for users)**: RCM files will now strictly require `Entity_Code` and `No_GL` (or `FSLI`) columns to establish the relational link to the financial data.
- Update the sample CSV file `demo/sample_rcm_migration.csv` to reflect the new required structure.

## Capabilities

### New Capabilities
- `rcm-csv-parser`: The ability to parse, validate, and normalize uploaded RCM spreadsheets (.csv, .xls, .xlsx) into structured staging data.

### Modified Capabilities

## Impact

- **Frontend**: `src/components/scoping/SmartImportWizard.tsx` (replaces `setTimeout` mock with actual parser call).
- **Backend/Services**: New file `src/pages/scoping/services/rcm-parser.ts`.
- **Utilities**: `src/lib/compliance-utils.ts` (added column mapping configurations).
- **Demo Data**: `demo/sample_rcm_migration.csv` (overwritten).
