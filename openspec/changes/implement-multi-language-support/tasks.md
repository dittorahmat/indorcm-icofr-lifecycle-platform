# Tasks: Implement Multi-Language Support

## Phase 1: Database & Auth Setup
- [x] Add `language` column to `user` table in `worker/db/schema.ts`.
- [x] Update `better-auth` config in `worker/auth.ts` to include `language` in `additionalFields`.
- [x] Run database migration or `ALTER TABLE` to add the column.
- [x] Update `User` interface in `shared/types.ts`.

## Phase 2: i18n Foundation
- [x] Install `i18next react-i18next i18next-browser-languagedetector`.
- [x] Create `src/i18n/config.ts`.
- [x] Create directory structure for locales: `src/i18n/locales/{en,id}/`.
- [x] Create initial locale files: `common.json`, `sidebar.json`, `scoping.json`.

## Phase 3: Backend API
- [x] Implement `PUT /api/auth/profile` in `worker/user-routes.ts` to allow language updates.

## Phase 4: Frontend Implementation
- [x] Initialize `i18n` in `src/main.tsx`.
- [x] Implement `LanguageSwitcher` component.
- [x] Add `LanguageSwitcher` to `src/components/app-sidebar.tsx`.
- [x] Migrate `AppSidebar.tsx` to use `useTranslation`.
- [x] Migrate `Dashboard.tsx` to use `useTranslation`.
- [x] Migrate `ScopingPage.tsx` to use `useTranslation`.

## Phase 5: Testing & Validation
- [x] Verify language switching updates the database.
- [x] Verify language persists after refresh.
- [x] Audit translations for regulatory accuracy.
