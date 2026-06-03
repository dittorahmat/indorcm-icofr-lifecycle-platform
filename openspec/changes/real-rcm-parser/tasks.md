## 1. Utilities and Mapping Setup

- [x] 1.1 Add `RCM_COLUMN_MAPPING` to `src/lib/compliance-utils.ts`.
- [x] 1.2 Export a type `RCMField` derived from `RCM_COLUMN_MAPPING`.
- [x] 1.3 Create `detectRCMColumns` and `validateRCMMapping` utility functions in `src/lib/compliance-utils.ts`.

## 2. Core Parser Implementation

- [x] 2.1 Create `src/pages/scoping/services/rcm-parser.ts`.
- [x] 2.2 Implement the `parseRCMFile` function using `papaparse` for `.csv` and `xlsx` for Excel files.
- [x] 2.3 Implement mapping logic inside the parser to convert raw rows into structured JSON using the detected column mapping.

## 3. Frontend Integration

- [x] 3.1 Update `src/components/scoping/SmartImportWizard.tsx` to import and call `parseRCMFile` when an RCM file is provided.
- [x] 3.2 Remove the `setTimeout` mock and hardcoded `stagingData` array from `handleProcessAI`.
- [x] 3.3 Set the parsed RCM data to the `stagingData` state.

## 4. Demo Data Updates

- [x] 4.1 Rewrite `demo/sample_rcm_migration.csv` to follow the new structure (with `Entity_Code` and `No_GL` columns matching `demo/sample_hierarchy_gl.csv`).
