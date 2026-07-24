## Context

In Cloudflare Workers, a fresh `Pool` and `drizzleWs` client are instantiated on every request via `getDb()` to avoid cross-request WebSocket I/O context errors. However, because connection pools are never explicitly ended (`pool.end()` is never called), they leak WebSocket connections, eventually exhausting the connection limit on Neon database and causing database transactions to abort/rollback silently, leading to data loss (e.g. BPM diagrams disappearing).

## Goals / Non-Goals

**Goals:**
- Gracefully clean up and close Neon WebSocket connection pools at the end of each request lifecycle.
- Guarantee that all database transactions commit successfully on the Cloudflare Workers runtime.
- Maintain full compatibility with the existing transaction usage in all services (`BpmService`, `ControlService`, `ScopingService`) without modifying their business logic.

**Non-Goals:**
- Altering the database driver or pooling mechanism for the Node.js/on-premise runtime (`postgres.js`).
- Moving away from PostgreSQL or Drizzle ORM.

## Decisions

### Decision 1: Expose the raw pool reference from `getDb`
- **Options**:
  - *Option A*: Modify `getDb` to return an object `{ db: DrizzleDb, pool?: Pool }`.
  - *Option B*: Store the pool directly in a request-scoped context helper.
- **Chosen**: *Option A*. It is a simple, type-safe extension that allows the caller (like the Hono middleware) to extract the database driver client for execution and the connection pool for lifecycle cleanup.

### Decision 2: Use Hono Middleware and Cloudflare `waitUntil` for cleanup
- **Options**:
  - *Option A*: Manually call `pool.end()` inside every endpoint handler.
  - *Option B*: Implement Hono middleware that closes the pool asynchronously.
- **Chosen**: *Option B*. Centralized middleware is less error-prone and keeps endpoint handlers clean. By executing `c.executionCtx.waitUntil(pool.end())` after `await next()`, we close the pool asynchronously without delaying the HTTP response.

## Risks / Trade-offs

- **[Risk] Neon Connection Exhaustion**
  - *Mitigation*: The pool is guaranteed to end at the end of every request, returning connections to the Neon server immediately.
- **[Risk] Slow response times due to connection overhead**
  - *Mitigation*: Handshake overhead is negligible for edge functions, and by using `c.executionCtx.waitUntil()`, browser clients receive the response immediately without waiting for the socket closure.
