## Context

The backend is built on Cloudflare Workers using the Hono framework. Currently, almost all authenticated routes are defined in a single function `userRoutes` within `worker/user-routes.ts`. This file has reached a size (3960 lines) that hinders development. Hono provides an `app.route()` mechanism specifically for this scenario, allowing developers to mount separate Hono instances (sub-apps) onto a main app instance.

## Goals / Non-Goals

**Goals:**
- Extract **Notifications** and **Licensing** domains into separate files.
- Maintain full TypeScript type safety for the `AppType` used by frontend RPC.
- Ensure all existing middleware (Auth, License Guard, Logger) continues to function correctly for the extracted routes.
- Establish `worker/routes/` as the standard location for domain-specific route definitions.

**Non-Goals:**
- Refactoring the internal logic of the handlers (this is a move-only operation to minimize risk).
- Implementing new features or fixing existing bugs within these domains.
- Modularizing other domains like BPM, CSA, or Scoping in this specific phase.

## Decisions

### 1. File Structure: `worker/routes/`
We will create a new directory `worker/routes/` to house domain-specific sub-apps.
- `worker/routes/notifications.ts`
- `worker/routes/license.ts`

### 2. Sub-App Implementation Pattern
Each sub-app will be a standalone Hono instance using the shared `HonoEnv` type.
```typescript
// Example: worker/routes/notifications.ts
import { Hono } from 'hono';
import { HonoEnv } from '../app';

const notifications = new Hono<HonoEnv>();

notifications.get('/unread-count', async (c) => { ... });
// Note: path is relative to the mount point

export default notifications;
```

### 3. Orchestration in `worker/app.ts`
The sub-apps will be mounted in `createApp` within `worker/app.ts` using `.route()`.
```typescript
const app = new Hono<HonoEnv>();
// ... middleware ...
app.route('/api/notifications', notifications);
app.route('/api/license', license);
```
Crucially, the routes must be chained to the `app` instance before exporting `AppType` to ensure the frontend `hc` client can "see" the new routes with full type inference.

### 4. Shared Dependencies
Imports like `getDb`, `ok`, `bad`, and `schema` will be imported from their existing locations (e.g., `../db`, `../lib/utils`).

## Risks / Trade-offs

- **[Risk] Path Ambiguity** → The extracted routes in `worker-routes.ts` used absolute paths (e.g., `app.get('/api/notifications', ...)`). In sub-apps, the path is relative to the mount point. 
  - *Mitigation*: Ensure paths are stripped of their prefix when moved to the sub-app (e.g., `/api/notifications/unread-count` becomes `/unread-count`).
- **[Risk] Relative Import Breakage** → Moving code from `worker/` to `worker/routes/` changes the depth.
  - *Mitigation*: Update all relative imports (e.g., `./db` becomes `../db`).
- **[Risk] Middleware Order** → If sub-apps are mounted before auth middleware, they might bypass security.
  - *Mitigation*: Mount sub-apps *after* the global `app.use('/api/*', ...)` auth middleware in `worker/app.ts`.
