## Why

Currently, the BPM Page uses the label "Active Source" for the FSLI selection, which is inconsistent with the domain terminology and confusing given its different usage in the Scoping Page. Additionally, the Risk and Control counts in the BPM table are calculated incorrectly, failing to reflect the actual mappings within the workflow diagrams. This change fixes these issues to improve data accuracy and user clarity.

## What Changes

- **Localization Update**: Introduces a specific localization key for the FSLI label on the BPM page to distinguish it from the "Active Source" label used in Scoping.
- **Data Model/Schema Enhancement**: Adds `risk_count` and `control_count` columns to the `bpm_processes` table to store synchronized counts.
- **Backend Logic Sync**: Updates the BPM Diagram save logic to automatically recalculate and update Risk/Control counts for the associated process.
- **API Update**: Fixes the `/api/bpm-processes` query to return the actual synchronized counts from the database columns.
- **Unsaved Changes Integration**: Ensures the BPM Page handles unsaved changes to account assertions, following established project patterns.

## Capabilities

### New Capabilities
- `bpm-data-sync`: Automated synchronization of Risk and Control counts between workflow diagrams and process headers.

### Modified Capabilities
- `rcm-bpm-visualization`: Requirements modified to ensure diagram saves trigger count updates and are protected by unsaved changes guards.

## Impact

- `src/pages/bpm/BPMPage.tsx`: Label update and assertion guard integration.
- `src/i18n/locales/id/bpm.json` & `en/bpm.json`: New localization keys.
- `worker/db/schema.ts`: New columns for `bpm_processes`.
- `worker/user-routes.ts`: Updated diagram save logic and process list query.
- `drizzle/`: New migration for schema changes.
- `shared/types.ts`: Update `BPMProcess` interface.
