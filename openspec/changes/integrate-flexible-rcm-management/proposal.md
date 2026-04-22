## Why

The current Risk Library implementation is too rigid, forcing users to categorize risks into BUMN clusters and lookup from a fixed library, which hinders the natural workflow of business process mapping. Users need the flexibility to input risks and controls directly with manual details (Fraud indicators, Risk Ratings, Key Control status) while still being able to search and reuse existing data.

## What Changes

- **Removal of Rigid Risk Library**: **BREAKING** Removal of the `risk_library` table, the "Risk Library" page, and the BUMN cluster classification.
- **Enhanced BPM Side Panel**: Replacement of the `RiskLibraryLookup` dialog with a direct input form for Risks and Controls.
- **Unified Search & Create**: Implementation of a search bar for Risks and Controls that queries existing `rcms` and `controls` tables with an option to create new entries on-the-fly.
- **New Metadata for Risks**: Addition of `is_fraud_related` (boolean) and `risk_rating` (Low, Medium, High) to the Risk entity.
- **New Metadata for Controls**: Addition of `is_key_control` (boolean) and `description` to the Control entity within the BPM context.
- **Database Schema Update**: Drizzle migrations to add missing columns to `rcms` and `controls`.
- **Localization**: Updates to Indonesian and English translations to support new RCM metadata.

## Capabilities

### New Capabilities
- `flexible-rcm-management`: Ability to manage risks and controls directly within the BPM editor with specific metadata support and real-time search.

### Modified Capabilities
- `rcm`: Requirement changes from standardized library-based selection to a flexible direct-entry and existing-data-reuse model.

## Impact

- **Backend**: Update `worker/db/schema.ts`, new migrations, and updated routes in `worker/user-routes.ts` for RCM/Control creation.
- **Frontend**: Significant refactoring of `src/components/rcm/BPMEditor.tsx`, removal of `src/pages/rcm/RiskLibraryPage.tsx` and `src/components/rcm/RiskLibraryLookup.tsx`.
- **Database**: Removal of `risk_library` table and schema updates for `rcms` and `controls`.
- **i18n**: Updates to `src/i18n/locales/` for both languages.
