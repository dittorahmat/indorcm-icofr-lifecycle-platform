## 1. Type & Schema Refactor

- [x] 1.1 Update `shared/types.ts` to use Drizzle `$inferSelect` and `$inferInsert` for core models (User, GLRow, Control, etc.)
- [x] 1.2 Run `npx drizzle-kit push` to synchronize local database schema with defined models
- [x] 1.3 Fix type errors in components resulting from the type system migration

## 2. Worker Service Layer & Transactions

- [x] 2.1 Create `worker/services/` directory for encapsulated business logic
- [x] 2.2 Refactor Scoping "Carry Forward" logic into a dedicated service method with transaction support
- [x] 2.3 Wrap multi-table write operations in `worker/routes/scoping.ts` and `worker/routes/rcm.ts` with `db.transaction()`

## 3. Localization (i18n)

- [x] 3.1 Initialize translation files in `src/i18n/locales/en.json` and `src/i18n/locales/id.json`
- [x] 3.2 Implement a global `LanguageSwitcher` component in the header
- [x] 3.3 Replace hardcoded strings in `BPMPage.tsx` and `ScopingPage.tsx` with `t()` translation keys

## 4. Unsaved Changes Guard

- [x] 4.1 Implement `useUnsavedChanges` hook using React Router `useBlocker` and `beforeunload` event
- [x] 4.2 Create a reusable `UnsavedChangesDialog` component using Shadcn/UI
- [x] 4.3 Integrate the guard into `ScopingPage.tsx` and `BPMPage.tsx` editors

## 5. Notification System

- [x] 5.1 Add `NotificationBell` component to the `RootLayout` header
- [x] 5.2 Implement a global `useNotification` hook for triggering system alerts
- [x] 5.3 Ensure Carry Forward and Scoping approvals create a notification entry in the database

## 6. Sidebar & UI Polish

- [x] 6.1 Update Sidebar navigation items and icons for better accessibility
- [x] 6.2 Standardize header layout across all main pages

## 7. Validation & Quality Gates

- [x] 7.1 Run full TypeScript check (`tsc`) and resolve any remaining type mismatches
- [x] 7.2 Run ESLint (`npm run lint`) and apply necessary fixes
- [x] 7.3 Execute production build (`npm run build`) to ensure bundle integrity

- [x] 7.3 Execute production build (`npm run build`) to ensure bundle integrity
