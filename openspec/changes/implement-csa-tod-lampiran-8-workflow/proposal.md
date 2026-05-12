## Why

Standardizing the review of Control Self-Assessments (CSA) by Line 2 (ICOFR Function) through a dedicated TOD (Test of Design) workflow aligned with Regulation SK-5 (Lampiran 8). This ensures that every control assessment performed by the business (Line 1) is formally verified for design effectiveness by the internal control function, closing the governance loop.

## What Changes

- **Transposed CSA Matrix**: Enhanced `CSAPage.tsx` with expandable rows that display a tabular pivot view (Controls as rows, Transactions as columns) for each CSA record.
- **Lampiran 8 TOD Entry**: A new popup form specifically for "Lampiran 8 - Verifikasi Rancangan Pengendalian" that opens when a control row is clicked.
- **Auto-population**: Automatic retrieval of control attributes (Reference, Description, IPO, Assertions, Frequency) from the RCM (Lampiran 5) to prepopulate the TOD form.
- **Line 2 Persistence**: New database schema (`tod_evaluations`) and API endpoints to store and manage the 8 compliance criteria for design effectiveness.
- **Data Integrity**: Integration of `useUnsavedChanges` guard and `UnsavedChangesDialog` into the TOD form to prevent loss of audit documentation.
- **Localization**: Full implementation of all new UI strings in Indonesian and English within `@src/i18n/`.
- **Notification System**: Implementation of a notification bell to alert Line 2 users when a new CSA submission is ready for TOD review.
- **Code Hygiene**: Comprehensive refactoring of `CSAPage` and related hooks to align with SOLID, DRY, and KISS principles.

## Capabilities

### New Capabilities
- `csa-tod-verification`: Covers the logic and UI for verifying control design (Lampiran 8) specifically for Line 2 reviewers.
- `tod-data-persistence`: New database schema and API routing for storing design effectiveness conclusions.

### Modified Capabilities
- `csa-management`: Updating the management dashboard to support expandable review workflows.
- `unsaved-changes-guard`: Extending the guard to the new TOD verification popup.
- `compliance-notification-system`: Adding alerts for Line 2 review triggers.

## Impact

- **Database**: New table `tod_evaluations` via Drizzle migration.
- **Frontend**: Significant updates to `src/pages/csa/CSAPage.tsx` and addition of TOD-specific components.
- **Hooks**: Extension of `useCSA` or creation of a new `useTOD` hook.
- **i18n**: New keys in `common.json` and `csa.json`.
