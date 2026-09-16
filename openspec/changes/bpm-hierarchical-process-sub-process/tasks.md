## 1. Database Schema & Type Definitions

- [x] 1.1 Add `parentId` and `level` fields to `bpmProcesses` table in `worker/db/schema.ts` and sync database schema using `npx drizzle-kit push`
- [x] 1.2 Update `BPMProcess` and related types in `shared/types.ts` to include optional `parentId?: string | null` and `level?: 'process' | 'sub_process'`
- [x] 1.3 Verify database migration by running tests and checking schema reflection

## 2. Backend Service & API Routes

- [x] 2.1 Update `BpmService.getAllProcesses` in `worker/services/bpm-service.ts` to select `parentId` and `level`, and compute aggregated risk and control counts for parent processes
- [x] 2.2 Implement `batchReorganizeProcesses` in `worker/services/bpm-service.ts` supporting atomic promote and demote operations
- [x] 2.3 Add API route `POST /api/bpm-processes/batch-reorganize` with RBAC guard in `worker/routes/bpm.ts` and verify with integration/unit test

## 3. Frontend Expandable Tree & Hook Support

- [x] 3.1 Update `src/pages/bpm/hooks/useBPMPage.ts` to build hierarchical tree data (`children` array on parent processes) and expose selection and batch reorganization mutations
- [x] 3.2 Refactor `src/components/bpm/BPMDiagramList.tsx` into an expandable tree table with expand/collapse chevron toggles, badges for Process vs Sub-Process, and macro/micro diagram actions
- [x] 3.3 Create `src/components/bpm/BPMMigrationModal.tsx` supporting 2-way batch reorganization (Demote to Sub-Process under chosen target parent, Promote to Independent Process) with live preview
- [x] 3.4 Wire up checkbox selection and floating batch toolbar in `BPMPage.tsx` and `BPMDiagramList.tsx`

## 4. Internationalization & Quality Assurance (Mandat Penyelesaian Tahap)

- [x] 4.1 Add all i18n translation strings to `src/i18n/locales/en/bpm.json` and `src/i18n/locales/id/bpm.json` without any hardcoded strings
- [x] 4.2 Run `npm run type-check` and ensure 0 TypeScript errors
- [x] 4.3 Run `npm run lint` and ensure 0 ESLint warnings or errors
- [x] 4.4 Run `npm test` and add unit tests for hierarchical tree transformation and batch reorganization
- [x] 4.5 Run `npm run build` and ensure production build succeeds cleanly
