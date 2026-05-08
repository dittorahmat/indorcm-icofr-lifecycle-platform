## ADDED Requirements

### Requirement: Hono Sub-App Domain Organization
The backend system SHALL organize API routes into domain-specific sub-apps using Hono's `app.route()` pattern to improve maintainability and performance.

#### Scenario: Notifications sub-app mounting
- **WHEN** the application is initialized
- **THEN** a dedicated Hono instance for notifications is mounted under the `/api/notifications` prefix.

#### Scenario: License sub-app mounting
- **WHEN** the application is initialized
- **THEN** a dedicated Hono instance for licensing is mounted under the `/api/license` prefix.

### Requirement: Type Safety across Sub-Apps
The system SHALL ensure that TypeScript type inference for the API (used by RPC clients) remains intact and comprehensive after modularization.

#### Scenario: AppType inclusion
- **WHEN** the `AppType` is derived from the main `app` instance
- **THEN** it must automatically include all paths and return types defined in the mounted sub-apps.
