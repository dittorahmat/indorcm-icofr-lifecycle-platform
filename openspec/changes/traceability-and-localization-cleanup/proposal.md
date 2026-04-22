## Why

To ensure full compliance and data integrity, we need to:
1.  Link operational RCM entries back to the Master Risk Library (Traceability).
2.  Provide a consistent multilingual experience (Indonesian & English) as per the project standards.
3.  Remove hardcoded strings from recently added UI components.

## What Changes

- **Database Schema**: Add `riskLibraryId` to the `rcms` table in `worker/db/schema.ts`.
- **Backend**: Update `/api/rcm` POST endpoint to accept and store the `riskLibraryId`.
- **Localization**: Create `risklibrary.json` in both `en` and `id` locales.
- **Frontend Refactor**: Update `RiskLibraryPage.tsx` and `BPMEditor.tsx` to use the `useTranslation` hook.

## Capabilities

### Modified Capabilities
- `rcm`: Added database-level linking to master risks.
- `risk-library`: Added full localization support.

## Impact

- **Database**: New migration file and schema update.
- **i18n**: New namespace `risklibrary` added to i18next configuration.
