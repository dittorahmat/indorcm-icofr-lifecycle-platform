# Spec Delta

## Purpose

Defines how the platform runs as multiple fully isolated tenant instances from a single source tree, covering build target selection, per-instance infrastructure and credentials, tenant database bootstrap with identity-only migration, and production safety gates.

## ADDED Requirements

### Requirement: Build target selection

The build SHALL select which Wrangler configuration to compile against, defaulting to the repository's primary configuration when no target is specified, and SHALL emit an artifact that carries the selected Worker name, asset directory, and bindings.

#### Scenario: Default build keeps the primary instance

- **WHEN** the build runs without a target configuration variable
- **THEN** the generated artifact targets the primary Worker name and primary R2 bucket
- **AND** the primary configuration file is unmodified

#### Scenario: Targeted build produces a tenant artifact

- **WHEN** the build runs with the tenant configuration selected
- **THEN** the generated artifact targets the tenant Worker name and the tenant R2 bucket
- **AND** the artifact is written to a location distinct from the primary artifact

### Requirement: Instance isolation

Each deployed instance SHALL use its own Worker script, database, authentication secret, and object storage bucket, and SHALL NOT read or write another instance's persistent state.

#### Scenario: Uploaded documents stay in the instance bucket

- **WHEN** a user uploads a document on the tenant host
- **THEN** the object is written only to the tenant bucket
- **AND** the primary bucket contains no object created by that upload

#### Scenario: Sessions do not cross instances

- **WHEN** a user authenticates on one instance host
- **THEN** that session grants no authenticated access on the other instance host

### Requirement: Per-instance runtime credentials

Each instance SHALL resolve its database connection string, authentication secret, and public base URL from its own Worker configuration, and SHALL NOT fall back to another instance's database when its own connection string is missing.

#### Scenario: Tenant Worker uses only its own database

- **WHEN** the tenant instance serves an API request
- **THEN** all reads and writes target the tenant database
- **AND** records created through the tenant host are absent from the primary database

#### Scenario: Missing connection string fails instead of falling back

- **WHEN** the tenant instance is deployed without a database connection string
- **THEN** database-backed requests fail with an error response
- **AND** no request is served from the primary database

### Requirement: Tenant database bootstrap

Provisioning a tenant database SHALL enable the required PostgreSQL extensions, apply the project's schema definition into the application schema, and pass the schema verification check before the instance serves traffic; provisioning SHALL NOT insert demo ICOFR content.

#### Scenario: Fresh tenant database becomes schema-complete

- **WHEN** an empty database is provisioned with the extensions step, the schema sync into the application schema, and the schema check
- **THEN** the schema check passes
- **AND** the database contains no risk, control, process, assessment, testing, deficiency, scoping, or transaction rows
- **AND** emptiness is verified by enumerating every non-identity, non-operational table in the application schema, not a hand-picked content list

#### Scenario: Demo seeding is not used for a tenant

- **WHEN** an operator bootstraps a tenant database
- **THEN** demo content seeding is not executed against it

### Requirement: Identity clone fidelity

The identity clone SHALL reproduce the primary instance's organizations, business entities, departments, users, credential records, organization memberships, and user preferences with identical identifiers and password hashes, and SHALL exclude ICOFR content, sessions, notifications, and audit records.

#### Scenario: Copied users authenticate with unchanged credentials

- **WHEN** a user whose record was cloned signs in on the tenant host with their existing email and password
- **THEN** authentication succeeds without a password reset

#### Scenario: Roles and departments are preserved

- **WHEN** a cloned user opens the tenant instance
- **THEN** their role, level, language, and department match the primary instance

#### Scenario: Content is not cloned

- **WHEN** the identity clone completes
- **THEN** every non-identity, non-operational table in the tenant application schema is verified empty

#### Scenario: Clone is repeatable

- **WHEN** the identity clone runs a second time after new users were added to the primary instance
- **THEN** the run completes without duplicate users or membership errors
- **AND** the reported row-count comparison between source and target identity tables is zero
- **AND** an email already owned by a different user id on the target fails the run before any write

### Requirement: Production safety gate

An instance configured as production SHALL reject the destructive development tooling endpoints for reseeding and purging data, regardless of the caller's role.

#### Scenario: Reseed is refused on the tenant instance

- **WHEN** an authenticated administrator calls the reseed endpoint on the production tenant instance
- **THEN** the request is refused and no data is written

### Requirement: Deploy target determinism

A deployment SHALL use the configuration generated for its own build target, and building or deploying one instance SHALL NOT change the Worker name or bindings of the other.

#### Scenario: Deploying the tenant leaves the primary intact

- **WHEN** the tenant artifact is deployed
- **THEN** the tenant Worker serves the new version
- **AND** the primary Worker still reports its own name and configuration

### Requirement: Automatic deployment from the shared branch

Both instances SHALL deploy automatically from the same main branch, each through its own build project that supplies its own target configuration and credentials, so a merge produces the same commit on both instances.

#### Scenario: Merge reaches both instances

- **WHEN** a commit is merged to the main branch
- **THEN** both build projects deploy the same commit
- **AND** each instance serves its own database and bucket

### Requirement: Schema migration is a release step

Deploying application code SHALL NOT apply database schema changes; a release that depends on schema changes SHALL be treated as incomplete until the schema definition has been synchronized to every instance database (currently `drizzle-kit push`, per ADR 0009, until the versioned chain is replayable).

#### Scenario: Schema-dependent release requires both databases

- **WHEN** a release adds or alters database columns
- **THEN** the release checklist requires the schema sync to be applied to the primary and tenant databases
- **AND** an instance whose database was not synchronized is reported as out of date
