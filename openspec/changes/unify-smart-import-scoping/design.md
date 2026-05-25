## Context

To simplify the user journey, we are consolidating two redundant upload flows into one high-intelligence modal. The "Scoping" page will remain the central hub, and its "Upload GL" button will now act as a gateway to the AI-powered import engine.

## Goals / Non-Goals

**Goals:**
- Merge the "Migration" functionality into the "Scoping" page.
- Clean up navigation by removing redundant pages and routes.
- Ensure data imported via the new wizard is immediately active and visible.

**Non-Goals:**
- Changing the underlying AI prompts or normalization logic (already implemented and working).
- Merging all other operational pages (RCM/BPM remain separate for now).

## Decisions

### 1. Refactor MigrationPage into SmartImportWizard
The logic from `MigrationPage.tsx` will be extracted into a reusable `SmartImportWizard.tsx` component that uses a `Dialog` (Shadcn/UI).
- **Rationale**: Keeps the codebase DRY and allows for future reuse if other pages need similar ingestion logic.

### 2. Update ScopingPage State
`ScopingPage.tsx` will be updated to manage the modal visibility state and trigger a `queryClient.invalidateQueries()` upon modal closure.

### 3. Sidebar and Routing Removal
- Remove `/rcm/migration` from `src/main.tsx`.
- Remove "Smart Migration" item from `src/components/app-sidebar.tsx`.
- Remove `rcm:migration` keys from localization files if they are only used for that page.

## Risks / Trade-offs

- **[Risk] Modal Complexity** → [Mitigation] Use a clear stepper/wizard progress indicator to avoid overwhelming the user inside a dialog.
- **[Risk] Data Sync Delay** → [Mitigation] Use TanStack Query's invalidation to ensure the background tables are updated before the user notices.
