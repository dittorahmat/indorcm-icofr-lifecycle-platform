## Context

Currently, the IndoGRC Pro application utilizes a stateless serverless database connection driver (`drizzle-orm/neon-http`) that does not support interactive transactions (`db.transaction`). This causes issues in multi-step database operations likeCarry Forward or BPM diagram saves, which are run as sequential stateless HTTP requests. If any step fails, the database is left in a corrupted or inconsistent state. Furthermore, local development/on-premise deployment runs on Node.js, where a direct TCP connection via `postgres.js` is much faster and more robust. 

Additionally, the frontend error reporter immediately makes network calls on every console error/warning, bypassing the built-in queue/deduplication mechanism and leading to excessive network requests during loops. Key frontend pages (`BPMPage.tsx`) contain excessive inline states and accessibility warnings (missing `DialogTitle`).

## Goals / Non-Goals

**Goals:**
- Provide a runtime-agnostic, transaction-capable database client (`getDb`) that switches between `postgres.js` (for local Node.js) and `@neondatabase/serverless` (WebSocket Pool for Cloudflare Workers demo).
- Unify the database client type definition as `PgDatabase<any, typeof schema, any>` to ensure compile-time driver agnosticism.
- Refactor backend service methods (`BpmService.ts`, `ScopingService.ts`, and `ControlService.ts`) to wrap all sequential database mutations inside database transactions (`db.transaction`).
- Refactor the frontend `errorReporter.ts` to route all console warnings and errors through the batch queue.
- Modularize `BPMPage.tsx` using a custom hook (`useBPMPage.ts`) and split it into sub-components.
- Silence accessibility warnings by adding `DialogTitle` in `BPMPage.tsx` modals.

**Non-Goals:**
- Upgrading Drizzle ORM to newer major versions that might introduce breaking schema changes.
- Replacing the UI libraries (Tailwind / Shadcn UI / Radix).
- Changing business logic requirements or UI designs.

## Decisions

### Decision 1: Generic Database Client Type
- **Option A (Specific driver type union)**: Define `type DrizzleDb = NeonHttpDatabase | NeonDatabase | PostgresJsDatabase`.
- **Option B (Drizzle Generic Type - Chosen)**: Define `type DrizzleDb = PgDatabase<any, typeof schema, any>`.
- **Rationale**: Option B is completely generic and driver-agnostic. Any PostgreSQL driver returned by Drizzle inherits from `PgDatabase`, making service code clean and allowing easy addition of new drivers (e.g., pg, node-postgres) without changing service method signatures.

### Decision 2: Driver Selection in Worker
- **Option A (Always use neon-serverless)**: Always load WebSocket driver on Cloudflare Workers and local Node.js.
- **Option B (Dynamic runtime detection - Chosen)**: Check if runtime is Node.js (`typeof process !== 'undefined' && process.release?.name === 'node'`). If Node, use `postgres.js` (direct TCP socket). If Cloudflare Worker, use `@neondatabase/serverless` (WebSocket Pool for transactions, with fallback to `neon-http` for stateless HTTP).
- **Rationale**: Option B yields optimal performance and native compatibility. On-premise local servers run on Node.js, where direct TCP connections (`postgres.js`) are more robust and standard. Cloudflare Workers run in serverless isolates where WebSockets/HTTP are required to traverse connection limits.

### Decision 3: Error Reporter Console Interception
- **Option A (Bypass console interception)**: Stop intercepting console.warn/error.
- **Option B (Route console to batch queue - Chosen)**: Pipe warnings and errors to `errorReporter.report(...)` instead of `sendImmediateError`.
- **Rationale**: Under Option B, console errors are deduplicated (preventing duplicate error logs on render loops) and batched/flushed every 5 seconds, drastically reducing network requests.

## Risks / Trade-offs

- **[Risk] Type Casting Mismatch**: Drizzle's PgDatabase generic parameters might cause minor casting issues during database connection initialization.
  - *Mitigation*: Cast the initialized database instance as `any` in `getDb` before returning it, keeping the returned signature as `DrizzleDb`. We verified this type-check compiles successfully.
- **[Risk] WebSocket Connection Limits**: WebSockets maintain persistent connections, which might exceed Neon database connection limits in serverless edge environments.
  - *Mitigation*: Ensure the pool size is configured appropriately and use Neon's built-in pooling/pgBouncer endpoint if needed.
