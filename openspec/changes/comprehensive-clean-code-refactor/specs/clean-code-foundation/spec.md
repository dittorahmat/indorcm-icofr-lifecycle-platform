## ADDED Requirements

### Requirement: Centralized Audit Logging
The system SHALL provide a centralized service or helper function to handle audit logging. This service SHALL automatically identify differences between the previous state and the new state of an entity and record them in the `audit_logs` table.

#### Scenario: Automatic audit log generation
- **WHEN** a service method updates an RCM record with new data
- **THEN** the system compares the old and new record, identifies changed fields, and inserts a new entry into the `audit_logs` table with `dataBefore` and `dataAfter` populated correctly.

### Requirement: Service Layer Architecture
The system SHALL encapsulate business logic, database queries (Drizzle), and validation logic within dedicated Service classes located in `worker/services/`. Hono routers SHALL only handle request parsing, calling the appropriate service methods, and returning responses.

#### Scenario: RCM Creation through Service
- **WHEN** a POST request is made to `/api/rcm`
- **THEN** the router extracts the request body and user context, calls `RcmService.createRcm()`, and returns the result provided by the service.

### Requirement: Declarative RBAC Middleware
The system SHALL implement a Hono middleware to enforce Role-Based Access Control. This middleware SHALL accept allowed roles as parameters and return a 403 Forbidden response if the authenticated user's role is not in the allowed list.

#### Scenario: Unauthorized access to Admin route
- **WHEN** a user with the 'Line 1' role attempts to access an endpoint protected with `rbac(['Admin', 'Line 2'])`
- **THEN** the system returns a 403 Forbidden response without executing the route handler.

### Requirement: Custom Domain Hooks for Frontend
The frontend SHALL use custom React hooks to manage data fetching (React Query) and state logic for specific domains (e.g., `useControls`, `useScoping`). Components SHALL consume these hooks instead of calling `api()` or `useQuery` directly for domain data.

#### Scenario: Control list rendering
- **WHEN** the `RCMList` component is rendered
- **THEN** it calls the `useControls` hook to fetch data, and the component only handles the UI mapping and layout.
