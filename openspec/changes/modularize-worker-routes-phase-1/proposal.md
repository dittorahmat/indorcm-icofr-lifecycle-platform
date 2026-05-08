## Why

The `worker/user-routes.ts` file has grown to nearly 4,000 lines, encompassing multiple unrelated domains (Licensing, BPM, Notifications, AI, etc.). This monolith causes significant IDE performance degradation, increases cognitive load for developers, and makes the system brittle. Breaking this down into modular sub-apps using Hono's `app.route()` is critical for long-term maintainability.

## What Changes

- **Notification Routing Extraction**: Move all `/api/notifications/*` routes and logic from `worker/user-routes.ts` to a new dedicated sub-app in `worker/routes/notifications.ts`.
- **License Routing Extraction**: Move all `/api/license/*` routes and logic from `worker/user-routes.ts` to a new dedicated sub-app in `worker/routes/license.ts`.
- **Main App Orchestration**: Update `worker/app.ts` to mount these new sub-apps using `app.route()`, reducing the reliance on the monolithic `userRoutes` function.
- **Code Cleanup**: Remove the extracted code from `worker/user-routes.ts` and clean up unused imports.

## Capabilities

### New Capabilities
- `modular-backend-routing`: Establishes the pattern for domain-driven route organization in the Cloudflare Worker backend using Hono sub-apps.

### Modified Capabilities
<!-- No requirement changes, this is an architectural refactor. -->

## Impact

- `worker/user-routes.ts`: Significant reduction in size (~200-300 lines removed).
- `worker/app.ts`: Updated to register new routes.
- `worker/routes/`: New directory created for modular route files.
- `worker/lib/`: Any shared utilities needed by multiple route files will be verified.
