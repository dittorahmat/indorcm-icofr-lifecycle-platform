## ADDED Requirements

### Requirement: Automatic Docker Environment Initialization with pgvector Support
The system SHALL deploy PostgreSQL 15 with `pgvector` enabled out of the box via Docker Compose.

#### Scenario: Docker compose up execution
- **WHEN** the user executes `docker compose up`
- **THEN** the `indorcm-db` container runs image `pgvector/pgvector:pg15` with persistent volume `postgres_data`
- **THEN** PostgreSQL starts with extension capability for `vector` and accepts connections from `indorcm-app`

### Requirement: Database Healthcheck and Delayed App Startup
The application container `indorcm-app` SHALL wait for `indorcm-db` to report a healthy status before launching application services.

#### Scenario: App startup dependency
- **WHEN** `docker compose up` starts containers in parallel or sequence
- **THEN** `indorcm-app` delays startup until `indorcm-db` passes `pg_isready` healthcheck

### Requirement: Automatic Database Schema Migration & Admin Seeding
The application entrypoint script SHALL automatically apply pending Drizzle database migrations and seed default administrative account credentials upon initial container startup.

#### Scenario: First-time container startup
- **WHEN** the application container starts up for the first time
- **THEN** `drizzle-kit push` runs to create database tables and `pgvector` index extensions
- **THEN** seed script executes to ensure default admin user (`admin@bumn.go.id`) and initial organization metadata exist
- **THEN** the production Hono server starts on port 3001
