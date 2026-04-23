## Why

Currently, financial assertions (Existence, Completeness, Accuracy, etc.) are filled manually at the individual control level in the RCM (Risk Control Matrix). This is prone to inconsistency across controls that cover the same account (GL) and FSLI. By centralizing these assertions at the Account/BPM level in `BPMPage.tsx`, we establish a "Source of Truth" that ensures regulatory alignment with SK-5 Table 8 and reduces repetitive data entry.

## What Changes

- **Centralized Assertion Management**: New UI in `BPMPage.tsx` to configure assertions for a specific FSLI and GL Account combination.
- **Regulatory Alignment**: Integration of Table 8 SK-5 descriptions via hover tooltips for each assertion.
- **Assertion Inheritance**: Automatic flow of centralized assertions to the RCM TLC matrix as default values.
- **Manual Override Support**: Ability to manually override inherited assertions at the control level when specific circumstances require it.
- **Database Schema Update**: New `account_assertions` table to persist centralized mapping.
- **Localization**: Full support for Indonesian and English labels for all assertion-related UI.
- **Data Integrity**: Integration of unsaved changes warning in the BPM assertion table.

## Capabilities

### New Capabilities
- `account-assertion-mapping`: Centralized management of financial assertions per GL Account/FSLI.

### Modified Capabilities
- `rcm-bpm-visualization`: Requirements modified to support assertion inheritance and display in the BPM worksheet view.
- `scoping-management`: Integration of assertion data into the scoping and RCM matrix outputs.

## Impact

- `worker/db/schema.ts`: Addition of `accountAssertions` table.
- `src/pages/bpm/BPMPage.tsx`: New assertion configuration table.
- `src/pages/rcm/RCMTLCPage.tsx`: Updated to support inheritance and manual overrides.
- `worker/user-routes.ts`: New API endpoints for assertion management and updated RCM fetch logic.
- `shared/types.ts`: New `AccountAssertion` interface.
- `src/i18n/`: New translation keys for assertions and tooltips.
