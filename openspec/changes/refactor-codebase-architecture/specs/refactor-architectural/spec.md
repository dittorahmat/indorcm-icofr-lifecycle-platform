## ADDED Requirements

### Requirement: Agnostic Database Connection Driver Selection
The system SHALL dynamically initialize the appropriate database driver based on the active runtime environment.
- In Node.js environment, the system SHALL initialize the native TCP driver (`postgres.js`).
- In Cloudflare Workers environment, the system SHALL initialize the serverless WebSocket driver (`neon-serverless`), unless the URL is explicitly an HTTP protocol where it SHALL fall back to `neon-http`.

#### Scenario: Running under Node.js runtime
- **WHEN** the local server is started using Honos Node.js server wrapper
- **THEN** the system SHALL load `postgres.js` and connect to the PostgreSQL database directly via TCP

#### Scenario: Running under Cloudflare Workers runtime
- **WHEN** the application is deployed to Cloudflare Workers and database URL is postgresql://
- **THEN** the system SHALL load `@neondatabase/serverless` WebSocket Pool driver

### Requirement: Database ACID Transaction Wrappers
The system SHALL wrap multi-table database operations inside Drizzle transaction blocks (`db.transaction`).
- Carry forward operations SHALL execute all copying steps (diagrams, RCMs, controls, and mappings) inside a single transaction.
- BPM diagram save operations SHALL execute metadata updates, node-RCM mappings, edge mappings, and summary updates inside a single transaction.

#### Scenario: Carry forward transaction rollback
- **WHEN** a carry forward operation is started and one of the mapping inserts fails
- **THEN** the database SHALL roll back all previously copied diagrams and RCMs for that target year

### Requirement: Console Error Log Queue Batching
The system SHALL route all intercepted console warnings and errors through the batching queue (`ErrorReporter.report`).
- Console errors SHALL NOT trigger immediate network requests.
- Log entries SHALL be batched and flushed to the backend every 5 seconds.

#### Scenario: Intercepting multiple console warnings
- **WHEN** React triggers 10 consecutive warnings during rendering
- **THEN** the error reporter SHALL queue and deduplicate the warnings, sending at most 1 batch request after 5 seconds
