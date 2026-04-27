## Why

Currently, IndoGRC Pro handles BPM, RCM, and Control data as a "Global Singleton" without year-based partitioning. As the application moves into its second year (2025), there is a critical need to preserve the integrity of previous compliance cycles (2024) for audit purposes while allowing for new cycles.

This change introduces **Temporal Versioning** to the ICOFR lifecycle, ensuring that data from each year is snapshotted, auditable, and easily carried forward into subsequent years.

## What Changes

- **Mandatory GL Year**: Scoping Simulation now requires a mandatory Fiscal Year selection.
- **Year-Based Partitioning**: `rcms`, `bpm_diagrams`, and `controls` will be partitioned by `year`.
- **"Carry Forward" Logic**: Automated duplication of BPM, RCM, and Controls from the previous year when starting a new compliance cycle.
- **Audit Snapshots**: Data from previous years will remain "Frozen" (read-only/archived) to ensure an immutable audit trail.
- **Unsaved Changes Integration**: Implementation follows the pattern from `implement-unsaved-changes-warning` to ensure data safety during multi-year configuration.

## Capabilities

### New Capabilities
- `temporal-versioning`: Ability to partition and snapshot compliance data (BPM, RCM, Controls) based on fiscal/calendar years.
- `compliance-data-migration`: Mechanism to carry forward (clone) compliance structures from one year to the next.

### Modified Capabilities
- `scoping-management`: Scoping logic updated to anchor all identified significant accounts and assignments to a specific fiscal year.
- `rcm-bpm-visualization`: BPM diagrams and RCM matrices updated to be versioned/year-aware.

## Impact

- **Database Schema**: New `year` columns in multiple tables and associated Drizzle migrations.
- **API Endpoints**: `POST /api/simulations` updated with carry-forward logic; list endpoints filtered by year.
- **Frontend Pages**: `ScopingPage.tsx` and `BPMPage.tsx` updated with year-selection awareness.
- **Localization**: All labels and messages localized in `@src/i18n/`.
