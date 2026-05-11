## Context

The IndoGRC Pro application has several high-complexity domains (BPM, CSA, Reports). These have resulted in large, monolithic files that mix concerns. We have already established a `Service Layer` in the backend and some `Domain Hooks` in the frontend, but the adoption is inconsistent, leaving "monster files" that are hard to maintain.

## Goals / Non-Goals

**Goals:**
- **Separation of Concerns**: Isolate data fetching, business logic, and UI rendering.
- **Improved Testability**: Smaller, focused units are easier to unit test.
- **DRY (Don't Repeat Yourself)**: Move repeated logic (like extracting risk-control pairs from BPM nodes) into shared utilities or hooks.
- **Fail Fast Fix Early**: Ensure that the refactor doesn't break existing functionality by maintaining 100% build and test pass rate.

**Non-Goals:**
- **New Features**: No functional changes or new business requirements.
- **Database Schema Migration**: While splitting `schema.ts` is considered, we avoid changing the actual database structure (e.g., adding/removing columns) unless strictly necessary for the refactor.
- **UI Redesign**: No visual changes unless necessary for component decomposition.

## Decisions

### 1. Component Decomposition Pattern (Atomic/Molecular)
We will decompose large pages into a "Page Container" (handling data orchestration) and several "Feature Sections" (handling specific sub-domains).
- **Rationale**: Keeps the page component lightweight and focuses on layout, while sub-components focus on specific UI logic.

### 2. Domain Hook Extraction
All `useQuery` and `useMutation` logic will be moved from pages to custom hooks in `src/hooks/`.
- **Rationale**: Centralizes API interaction and allows for easier mocking in tests.

### 3. Service Layer Method Splitting
In `BpmService`, methods like `updateDiagram` will be refactored into:
- `updateDiagramMetadata()`
- `syncNodeRcmMappings()`
- `syncRisksAndControlsFromNodes()`
- **Rationale**: Follows SRP and makes the complex diagram sync logic more readable and debuggable.

### 4. Hook Decomposition for `useCSA`
Break `useCSA.ts` into:
- `useCSACore`: Basic CRUD and list fetching.
- `useCSAForm`: React Hook Form setup and validation logic.
- `useCSADiagramLink`: Logic for extracting risk-control pairs from diagrams.
- **Rationale**: `useCSA` currently handles too many disparate responsibilities.

## Risks / Trade-offs

- **[Risk] Broken API Endpoints** → [Mitigation] Maintain existing API signatures. Use `type-check` to verify that route changes don't break consumers.
- **[Risk] Regression in Complex Logic** → [Mitigation] Perform manual smoke tests and rely on existing Vitest suites. Ensure `npm test` passes after each atomic change.
- **[Risk] Scope Creep** → [Mitigation] Strictly follow the tasks.md and avoid "just-in-case" refactoring of unrelated code.
