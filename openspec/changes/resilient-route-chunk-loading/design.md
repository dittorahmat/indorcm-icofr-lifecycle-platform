## Context

See `proposal.md` for background and motivation.
Currently, all top-level application routes in `src/main.tsx` are imported dynamically via `React.lazy(() => import('@/pages/...'))`. When deploying new builds or experiencing intermittent network latency, browser requests for outdated chunk hashes fail with `TypeError: Failed to fetch dynamically imported module`. Because React `Suspense` does not catch rejected promises and Vite does not automatically retry dynamic imports without a dedicated handler, navigation fails into `RouteErrorBoundary` displaying "Unexpected Error - Routing error detected".

## Goals / Non-Goals

**Goals:**
- Provide a robust `lazyWithRetry` wrapper that automatically recovers from transient network drops and chunk load failures.
- Implement the Vite `vite:preloadError` handler to gracefully refresh the application upon encountering stale post-deployment assets.
- Prevent infinite reload loops during genuine code syntax/runtime crashes by scoping reload state to sessionStorage with a 1-shot guard.
- Ensure that sidebar links preserve fiscal year query parameters (`?year=...`) to avoid transition collisions.

**Non-Goals:**
- Removing code splitting or lazy loading (the application is enterprise-grade with 25+ rich pages and requires bundle splitting).
- Rewriting the underlying React Router v7 data router structure.

## Decisions

### Decision 1: Create `lazyWithRetry` with Transient Retries and 1-Shot Page Refresh Guard
- **Choice**:
  Create `src/lib/lazyWithRetry.ts` implementing a higher-order wrapper around dynamic `import()`.
  - For transient network failures: Attempt up to 2 retries with exponential backoff (e.g., 500ms, 1500ms).
  - For chunk missing errors (`Failed to fetch dynamically imported module` / `Loading chunk`): Check `sessionStorage.getItem('chunk_reload_guard')`. If not previously set, record the current route and execute `window.location.reload()` once to download the latest index and chunk manifest.
  - If a reload has already been executed in the current session for that route, allow the error to bubble to `RouteErrorBoundary` to prevent infinite reload loops.
- **Alternatives Considered**:
  - *Do nothing and rely on users clicking "Try Again"*: Rejected because users experience sudden disruption and think the app is broken.
  - *Service Worker caching*: Adds high cache invalidation complexity and risk of serving permanently stale regulatory logic.

### Decision 2: Window-Level `vite:preloadError` Interceptor in `src/main.tsx`
- **Choice**:
  Add a global `vite:preloadError` listener at the entry point of the app (`src/main.tsx`):
  ```ts
  window.addEventListener('vite:preloadError', (event) => {
    const key = `preload_error_${window.location.pathname}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  });
  ```
- **Rationale**: Vite's native bundler triggers this event when preloaded script tags or dynamic imports fail to resolve. Handling it at the window level ensures both programmatic navigations and link clicks recover automatically.

### Decision 3: Enhance `RouteErrorBoundary` Error Detection
- **Choice**:
  In `src/components/RouteErrorBoundary.tsx`, detect if the underlying error is a chunk/module load error:
  - If detected, display an explicit status message: "New version available or network glitch detected" and customize the button to "Reload Application".
  - Log the event via `errorReporter` with category `"network"`.

### Decision 4: Standardize Sidebar `withYear` Query Parameter Passing
- **Choice**:
  Audit and guarantee that all sidebar navigation items in `src/components/app-sidebar.tsx` use the `withYear(path)` helper. On successful navigation, clear any temporary `chunk_reload_guard` keys from sessionStorage.

## Risks / Trade-offs

- **[Risk] Infinite reload loop if a chunk is permanently broken on server**:
  → *Mitigation*: Strictly guard reloads using a unique key per route in `sessionStorage`. If the reload has already fired for that path, do NOT reload again; surface the error UI with clear manual action.
- **[Risk] Multiple simultaneous page requests triggering concurrent reloads**:
  → *Mitigation*: The reload guard is written synchronously before `window.location.reload()` is invoked.
