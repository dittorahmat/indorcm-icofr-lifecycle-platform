## Why

Currently, the BPM export function relies on the browser's native `window.print()`, which produces poor quality PDFs with missing background colors, broken lines, and incorrect scaling. For a GRC platform, high-quality and consistent audit evidence is critical.

## What Changes

- **Snapshot Ingestion**: Replace native printing with a "Canvas Snapshot" approach using `html-to-image`.
- **Refined PDF Generation**: Use `jsPDF` to generate pixel-perfect documents with consistent orientation and scaling.
- **Audit Trail Logging**: Track every diagram export in the database (`bpm_exports` table) for regulatory compliance and accountability.
- **Improved UI Feedback**: Add loading states and integrate with the global `NotificationBell` to alert users when large exports are ready.
- **Data Integrity Gate**: Use `useUnsavedChanges` pattern to prevent users from navigating away or closing the editor while a high-resolution snapshot is being processed.
- **Localization**: Full support for ID/EN strings for all export-related messages and metadata.

## Capabilities

### New Capabilities
- `high-fidelity-diagram-export`: Capture complex React Flow diagrams as high-resolution images for regulatory reporting.
- `export-audit-trail`: Maintain a persistent log of all document exports including user, timestamp, and target diagram.

## Impact

- `worker/db/schema.ts`: Addition of `bpm_exports` table.
- `src/components/rcm/BPMEditor.tsx`: Overhaul of the `exportToImage` function and addition of unsaved changes protection.
- `src/i18n/`: New localization keys in `bpm.json` and `common.json`.
- `package.json`: Addition of `html-to-image` dependency.
