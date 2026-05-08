## Context

The `CSATabContent.tsx` component currently employs a read-only logic that relies on `isDirty` being `false` if an `activeCsaId` is present. This creates a deadlock where saved drafts or existing records cannot be edited, preventing control verification and evidence upload. Additionally, the user wants to polish the UI with a notification bell in the sidebar, sync localization, and ensure all changes follow established quality gates (type-check, lint, build).

## Goals / Non-Goals

**Goals:**
- Fix the state deadlock in `CSATabContent.tsx` to allow editing of drafts/records.
- Enhance the Evidence Upload UI with loading indicators and visual feedback.
- Add a Notification Bell to the Sidebar to highlight unread system alerts.
- Synchronize localization strings for CSA and Sidebar across Indonesian and English.
- Run Drizzle migrations to ensure database consistency.
- Verify project integrity via standard build tools (`tsc`, `lint`, `vite build`).

**Non-Goals:**
- Refactoring the entire CSA data model.
- Implementing a full-blown notification backend (will use existing mock/API endpoints).

## Decisions

- **State Management Fix**: 
  - Refactor `isDirty` in `CSATabContent.tsx` to remove the `!activeCsaId` constraint. 
  - Update `isReadOnly` to check for record finalization (e.g., `!activeCsa.isDraft`) rather than just existence.
  - Decision: Use `form.formState.isDirty` as the primary driver for unsaved changes detection.

- **UI Polish (Evidence Upload)**:
  - Add a spinner to the upload button using `uploadMutation.isPending`.
  - Disable the button visually and functionally if `isReadOnly` is true, providing a tooltip explaining why.

- **Notification Bell**:
  - Implement a `NotificationBell` component that queries `/api/notifications/unread-count`.
  - Place this bell next to the "Notifications" item in `AppSidebar.tsx` or as a top-level header element.
  - Decision: Integrated badge into the `Megaphone` icon in the sidebar for consistency with the `PendingApprovalBadge` pattern.

- **Localization**:
  - Consolidate all CSA and Sidebar strings into `public/locales/{id,en}/`.

## Risks / Trade-offs

- [Risk] Modifying the read-only logic might allow unauthorized edits to finalized records. → [Mitigation] Strictly check `activeCsa.isDraft === false` and user role permissions before enabling edit mode.
- [Risk] Running `drizzle-kit push` might cause data loss if schema changes are destructive. → [Mitigation] Perform a dry-run or backup data if significant migrations are detected.
