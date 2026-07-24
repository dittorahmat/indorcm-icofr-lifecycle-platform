## 1. Database Driver Refactor

- [x] 1.1 Modify `worker/db/index.ts` to return an object containing both the Drizzle database client (`db`) and the raw Neon connection pool (`pool`), or adapt `getDb` to support retrieve/close mechanisms.
- [x] 1.2 Update all call-sites of `getDb` in Hono routes and middleware to handle the new return signature or retrieve the DB instance cleanly.

## 2. Connection Lifecycle Middleware

- [x] 2.1 Implement Hono middleware in `worker/app.ts` that instantiates the database client and pool once per request.
- [x] 2.2 Store the active pool in the Hono request context variables.
- [x] 2.3 Add post-request cleanup inside the middleware using `c.executionCtx.waitUntil(pool.end())` to close the pool asynchronously without blocking response delivery.

## 3. Validation & Testing

- [x] 3.1 Run `npm run type-check` to verify TypeScript integrity across the backend and frontend.
- [x] 3.2 Run `npm run lint` to check coding standard compliance.
- [x] 3.3 Execute `npm run build` to verify compiling output correctness.
- [x] 3.4 Execute `npm test` to ensure there are no regressions.
