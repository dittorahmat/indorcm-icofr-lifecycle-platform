## Context

In the ICOFR scoping module, `GLDataGrid` displays qualitative assessment ratings (the 8 pillars) for each FSLI group. When `assessmentData` for a simulation is empty (`{}`), `GLDataGrid` falls back to `""`, causing the UI to render `"-"` instead of the regulatory default `"Low"`. Additionally, when saving simulations via `useScopingEditor`, empty `assessmentData` can overwrite backend data. Existing database records also need a backfill script to populate missing assertion data. Finally, `SmartImportWizard` displays `#minNoUrut` badges in the benchmark selection dropdown.

## Goals / Non-Goals

**Goals:**
- Guarantee that unassessed qualitative pillars in `GLDataGrid` render as `"Low"` by default.
- Ensure `useScopingPage` / `useScopingEditor` auto-populates default ratings when loading/saving simulations so `assessmentData` never gets overwritten with empty objects.
- Create and execute a database backfill script (`scripts/backfill-scoping-assertions.ts`) to repair existing database records.
- Remove `#minNoUrut` badges from the benchmark basis selection dropdown in `SmartImportWizard.tsx`.

**Non-Goals:**
- Changing existing user-defined overrides (`"Medium"`, `"High"`) stored in simulations.
- Altering the backend quantitative calculation logic (`calculateOM`, `calculatePM`).

## Decisions

### 1. Defensive UI Fallback in `GLDataGrid.tsx`
- **Decision**: Update `currentLevel` resolution in rule columns:
  `const currentLevel = assessmentData?.[fsliName]?.[rule.id] || "Low";`
- **Rationale**: Immediate visual fix ensuring no FSLI pillar appears as empty `"-"` even if backend state is unpopulated.

### 2. Database Backfill Script (`scripts/backfill-scoping-assertions.ts`)
- **Decision**: Build a runnable TypeScript script using Drizzle ORM to query all existing `simulations` records whose `assessmentData` is `{}` or empty, fetch the unique `fsliName` values from `glRows` matching `glSnapshotId`, populate defaults via `getQualitativeDefaults`, and update DB rows.
- **Rationale**: Ensures 100% database sanitization for existing simulations without relying solely on user interaction.

### 3. State & Persistence Self-Healing in `useScopingEditor` & Backend
- **Decision**: When initializing `simState` or updating simulation data, ensure `assessmentData` merges defaults for all unique FSLIs present in GL rows.
- **Rationale**: Prevents saving empty `{}` to the database upon user edits/recalculations.

### 4. Clean Benchmark Basis Dropdown in `SmartImportWizard.tsx`
- **Decision**: Remove the `#{item.minNoUrut}` `<span>` element inside `CommandItem` in `SmartImportWizard.tsx`.
- **Rationale**: Simplifies the dropdown UI as requested by the user.

## Risks / Trade-offs

- **[Risk]**: Overriding intentional empty states.
  - **Mitigation**: Under SK-5/2024, qualitative risk pillars default to "Low" by specification; empty string is not a valid regulatory status.
