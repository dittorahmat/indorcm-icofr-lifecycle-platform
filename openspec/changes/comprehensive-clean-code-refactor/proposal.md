## Why

The IndoGRC Pro codebase has grown significantly, leading to "monster files" that violate the Single Responsibility Principle (SRP), duplicated logic for audit logging (DRY violation), and tightly coupled UI components. This refactoring is essential to maintain development velocity, reduce technical debt, and ensure the system remains robust and auditable as per Regulation SK-5/DKU.MBU/11/2024.

## What Changes

- **Backend Logic Extraction**: Extract complex business logic from Hono routers (`rcm.ts`, `scoping.ts`) into a dedicated Service Layer (`worker/services/`).
- **Audit Logging Consolidation**: Replace manual audit log entries in every route with a centralized `AuditService` that handles `dataBefore`/`dataAfter` comparisons automatically.
- **RBAC Middleware**: Implement a declarative Role-Based Access Control middleware for Hono to replace manual role checks in each endpoint.
- **Frontend Component Decomposition**: Split large components like `ControlEditor.tsx` and `RCMList.tsx` into smaller, reusable, and domain-focused sub-components.
- **Domain-Specific Hooks**: Move `useQuery` and `useMutation` logic into custom hooks (e.g., `useControls`, `useScoping`) to separate API logic from UI rendering.
- **Type and Constant Organization**: Reorganize `shared/types.ts` and extract static UI constants (like COSO principles) into dedicated files.

## Capabilities

### New Capabilities
- `clean-code-foundation`: Establishes the architectural standards for Service Layers, centralized Audit logging, and RBAC middleware.

### Modified Capabilities
<!-- No requirement changes, only structural refactoring. -->

## Impact

- **Backend**: `worker/app.ts`, `worker/routes/`, `worker/services/`.
- **Frontend**: `src/pages/rcm/`, `src/components/rcm/`, `src/hooks/`.
- **Shared**: `shared/types.ts`.
