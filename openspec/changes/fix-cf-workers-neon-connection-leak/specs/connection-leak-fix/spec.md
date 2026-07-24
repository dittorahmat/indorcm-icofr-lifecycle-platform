## ADDED Requirements

### Requirement: Database Connection Lifecycle Scoping
The Cloudflare Worker runtime SHALL scope database connection pool instances to the individual HTTP request context.

#### Scenario: Instantiate client per request
- **WHEN** an HTTP request is received by the Hono application on Cloudflare Workers
- **THEN** the database manager instantiates a request-scoped database client and Neon WebSocket pool

### Requirement: Automatic Connection Pool Closure
The system SHALL guarantee that any connection pool created during an HTTP request is closed after the response is sent.

#### Scenario: Close pool asynchronously on request completion
- **WHEN** the Hono request lifecycle completes and the response is returned to the user
- **THEN** the system triggers `pool.end()` asynchronously using Cloudflare's `waitUntil` context
