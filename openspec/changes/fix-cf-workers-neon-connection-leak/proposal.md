## Why

BPM diagrams and other data modifications fail to persist on Cloudflare Workers because WebSocket connection pools are instantiated on every request but never ended. This leads to Neon connection limit exhaustion, causing database transactions to abort/rollback silently, resulting in data loss.

## What Changes

- **Centralize Database Client lifecycle**: Refactor `worker/db/index.ts` to support request-scoped database client instantiations and reference sharing.
- **Implement Connection Pool Cleanup Middleware**: Add global Hono middleware to intercept requests, initialize a request-scoped WebSocket pool if necessary, and register it for cleanup.
- **Asynchronous Pool Closure**: Close the Neon WebSocket connection pool asynchronously at the end of the request lifecycle using `c.executionCtx.waitUntil(pool.end())` to prevent blocking responses.

## Capabilities

### New Capabilities

None

### Modified Capabilities

None

## Impact

- `worker/db/index.ts`: Modifies database client initialization to return both database client and raw connection pool.
- `worker/app.ts`: Implements Hono middleware for connection pool cleanup.
- Performance & Stability: Prevents Neon connection limit exhaustion and guarantees database transaction persistence on Cloudflare Workers edge runtime.
