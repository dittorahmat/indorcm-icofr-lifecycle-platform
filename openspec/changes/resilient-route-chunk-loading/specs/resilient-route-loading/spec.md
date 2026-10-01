## Purpose

The resilient-route-loading capability ensures that dynamic module loading, Vite chunk preloads, and client-side page transitions in the ICOFR lifecycle platform execute reliably without crashing into the routing error boundary during network hiccups or post-deployment stale chunk requests.

## ADDED Requirements

### Requirement: Resilient Dynamic Module Loading
The application MUST provide a resilient loading wrapper (`lazyWithRetry`) around dynamic `import()` calls for route components that automatically retries failed module fetches before throwing.

#### Scenario: Temporary network packet loss during page navigation
- **WHEN** a user navigates to a lazy-loaded route (such as `/deficiencies` or `/scoping`) and the initial dynamic `import()` fails due to transient network latency or dropped packets
- **THEN** `lazyWithRetry` retries importing the module up to 2 times with a slight delay before rejecting
- **AND** if any retry succeeds, the route component mounts seamlessly without displaying an error fallback

#### Scenario: Stale chunk 404 after production redeployment
- **WHEN** a dynamic `import()` fails because the requested chunk hash no longer exists on the server following a new deployment (e.g. `Failed to fetch dynamically imported module`)
- **AND** retry attempts fail
- **THEN** the system triggers a controlled single-pass page reload (`window.location.reload()`) to refresh `index.html` with current chunk hashes, preventing infinite reload loops via session storage flags

### Requirement: Global Vite Preload Error Interception
The application MUST register an event listener for Vite's `vite:preloadError` event on the window object to handle stale preloaded assets before they bubble up as fatal React Router errors.

#### Scenario: Browser encounters Vite preload error
- **WHEN** Vite emits a `vite:preloadError` event during navigation
- **THEN** the event listener prevents default unhandled rejection where applicable
- **AND** automatically reloads the page once to retrieve updated asset manifests

### Requirement: Resilient Fiscal Year URL Synchronization
Navigation links across the application shell MUST preserve and synchronize the active `workingYear` parameter to prevent layout-level route transitions from aborting pending component mounts.

#### Scenario: User clicks sidebar link
- **WHEN** a user clicks any navigation link in `AppSidebar`
- **THEN** the link target includes `?year=${workingYear}`
- **AND** `RootLayout` does not trigger redundant `setSearchParams({ replace: true })` calls during route component initialization
