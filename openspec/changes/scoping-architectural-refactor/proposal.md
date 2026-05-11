## Why

The Scoping module has become a critical "monster" area of technical debt. `ScopingPage.tsx` (~870 lines) violates the Single Responsibility Principle (SRP) by mixing UI orchestration, complex regulatory math, file parsing (CSV/Excel), and state management. This leads to fragile code, hard-to-maintain logic, and a lack of testability for core financial calculations required by SK-5.

## What Changes

- **Component Decomposition**: Break down `ScopingPage.tsx` into specialized sub-components (`MaterialityParams`, `SimulationForm`, `ScopingEditor`).
- **Logic Extraction (Custom Hooks)**: Move state and mutation orchestration into a dedicated `useScopingPage` hook.
- **Service Layer Implementation**: 
    - Extract materiality calculation logic into a pure service (`materiality-calc.ts`).
    - Extract file parsing logic into a specialized parser service (`gl-parser.ts`).
- **Backend Refactor**: Extract business logic from `worker/routes/scoping.ts` into a `ScopingService` to ensure consistency and reusability.
- **TDD Enforcement**: Replace duplicate test logic with direct imports of pure functions and add 100% coverage for regulatory math.

## Capabilities

### New Capabilities
- `scoping-service-layer`: Standardized backend service for all scoping operations.
- `regulatory-math-engine`: Pure, testable functions for materiality and multiplier calculations.

### Modified Capabilities
- `gl-integration`: Extracting parsing logic to be more modular and testable.

## Impact

- **Frontend**: `src/pages/scoping/` (Major refactor), `src/lib/compliance-utils.ts`.
- **Backend**: `worker/routes/scoping.ts`, `worker/services/scoping-service.ts` (New).
- **Tests**: `src/lib/scoping-logic.test.ts` (Refactor).
