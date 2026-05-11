## 1. Database & Infrastructure

- [x] 1.1 Run `npx drizzle-kit generate` to capture any pending schema changes.
- [x] 1.2 Run `npx drizzle-kit push` to synchronize the development database schema.
- [ ] 1.3 Verify database connectivity and schema integrity via `npx drizzle-kit studio` if needed.

## 2. Localization Completion

- [x] 2.1 Perform a sweep of `src/pages/scoping/` and extract all hardcoded strings into `src/i18n/locales/`.
- [x] 2.2 Perform a sweep of `src/components/rcm/BPMEditor.tsx` and related components for localization.
- [x] 2.3 Update `src/components/app-sidebar.tsx` to use `useTranslation` for all menu item labels.
- [x] 2.4 Synchronize `en.json` and `id.json` to ensure all new keys have translations in both languages.

## 3. Unsaved Changes Integration

- [x] 3.1 Ensure `UnsavedChangesGuard` is correctly placed within the routing structure (e.g., in `RootLayout` or `AppLayout`).
- [x] 3.2 Update `src/pages/scoping/ScopingPage.tsx` to trigger `setDirty(true)` whenever materiality parameters or qualitative assessments are modified.
- [x] 3.3 Update `src/components/rcm/BPMEditor.tsx` to trigger `setDirty(true)` on any diagram change (node move, edge add, property edit).
- [x] 3.4 Verify that `resetDirty()` is called upon successful save in both modules.

## 4. UI Polish & Notifications

- [x] 4.1 Create `src/components/layout/NotificationBell.tsx` component with unread count badge.
- [x] 4.2 Integrate `NotificationBell` into the global header in `src/components/layout/AppLayout.tsx` or equivalent.
- [x] 4.3 Add a basic dropdown to the `NotificationBell` to display the last 5 notifications.
- [x] 4.4 Verify that clicking a notification marks it as read and redirects if a link is provided.

## 5. Verification & Finalization

- [x] 5.1 Run `npm run type-check` and resolve any new type errors.
- [x] 5.2 Run `npm run lint` and ensure no new linting violations are introduced.
- [x] 5.3 Run `npm run build` to verify production bundle integrity.
- [x] 5.4 Perform manual smoke tests: navigate away from a dirty Scoping page and verify the warning appears.
