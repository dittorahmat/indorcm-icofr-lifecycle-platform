## Why

The Test Results Report in the Reports Page currently uses "PASS" and "FAIL" terminology for TOD and TOE results. While common in auditing, Regulation SK-5/DKU.MBU/11/2024 (Bab V & VII) explicitly requires conclusions to be stated as **"Efektif"** (Effective) and **"Tidak Efektif"** (Ineffective). This change aligns the report terminology with regulatory standards and ensures consistency with the Testing Workbench.

## What Changes

- **UI Update (Reports Page)**: Rename table badge labels from "PASS" and "FAIL" to **"Efektif"** and **"Tidak Efektif"** using i18n translation keys.
- **Terminology Alignment**: Ensure all visual indicators of test results in the consolidated report view follow the SK-5 standard.
- **i18n Localization**: Add standardized translation keys for "Effective" and "Ineffective" in `src/i18n/locales/` for both English and Indonesian.
- **Database Schema Update**: Update `test_records` table metadata/comments in Drizzle schema and generate a migration to ensure alignment with the "Effective/Ineffective" terminology.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `regulatory-testing-report`: Update the presentation requirements for test results to use localized "Efektif/Tidak Efektif" terminology and ensure data layer consistency.

## Impact

- `src/pages/reports/ReportsPage.tsx`: Update the `Badge` labels and integrate `useTranslation`.
- `src/i18n/locales/`: New keys in `reports.json` (en/id).
- `worker/db/schema.ts`: Update `test_records` result column comments.
- `drizzle/`: New migration file.
- `src/lib/compliance-utils.ts`: Utilize `getTestResultLabel` helper consistently if not already doing so for the report table.
