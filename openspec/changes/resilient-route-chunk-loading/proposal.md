## Why

Users occasionally encounter an intermittent "Unexpected Error: Routing error detected" modal when clicking navigation links in the sidebar (for example, `/deficiencies`). Clicking "Try Again" immediately restores normal operation because it triggers a full browser reload (`window.location.reload()`).

This issue stems from two primary failure modes:
1. **Dynamic Chunk Loading Failure / Stale Deployment Hashes**: In production Vite SPAs, lazy-loaded page modules (`React.lazy(() => import(...))`) fetch hashed JavaScript chunks. When network latency drops packets or a new version is deployed on the server, dynamic imports reject (`Failed to fetch dynamically imported module`). Without an automatic retry mechanism or Vite preload error handler, the unhandled rejection bubbles straight up to React Router's `RouteErrorBoundary`.
2. **Navigation Query Param Sync Collision**: When navigating without an explicit `?year` parameter, `RootLayout` triggers an immediate `setSearchParams(..., { replace: true })` while the lazy route module is still suspending, causing transition abort collisions with `UnsavedChangesGuard` and React Router v7.

Implementing resilient chunk loading with automatic retries, global `vite:preloadError` self-healing, and consistent route navigation ensures seamless, error-free sidebar transitions for compliance officers and auditors.

## What Changes

- **Add `lazyWithRetry` utility**: Create a resilient component loader that intercepts transient dynamic import errors and automatically retries fetching chunks (up to 2 retries with exponential backoff) before rejecting.
- **Implement Vite Preload Error Handler**: Register a global listener for the `vite:preloadError` event in the app entry point that gracefully handles stale chunk hashes by prompting or triggering an automatic refresh without crashing into the routing error boundary.
- **Harden `RouteErrorBoundary` and `PageSuspense`**: Enhance `PageSuspense` or layout error boundaries so chunk load failures can offer auto-recovery or isolated retry without wiping out the entire shell layout.
- **Ensure Consistent Fiscal Year Navigation**: Verify that all sidebar links and programmatic navigations retain active `year` query parameters to prevent layout-level `setSearchParams` replace cascades during page suspense.

## Capabilities

### New Capabilities
- `resilient-route-loading`: Provides automated retry mechanisms for lazy route chunk loading, handles Vite dynamic import preload failures gracefully, and prevents intermittent route error boundary crashes during navigation.

### Modified Capabilities
<!-- None -->

## Impact

- `src/lib/lazyWithRetry.ts`: New helper utility for resilient lazy loading.
- `src/main.tsx`: Wrap lazy page imports with `lazyWithRetry` and register the `vite:preloadError` listener.
- `src/components/RouteErrorBoundary.tsx`: Provide clear context when chunk loading errors occur and allow graceful automatic/manual retry.
- `src/components/app-sidebar.tsx`: Verify all route links use `withYear()` consistently.
- No breaking API changes or database schema modifications required.
