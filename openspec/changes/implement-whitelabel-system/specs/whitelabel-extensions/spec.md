## ADDED Requirements

### Requirement: Frontend Extension Registry
The system SHALL dynamically import and register routes and navigation menu items defined in the `/src/extensions` folder at startup.

#### Scenario: Registering custom partner routes
- **WHEN** a partner exports custom routes in `src/extensions/index.ts`
- **THEN** the core application SHALL dynamically register them with the React Router at startup

#### Scenario: Injecting custom sidebar navigation
- **WHEN** a partner exports custom navigation items in `src/extensions/index.ts`
- **THEN** the sidebar menu SHALL dynamically append those menu items with correct Lucide icons

### Requirement: Backend API Extension Mounting
The system SHALL dynamically mount Hono sub-routers defined by partners in `/worker/extensions/index.ts` under the `/api/ext/*` endpoint namespace.

#### Scenario: Accessing custom partner API
- **WHEN** a partner API router is registered in `worker/extensions/index.ts`
- **THEN** the worker backend SHALL mount it and route calls under `/api/ext/*` dynamically
