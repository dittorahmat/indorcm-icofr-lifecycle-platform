## 1. Database & Migration

- [x] 1.1 Create migration script to clean `significantAccounts` in `simulations` table.
- [x] 1.2 Run `npx drizzle-kit push` to apply schema changes.

## 2. Core Logic Refactoring

- [x] 2.1 Refactor `ScopingPage.tsx` logic to group significant accounts by FSLI before flagging.
- [x] 2.2 Verify logic with the new cleanup script.

## 3. UI Enhancements

- [x] 3.1 Implement Notification Bell component in `AppLayout`.
- [x] 3.2 Update Sidebar navigation to include Scoping/New Features.
- [x] 3.3 Apply I18n localization for new UI labels.
- [x] 3.4 Integrate UnsavedChanges guard into the updated scoping flows.

## 4. Verification & Polish

- [x] 4.1 Run unit tests for updated scoping logic.
- [x] 4.2 Run type check, linting, and build.
- [x] 4.3 Clean up code smells and apply DRY/KISS/YAGNI principles.
