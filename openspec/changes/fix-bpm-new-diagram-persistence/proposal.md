## Why

Creating new BPM diagrams fails to persist correctly because the `year` and `subProcess` fields are ignored by both the `POST` (creation) and `PUT` (update) backend handlers. This leads to diagrams being saved with `NULL` years, making them invisible in the year-filtered lists. Additionally, a frontend logic bug causes new diagrams to start as a blank canvas instead of showing the default "Mulai" node, which confuses users into thinking their creation failed.

## What Changes

- **Backend Update**: Modify `POST /api/bpm-diagrams` to accept and persist `year` and `subProcess` from the request body.
- **Backend Update**: Modify `PUT /api/bpm-diagrams/:id` to ensure `year` and `subProcess` are maintained or updated during the save process.
- **Frontend Logic Fix**: Update `BPMEditor.tsx` to correctly detect empty diagrams and initialize them with the default "Start" (Mulai) node.
- **Frontend API Alignment**: Update the save mutation in `BPMEditor.tsx` to send the `year` field to the backend.
- **Database Migration**: Generate and run Drizzle migrations to ensure the `bpm_diagrams` table is in sync with the schema (year/subProcess).
- **Localization & UX**: Fully localize the BPM Editor labels and ensure "Unsaved Changes" warnings are active and translated.

## Capabilities

### New Capabilities
- `bpm-diagram-persistence`: Ensures reliable creation, saving, and retrieval of BPM diagrams by correctly mapping them to fiscal years and sub-processes.
- `unsaved-changes-guard`: Integration of safety warnings to prevent data loss during navigation (compliant with global standards).

## Impact

- **Database**: New migration in `drizzle/` for `bpm_diagrams` metadata.
- **Localization**: Updates to `src/i18n/locales/*/bpm.json` and `common.json`.
- **Backend**: `worker/user-routes.ts` (`POST` and `PUT` handlers for `/api/bpm-diagrams`).
- **Frontend**: `src/components/rcm/BPMEditor.tsx` (state initialization, save mutation, and localization).
