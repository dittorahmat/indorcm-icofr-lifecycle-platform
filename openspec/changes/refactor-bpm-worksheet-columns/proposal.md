## Why

The current BPM Worksheet contains redundant and confusing column structures. "Informasi Proses Bisnis (Lvl 2)" is redundant as it was intended to be dropped in the database but remains in the UI. Additionally, the ordering of key columns like "Nama Aktivitas Pengendalian" is not optimized for data entry flow. Renaming "Lvl 1" to a more general "Informasi Proses Bisnis" aligns better with a simplified hierarchy.

## What Changes

- **REMOVAL**: Remove "Informasi Proses Bisnis (Lvl 2)" column from the BPM Worksheet UI and its associated code paths.
- **MODIFICATION**: Rename "Informasi Proses Bisnis (Lvl 1)" to "Informasi Proses Bisnis" in the UI and refactor the backend field from `businessProcessLvl1` to `businessProcess`.
- **REORDER**: Move "Nama Aktivitas Pengendalian" column to be positioned between "Informasi Sub-Proses Bisnis" and "Lokasi".
- **TRANSLATION**: Update i18n localization files (en/id) to reflect these naming changes and remove unused keys.
- **BREAKING**: Renaming database column `business_process_lvl1` to `business_process` via Drizzle migration.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `bpm-workflow`: Updating the worksheet structure and data model for business process information.

## Impact

- **Database**: Schema change (rename column) and Drizzle migration.
- **API**: Update `/api/controls` and `/api/controls/:id/bpm-update` to use new field names.
- **Frontend**: Update `BPMWorksheet.tsx` columns definition, layout, and translation keys.
- **Shared**: Update `Control` interface in `shared/types.ts`.
