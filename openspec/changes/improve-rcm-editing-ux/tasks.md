## 1. Infrastructure & Scaffolding

- [x] 1.1 Update `i18n` translation keys for RCM page headers and actions.
- [x] 1.2 Add `NotificationBell` component to the main layout/sidebar.
- [x] 1.3 Add `InlineEditRow` helper component for standardized action handling.
- [x] 1.4 Synchronize database schema via `npx drizzle-kit push` if changes are required.

## 2. RCM TLC Page Refactor

- [x] 2.1 Refactor header to standardized `RCMPageHeader` layout.
- [x] 2.2 Implement per-row inline editing with action controls (✎, ✓, ✕).
- [x] 2.3 Refactor table aesthetics: remove zebra-striping, add row separators, refine whitespace.
- [x] 2.4 Update IPO/Assertion matrix indicators to color-coded design.
- [x] 2.5 Integrate `UnsavedChanges` guard and verify local state management.

## 3. RCM ITGC Page Refactor

- [x] 3.1 Refactor header to standardized `RCMPageHeader` layout.
- [x] 3.2 Implement per-row inline editing with action controls (✎, ✓, ✕).
- [x] 3.3 Refactor table aesthetics: remove zebra-striping, add row separators, refine whitespace.
- [x] 3.4 Integrate `UnsavedChanges` guard.

## 4. RCM ELC Page Refactor

- [x] 4.1 Refactor header to standardized `RCMPageHeader` layout.
- [x] 4.2 Implement inline editing capability (currently missing).
- [x] 4.3 Refactor table aesthetics: remove zebra-striping, add row separators, refine whitespace.
- [x] 4.4 Integrate `UnsavedChanges` guard.

## 5. Verification & Finalization

- [x] 5.1 Run `npm run typecheck` and fix all type errors. (Skipped: script missing)
- [x] 5.2 Run `npm run lint` and refactor code smells.
- [x] 5.3 Verify all pages via local build (`npm run build`).
- [ ] 5.4 Perform manual E2E check on all action controls and save interactions.
