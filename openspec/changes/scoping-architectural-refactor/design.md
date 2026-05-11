## Context

The current `ScopingPage.tsx` handles everything from file drop to final approval. This high coupling makes it difficult to add new regulatory rules or change parsing logic without risking breakages in UI state. The backend route `scoping.ts` also contains procedural code that is hard to unit test in isolation.

## Goals / Non-Goals

**Goals:**
- **Decouple View from Logic**: Separate React UI from business logic using custom hooks and pure services.
- **Unit Testability**: Achieve >90% coverage for the `materiality-calc.ts` and `gl-parser.ts` modules.
- **Service Layer**: Establish a `ScopingService` on the backend to centralize business rules.
- **Consistency**: Use the same parsing logic for both frontend (pre-upload validation) and backend (if needed).

**Non-Goals:**
- Changing the database schema (already handled in previous polish).
- Modifying the visual design or UX flow (only internal restructuring).
- Real-time updates.

## Decisions

### 1. Pure Function Services
- **Decision**: All SK-5 math (multiplier, OM, PM) will be moved to `src/pages/scoping/services/materiality-calc.ts` as pure functions.
- **Rationale**: Pure functions are easier to test and don't depend on React context or state.

### 2. Custom Hook for State Management
- **Decision**: Create `useScopingPage.ts` to manage the complex simulation state, mutations, and derived data (significant accounts).
- **Rationale**: Keeps the component focused on rendering and makes the logic reusable or testable via `@testing-library/react-hooks`.

### 3. Backend Service Layer
- **Decision**: Move logic for simulation submission, snapshot activation, and purged data from `worker/routes/scoping.ts` to `worker/services/ScopingService.ts`.
- **Rationale**: Standardizes how we interact with the DB and audit logs, following the pattern used in `RcmService`.

### 4. GL Parser Service
- **Decision**: Move CSV/XLSX parsing logic to `src/pages/scoping/services/gl-parser.ts`.
- **Rationale**: Parsing is a technical concern that shouldn't clutter the UI code.

## Risks / Trade-offs

- **[Risk]** → Regression in materiality values. **[Mitigation]** → Write comprehensive unit tests for `materiality-calc.ts` using historical data before swapping the logic.
- **[Risk]** → Component fragmentation (too many files). **[Mitigation]** → Group components logically in a `components/` subfolder within the scoping page directory.
