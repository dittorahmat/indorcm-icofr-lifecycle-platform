## 1. Database & Migration

- [x] 1.1 Add `riskLibraryId` to `rcms` table in `worker/db/schema.ts`.
- [x] 1.2 Run `bun drizzle-kit generate` and `bun drizzle-kit push`.

## 2. Backend Logic

- [x] 2.1 Update `POST /api/rcm` in `worker/user-routes.ts` to accept `riskLibraryId`.

## 3. Localization (i18n)

- [x] 3.1 Create `src/i18n/locales/en/risklibrary.json`.
- [x] 3.2 Create `src/i18n/locales/id/risklibrary.json`.
- [x] 3.3 Register `risklibrary` namespace in `src/i18n/config.ts`.

## 4. UI Refactor

- [x] 4.1 Update `src/pages/rcm/RiskLibraryPage.tsx` to use `t()` for all labels.
- [x] 4.2 Update `src/components/rcm/BPMEditor.tsx` sidebar to use localized strings.
- [x] 4.3 Update `src/components/rcm/ControlEditor.tsx` lookup button to be localized.
