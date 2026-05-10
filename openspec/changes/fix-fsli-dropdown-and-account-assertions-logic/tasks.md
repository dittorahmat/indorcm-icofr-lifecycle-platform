## 1. Backend Refactor & API Fixes

- [x] 1.1 Create `worker/routes/account-assertions.ts` and migrate legacy assertion logic from `user-routes.ts`.
- [x] 1.2 Implement filtering by `fsliName` and `noGL` in `GET /api/account-assertions`.
- [x] 1.3 Implement atomic upsert logic in `POST /api/account-assertions`.
- [x] 1.4 Mount the new account-assertions route in `worker/app.ts`.
- [x] 1.5 Run `npx drizzle-kit push` to ensure schema consistency.

## 2. Frontend Logic Update

- [x] 2.1 Update `BPMPage.tsx` query for `activeSim` to fall back from Approved to Draft/Pending status.
- [x] 2.2 Refactor `significantFsliNames` memo in `BPMPage.tsx` to correctly derive "In Scope" FSLIs from the latest simulation and apply hierarchical sorting based on `noUrut`.
- [x] 2.3 Update `accountAssertion` query in `BPMPage.tsx` to use the new filtered API endpoint.
- [x] 2.4 Update `updateAssertionMutation` in `BPMPage.tsx` to use the new single-record upsert endpoint.

## 3. UX & UI Enhancements

- [x] 3.1 Integrate `useUnsavedChanges` hook in `BPMPage.tsx` to track the "dirty" state of the assertions worksheet.
- [x] 3.2 Create `src/components/layout/NotificationBell.tsx` component.
- [x] 3.3 Add the `NotificationBell` to the `AppSidebar.tsx` (or appropriate layout component).
- [x] 3.4 Ensure the notification bell correctly displays unread counts from `/api/notifications/unread-count`.

## 4. Localization & Cleanup

- [x] 4.1 Update `src/i18n/` JSON files (ID/EN) with labels for notifications and assertion status.
- [x] 4.2 Refactor `BPMPage.tsx` to remove legacy code smells and ensure compliance with Clean Code/SOLID principles.
- [x] 4.3 Verify and fix any broken deep-links from `ScopingPage.tsx` to `BPMPage.tsx`.

## 5. Validation & Verification

- [x] 5.1 Run `npm run typecheck` and fix any TypeScript errors.
- [x] 5.2 Run `npm run lint` and perbaiki formatting issues.
- [x] 5.3 Run `npm run build` to ensure the application is production-ready.
- [x] 5.4 Perform manual E2E verification: Scoping -> Deep link -> BPM -> Dropdown check -> Assertion Save -> Unsaved Warning.
