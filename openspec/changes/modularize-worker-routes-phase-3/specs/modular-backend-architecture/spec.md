## ADDED Requirements

### Requirement: Domain-Specific Route Isolation
The backend SHALL organize routes into domain-specific files to ensure modularity.

#### Scenario: RCM route access
- **WHEN** a request is made to `/api/rcm/list`
- **THEN** it is handled by the `worker/routes/rcm.ts` sub-app

### Requirement: Centralized Route Registration
The main application SHALL mount all domain-specific sub-apps under the `/api` prefix.

#### Scenario: Sub-app mounting
- **WHEN** the server starts
- **THEN** `worker/app.ts` registers `rcm`, `bpm`, `scoping`, `remediation`, and `users` modules
