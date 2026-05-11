## Why

The IndoGRC Pro codebase contains several "monster files" and "monster hooks" that violate the Single Responsibility Principle (SRP) and hinder maintainability. As the system scales, these large files lead to higher cognitive load, increased risk of regressions during updates, and difficulty in testing isolated logic. This refactoring is necessary to align the codebase with Clean Code, SOLID, and DRY principles, ensuring long-term development velocity.

## What Changes

- **BPM Page Decomposition**: Break down the 46KB `BPMPage.tsx` into domain-focused sub-components and hooks.
- **CSA Hook Splitting**: Refactor the 14KB `useCSA.ts` into smaller, specialized hooks (e.g., `useCSAForm`, `useCSAQueries`, `useCSAMappings`).
- **Reports and Testing Page Refactoring**: Decompose `ReportsPage.tsx` and `TestWorkbench.tsx` to separate data fetching, visualization logic, and form management.
- **Service Layer Modularization**: Split the 21KB `bpm-service.ts` and refactor large methods like `updateDiagram` into smaller, cohesive private methods.
- **Domain-Specific Hook Adoption**: Transition pages away from direct `useQuery` calls to using encapsulated domain hooks.
- **Schema Organization**: (Optional) Consider splitting `schema.ts` if it simplifies backend development.

## Capabilities

### New Capabilities
- `code-hygiene`: Establishes modular architecture standards for monster components and services to ensure SRP and maintainability.

### Modified Capabilities
<!-- No requirement changes, strictly structural refactoring. -->

## Impact

- **Frontend Pages**: `src/pages/bpm/BPMPage.tsx`, `src/pages/reports/ReportsPage.tsx`, `src/pages/testing/TestWorkbench.tsx`, `src/pages/csa/TodoListPage.tsx`.
- **Frontend Hooks**: `src/hooks/useCSA.ts`, `src/hooks/use-rcm.ts`, `src/hooks/use-controls.ts`.
- **Backend Services**: `worker/services/bpm-service.ts`.
- **Backend Schema**: `worker/db/schema.ts`.
