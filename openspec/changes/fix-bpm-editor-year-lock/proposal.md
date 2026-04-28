## Why

The `BPMEditor` uses a hardcoded `new Date().getFullYear()` to determine diagram locking, which incorrectly locks diagrams for previous years (e.g., 2025) even when the user is actively working on that year's cycle in April 2026. This prevents users from completing the mandatory ICOFR documentation for the preceding fiscal year. Additionally, new diagrams are being saved with NULL years or sub-processes due to incomplete backend mapping, causing them to disappear from filtered views.

## What Changes

- **BPMEditor Context Awareness**: Pass the active `viewYear` from `BPMPage.tsx` to `BPMEditor.tsx` to align the editor's logic with the user's selected working year.
- **Dynamic Locking Logic**: Replace the hardcoded year check with a comparison against the user's `viewYear`. Diagrams should only be locked if they belong to a year older than the `viewYear` or if the global `isPeriodLocked` flag is set.
- **Backend Persistence Alignment**: Update the `POST` and `PUT` handlers for `/api/bpm-diagrams` to strictly enforce and persist `year` and `subProcess` metadata.
- **Database Schema Sync**: Ensure the `bpm_diagrams` table correctly stores `year` (Integer) and `subProcess` (Text).
- **Localization**: Localize all editor labels, including the new "LOCKED" status indicator, in `src/i18n/locales/*/bpm.json`.
- **UX Safety**: Integrate the `UnsavedChangesGuard` to prevent data loss when navigating away from a modified diagram.

## Capabilities

### New Capabilities
- `bpm-cycle-management`: Logic for context-aware year editing and lifecycle-based locking (Audit Baseline vs. Draft).
- `bpm-diagram-persistence`: Ensures reliable creation, saving, and retrieval of BPM diagrams by correctly mapping them to fiscal years and sub-processes.

## Impact

- **Database**: Drizzle migration for `bpm_diagrams` if columns are missing; otherwise, data cleanup for NULL entries.
- **Backend**: `worker/user-routes.ts` (diagram creation and update endpoints).
- **Frontend**: 
  - `src/pages/bpm/BPMPage.tsx` (Prop passing and search param sync).
  - `src/components/rcm/BPMEditor.tsx` (Locking logic, save mutation, and localized labels).
  - `src/hooks/useUnsavedChanges.ts` (State tracking for diagrams).
- **Localization**: Updates to `src/i18n/locales/id/bpm.json` and `src/i18n/locales/en/bpm.json`.
