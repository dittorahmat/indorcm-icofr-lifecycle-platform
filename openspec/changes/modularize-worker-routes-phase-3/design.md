## Context

The IndoGRC Pro backend worker is currently dominated by a single `user-routes.ts` file. This monolith has grown beyond manageable limits, affecting development velocity and system stability. Previous phases (1 & 2) successfully extracted Notification, License, and AI documentation routes. This phase (Phase 3) aims to complete the extraction of all remaining core business domains.

Concurrently, the frontend requires a safety mechanism for form data entry. Financial reporting involves complex forms where accidental navigation can lead to data loss and regulatory non-compliance.

## Goals / Non-Goals

**Goals:**
- **Full Backend Decomposition**: Move all core business logic out of `user-routes.ts` into domain-specific modules.
- **Improved Type Safety**: Ensure all new modules use Hono's `app.route()` pattern for better type inference and RPC support.
- **Data Protection**: Implement a robust Unsaved Changes Warning in the React frontend.
- **Observability**: Add a visible Notification Bell for real-time system alerts.
- **Infrastructure Integrity**: Use Drizzle migrations for all schema changes.

**Non-Goals:**
- Refactoring the internal logic of the handlers (this is a "move and verify" refactor).
- Replacing the database or changing the underlying schema unless strictly necessary for the refactor.
- Rewriting the auth system.

## Decisions

### 1. Modular Routing Pattern
**Decision**: Use Hono's `app.route()` to mount sub-apps in `worker/app.ts`.
**Rationale**: This is the Hono standard for scaling large applications. It preserves type safety and allows for clean `hc` (Hono Client) integration.
**Alternatives**: 
- *Rails-style Controllers*: Rejected because it breaks TypeScript type inference in Hono.
- *Middleware Dispatching*: Rejected as it's less performant and harder to trace.

### 2. Frontend Guard State Management
**Decision**: Use a dedicated `UnsavedChangesProvider` (Context API) to track "dirty" state globally.
**Rationale**: Allows any component to register its "dirty" status. Centralizes the blocking logic (using `window.onbeforeunload` and TanStack Router/React Router transition hooks).
**Alternatives**:
- *Local State only*: Too fragmented; hard to manage global navigation events.
- *Zustand*: Possible, but Context API is sufficient for this simple boolean/metadata state and avoids adding a dependency if not needed (though Zustand is already in the project).

### 3. Notification Architecture
**Decision**: Implement a `NotificationBell` component in the main header that polls or listens for new `notifications` table entries.
**Rationale**: Provides immediate feedback to users regarding system status, reports readiness, or regulatory deadlines.
**Alternatives**:
- *WebSockets*: Overkill for the current requirement and adds complexity to Cloudflare Workers (requires Durable Objects). Polling or periodic TanStack Query refetching is more cost-effective.

## Risks / Trade-offs

- **[Risk]** Broken Imports after move → **[Mitigation]** Run `tsc` (type check) immediately after moving each domain.
- **[Risk]** Drizzle Push conflicts in production → **[Mitigation]** Use `npx drizzle-kit generate` to create migration files first, then verify with `push` in dev.
- **[Risk]** Missing routes after cleanup → **[Mitigation]** Create a route manifest before and after to verify 100% coverage.
- **[Risk]** Unsaved changes guard being too aggressive → **[Mitigation]** Implement an easy way to "reset" the dirty state upon successful submission.
