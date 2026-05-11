## 1. Backend Service Layer

- [x] 1.1 Create `worker/services/scoping-service.ts` with methods for `submitSimulation`, `purgeData`, and `setActiveSnapshot`.
- [x] 1.2 Refactor `worker/routes/scoping.ts` to delegate all business logic to `ScopingService`.
- [x] 1.3 Remove `JSON.parse(JSON.stringify())` hacks from `AuditService` and replace with proper structured cloning or interface-based diffing.

## 2. Shared Regulatory Math

- [x] 2.1 Create `src/pages/scoping/services/materiality-calc.ts` and migrate all formulas from `compliance-utils.ts`.
- [x] 2.2 Add unit tests for `materiality-calc.ts` covering all multipliers from SK-5 Table 12.
- [x] 2.3 Refactor `src/lib/scoping-logic.test.ts` to import pure functions instead of re-implementing them.

## 3. Frontend logic extraction

- [x] 3.1 Create `src/pages/scoping/services/gl-parser.ts` and migrate Papa/XLSX parsing logic from `ScopingPage.tsx`.
- [x] 3.2 Create `src/pages/scoping/hooks/useScopingPage.ts` custom hook to manage state, mutations, and derived data.
- [x] 3.3 Verify hook logic with `@testing-library/react-hooks` or via component smoke tests.

## 4. Component Decomposition

- [x] 4.1 Extract `MaterialityParamsCard` into `src/pages/scoping/components/`.
- [x] 4.2 Extract `ScopingSimulationForm` into `src/pages/scoping/components/`.
- [x] 4.3 Extract `ScopingEditorHeader` and `ScopingEditorContent` to separate UI concerns from logic.
- [x] 4.4 Final integration of `ScopingPage.tsx` as a high-level orchestrator (clean entry point).

## 5. Verification & Validation

- [x] 5.1 Run `npm run type-check` to ensure no broken imports after component moving.
- [x] 5.2 Run `npm run lint` and ensure clean code standards.
- [x] 5.3 Run `npm test` and verify 100% pass rate for new scoping service tests.
- [x] 5.4 Perform manual smoke test on GL upload and simulation save.
