## Context

The CSA Assessment workspace (`CSATabContent.tsx`) is a critical component where Line 1 users verify control effectiveness. Currently, it relies on samples selected in the `TransactionSamplingTab`. If a user needs to test a sample not present in the system, they are blocked. Furthermore, the UI lacks grouping for verification points, leading to a "long tail" table that is difficult to process visually.

## Goals / Non-Goals

**Goals:**
- Enable manual sample entry with immediate synchronization across tables.
- Refactor the verification table to use a grouped layout (Sample-centric).
- Enhance readability by prioritizing Control Names over internal IDs.
- Integrate the standard `unsaved-changes-guard`.
- Ensure 100% compliance with type-check, lint, and build.

**Non-Goals:**
- Modifying the underlying database schema (existing fields are sufficient).
- Changing the biometric/GPS verification logic.

## Decisions

- **State Management**: Continue using `react-hook-form` with `useFieldArray`. Add a button that calls `append` with a template sample object containing empty `controlResults` for all `activeControls`.
- **Matrix UI**: Replace the static `sampleRef` `div` with a controlled `Input` component. This ensures that as the user types, the `watchSamples` state updates, triggering a re-render of the Detail table.
- **Detailed Table Grouping**: Instead of flattening all points with `.flatMap`, the Detail table will iterate through `watchSamples` and render a Sample Header for each, followed by individual control verification rows. This reduces the horizontal width of the table and improves vertical scanning.
- **Header Refinement**: In the Summary Matrix, use `ctrl.name` as the primary text (with `line-clamp-2`) and keep `ctrl.code` in the Tooltip.
- **Localization**: All new strings (e.g., "Add Manual Sample", "Type reference...") will be added to `src/i18n/locales/id/bpm.json` and its English counterpart.

## Risks / Trade-offs

- [Risk] Performance degradation with `useWatch` on a deep array → [Mitigation] Ensure `TableBody` components are optimized and avoid unnecessary state lifting.
- [Risk] Manual entries lacking `glRowId` → [Mitigation] Handle null/undefined `glRowId` gracefully in the UI and reports (showing "Manual Entry" or "N/A").
- [Risk] Missing Drizzle Sync → [Mitigation] Although no schema change is needed, run `npx drizzle-kit push` to ensure the local environment is fully synced with the latest `schema.ts`.
