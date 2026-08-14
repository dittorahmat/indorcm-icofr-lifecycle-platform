# Applications Management Specification

## Requirements

### Requirement: Application Inventory Table Display
The Application Inventory table on `/applications` SHALL display:
1. `Application Name` without any embedded "SIGNIFICANT" inline pill badges.
2. `ICOFR Scope (Y/N)` column displaying "Yes" when `isSignificant` is true, and "No" otherwise.
3. `Business Owner` column displaying assigned department names (selected from registered departments).
4. `Application Owner` column displaying assigned department names (selected from registered departments).
5. `Application Architecture` column displaying document link or download icon for uploaded architecture PDFs.

### Requirement: Application Edit & Save Persistence
The Application Edit dialog SHALL:
1. Allow toggling ICOFR Scope (`isSignificant`).
2. Allow selecting multiple registered departments via searchable multi-select for `Business Owner`.
3. Allow selecting multiple registered departments via searchable multi-select for `Application Owner`.
4. Allow uploading PDF architecture documents.
5. Successfully persist updates via `PATCH /api/applications/:id` and reflect changes immediately upon save.
