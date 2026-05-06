## 1. Setup & Dependencies

- [x] 1.1 Add `html-to-image` dependency to `package.json`.
- [ ] 1.2 Run `npm install`.

## 2. Backend & Data Layer

- [x] 2.1 Add `bpm_exports` table to `worker/db/schema.ts`.
- [x] 2.2 Run Drizzle migration: `npx drizzle-kit push`.
- [x] 2.3 Implement `POST /api/bpm-exports` route in `worker/user-routes.ts` to log export events.
- [x] 2.4 Implement `GET /api/bpm-exports` route for history retrieval.

## 3. Localization

- [x] 3.1 Add export-related translation keys to `src/i18n/locales/id/bpm.json`.
- [x] 3.2 Add export-related translation keys to `src/i18n/locales/en/bpm.json`.
- [x] 3.3 Add global notification keys to `common.json` if needed.

## 4. Frontend: Core Implementation

- [x] 4.1 Update `BPMEditor.tsx` to include `isExporting` state.
- [x] 4.2 Integrate `useUnsavedChanges` hook to protect the export process.
- [x] 4.3 Refactor `exportToImage` function to use `html-to-image` and `jsPDF`.
- [x] 4.4 Implement `fitView` synchronization before snapshot capture.
- [x] 4.5 Add a visual loading overlay during the export process.
- [x] 4.6 Trigger success notification via `NotificationBell` on completion.

## 5. Verification & Cleanup

- [x] 5.1 Run `npm run lint` and fix any errors.
- [x] 5.2 Run `npm run build` (which includes type check) to ensure production readiness.
- [x] 5.3 Manual verification of PDF quality and audit logs.
