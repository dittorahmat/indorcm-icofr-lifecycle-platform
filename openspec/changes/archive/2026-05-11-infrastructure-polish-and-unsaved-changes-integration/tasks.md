## 1. Backend Refactoring & Fixes

- [x] 1.1 Create `worker/services/bpm-service.ts` and extract logic from `worker/routes/bpm.ts`.
- [x] 1.2 Create `worker/routes/audit.ts` to implement the missing `/api/changelogs` endpoint.
- [x] 1.3 Update `worker/app.ts` to mount the new `audit` route and verify RBAC middleware consistency.
- [x] 1.4 Consolidate all manual audit logging in `bpm.ts`, `csa.ts`, and `remediation.ts` to use `AuditService.logAction`.
- [x] 1.5 Run `npx drizzle-kit push` to synchronize database schema.

## 2. Frontend Decomposition (Monster Component Cleanup)

- [x] 2.1 Create `src/hooks/useCSA.ts` to encapsulate logic from `CSATabContent.tsx`.
- [x] 2.2 Extract `CSADiagramView.tsx` from `CSATabContent.tsx`.
- [x] 2.3 Extract `CSAForm.tsx` from `CSATabContent.tsx`.
- [x] 2.4 Extract `CSAList.tsx` from `CSATabContent.tsx`.
- [x] 2.5 Refactor `CSATabContent.tsx` to be a slim orchestrator of the new sub-components.

## 3. Infrastructure & Safety Net

- [x] 3.1 Restore `src/hooks/useUnsavedChanges.ts` and `src/components/ui/UnsavedChangesDialog.tsx` from archive.
- [x] 3.2 Add `unsaved_changes` translation namespace to `src/i18n/locales/`.
- [x] 3.3 Integrate `useUnsavedChanges` into `BPMPage.tsx`, `ScopingPage.tsx`, and `ControlEditor.tsx`.
- [x] 3.4 Refine `NotificationBell.tsx` to use live unread counts.
- [x] 3.5 Update `sidebar.tsx` to ensure all links (including the fixed Change Log) are present and highlighted.

## 4. Verification & Standards

- [x] 4.1 Verify `/api/changelogs` returns data and is correctly displayed in `ChangeLogPage.tsx`.
- [x] 4.2 Verify navigation guards work for both internal and external events.
- [x] 4.3 Verify BPM diagram hydration still works correctly after service extraction.
- [x] 4.4 Run `npm run build` and `npm run type-check` to ensure project integrity.
- [x] 4.5 Run `npm run lint` and fix any new warnings.
