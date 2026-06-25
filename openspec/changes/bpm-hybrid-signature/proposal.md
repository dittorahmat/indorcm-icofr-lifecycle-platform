## Why

Currently, the BPM print view / PDF export footer displays static, empty signature lines for "Disusun Oleh" (Lini 1), "Direview Oleh" (Lini 2), and "Disetujui Oleh" (CFO). To professionalize and streamline the workflow, these signature blocks should be dynamically populated based on the process's digital workflow sign-off history, while still providing the flexibility of manual editing and rename overrides directly in the UI.

## What Changes

- Add a hybrid signature sign-off system in the BPM Document View print/export canvas footer.
- The footer signature boxes will automatically display the name and date of the user who performed the corresponding workflow action (Submit for Lini 1, Review for Lini 2, Approve for CFO).
- Users can click and rename/edit the names and dates directly in the Document View UI.
- Edited signatures will override the defaults and be saved to the database inside the diagram's `metadata` JSONB column.
- The inputs will hide their borders and backgrounds when exporting/printing to ensure a clean, static document presentation.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->
None

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `bpm-execution-hub`: Add requirements for hybrid signature sign-off in the diagram print/PDF canvas footer.

## Impact

- `src/components/rcm/BPMEditor.tsx` (Component logic)
- `src/components/rcm/nodes/BPMCanvasLayout.tsx` (Footer rendering & input integration)
- `worker/services/bpm-service.ts` (API to persist diagram metadata)
- `src/i18n/locales/en/bpm.json` and `src/i18n/locales/id/bpm.json` (Translation keys)
