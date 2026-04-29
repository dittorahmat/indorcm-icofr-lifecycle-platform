## Why

In accordance with Regulation SK-5/DKU.MBU/11/2024 (Tabel 22), internal control testing MUST use a sufficient number of samples based on control frequency and risk rating to maintain the validity of the effectiveness conclusion. Currently, the system allows auditors to submit test results with insufficient sample sizes without formal justification, risking audit failures and regulatory non-compliance.

## What Changes

- **Smart Sampling Validation**: Real-time validation in the Test Workbench that compares user input against the mandatory ranges defined in Tabel 22.
- **Mandatory Deviation Justification**: If an auditor chooses a sample size below the regulatory minimum, the system will enforce a mandatory "Homogeneity Justification" field.
- **Tabel 22 UI Integration**: Visual indicators (badges/alerts) within the testing form to guide auditors toward compliant sample sizes.
- **Unsaved Changes Protection**: Integration of the `UnSavedChanges` guard to prevent data loss during intensive testing documentation.
- **Database Schema Update**: Addition of mandatory fields for sampling methodology and justification in the test records.

## Capabilities

### New Capabilities
- `sampling-enforcement`: Ability to validate and enforce regulatory sampling standards (Tabel 22) during the testing phase.

### Modified Capabilities
- `control-testing-lifecycle`: Requirements updated to include mandatory sampling validation and justification gates before test submission.

## Impact

- `src/pages/testing/TestWorkbench.tsx`: Main UI for the enforcer and validation logic.
- `src/lib/compliance-utils.ts`: Update logic for `getSuggestedSampleRange` to match exact Tabel 22 ranges.
- `worker/db/schema.ts`: Ensure `sampleSize` and `homogeneityJustification` are correctly handled (Drizzle).
- `src/i18n/`: Addition of regulatory warning strings in ID and EN.
- `shared/types.ts`: Update `TestRecord` and `CSARecord` to include sampling metadata.
