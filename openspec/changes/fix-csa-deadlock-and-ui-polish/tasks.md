## 1. Preparation & Database

- [x] 1.1 Synchronize database schema using `npx drizzle-kit push` to ensure local dev consistency.

## 2. CSA Assessment Logic Fixes

- [x] 2.1 Refactor `isDirty` state in `CSATabContent.tsx` to remove the `!activeCsaId` constraint, allowing proper dirty state detection for drafts.
- [x] 2.2 Update `isReadOnly` logic in `CSATabContent.tsx` to enable editing for draft records while maintaining read-only status for finalized assessments.
- [x] 2.3 Add `uploadMutation.isPending` check to the evidence upload button in `CSATabContent.tsx` to show a loading spinner.
- [x] 2.4 Add `disabled={isReadOnly || uploadMutation.isPending}` to the upload button for clear visual feedback.
- [x] 2.5 Implement `e.target.value = ''` in `onFileChange` to allow re-uploading the same file if needed.

## 3. Sidebar & Notification Polish

- [x] 3.1 Implement a `PendingNotificationBadge` component (or equivalent logic) in `AppSidebar.tsx` to fetch unread notification counts.
- [x] 3.2 Update the "Notifications" menu item in `AppSidebar.tsx` to display the notification count/badge.
- [x] 3.3 Ensure the sidebar groups and labels follow the latest design standardization.

## 4. Localization Sync

- [x] 4.1 Update `src/i18n/locales/id/csa_hub.json` and `sidebar.json` with missing strings for the new UI elements.
- [x] 4.2 Update `src/i18n/locales/en/csa_hub.json` and `sidebar.json` to match the Indonesian translations.

## 5. Verification & Quality Gates

- [x] 5.1 Run project type-checking via `tsc` (or `npm run type-check`) and fix any discovered errors.
- [x] 5.2 Run linting via `npm run lint` and resolve any stylistic or code-quality issues.
- [x] 5.3 Execute a production build via `npm run build` to ensure the application is deployment-ready.
