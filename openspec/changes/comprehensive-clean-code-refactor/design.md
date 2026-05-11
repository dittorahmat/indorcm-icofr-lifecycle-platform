## Context

IndoGRC Pro currently uses a "fat router" pattern in its Cloudflare Worker (Hono), where business logic, database queries, and authorization checks are co-located in route handlers. This has led to large, difficult-to-maintain files like `rcm.ts` and `scoping.ts`. Similarly, the React frontend has large components that manage their own API calls and complex state, violating the principle of separation of concerns.

## Goals / Non-Goals

**Goals:**
- Implement a **Service Layer** to encapsulate business logic and database interactions.
- Centralize and automate **Audit Logging** to ensure consistency and reduce boilerplate.
- Standardize **Role-Based Access Control (RBAC)** using declarative middleware.
- Modularize **Frontend Components** and extract domain logic into **Custom Hooks**.
- Reorganize **Types and Constants** for better discoverability.

**Non-Goals:**
- Implementation of new functional requirements or features.
- Major database schema migrations.
- Complete replacement of existing libraries (React Flow, Drizzle, Hono).

## Decisions

### 1. Service Layer Pattern
- **Decision**: Introduce classes in `worker/services/` (e.g., `RcmService`, `ControlService`) that take a Drizzle database instance in their constructor.
- **Rationale**: This centralizes logic, making it easier to test and reuse across different routes (e.g., RCM logic needed in both RCM and BPM routes).
- **Alternative**: Functional services (pure functions). Chosen classes for better dependency management and consistency with the existing `ScopingService`.

### 2. Centralized Audit Helper
- **Decision**: Create an `auditService.ts` with a `logAction` method that accepts the previous and new data states.
- **Rationale**: Automates the "description" generation by diffing keys, reducing manual string concatenation and potential for missing logs.
- **Implementation**: It will handle the `insert` into `audit_logs` within the same transaction.

### 3. Declarative RBAC Middleware
- **Decision**: Create a `guard.ts` middleware for Hono: `rbac(roles: UserRole[])`.
- **Rationale**: Removes repetitive `if (role !== 'Admin')` checks from every route handler, making authorization logic easier to audit.

### 4. Frontend Hook-based Architecture
- **Decision**: Pindahkan logic `useQuery` dan `useMutation` dari `RCMList.tsx` ke `src/hooks/use-controls.ts`.
- **Rationale**: Cleans up the component UI code, makes the data fetching logic reusable, and simplifies unit testing of UI vs Logic.

## Risks / Trade-offs

- **[Risk] Regressions in Business Logic** → [Mitigation] Rigorous verification of each refactored route against original behavior. Focus on one service at a time.
- **[Risk] Increased File Count** → [Mitigation] Use clear directory structures (`worker/services/`, `src/hooks/`) to maintain organization.
- **[Trade-off] Abstraction Overhead** → We accept a slight increase in abstraction for significantly better long-term maintainability and readability.
