# Spec Delta

## Purpose

Defines how the platform runs multiple isolated instances from one source tree, including per-instance configuration, explicit-target provisioning, pre-write safety guards, schema resolution, fresh-instance readiness, and deployment-contract coverage for every configured instance.

## ADDED Requirements

### Requirement: Provisioning target is explicit

The identity clone SHALL select its destination from an explicitly named environment variable and SHALL NOT use a shared default target.

#### Scenario: Named target is the only destination

- **WHEN** an operator runs the clone with a named target such as `TEST_DATABASE_URL`
- **THEN** the run reads and writes only the database behind that name
- **AND** the resolved target host is printed before any write, without credentials

#### Scenario: Missing target name fails before writing

- **WHEN** the named target variable is absent
- **THEN** the run fails with an actionable error
- **AND** no connection is opened and no row is written

#### Scenario: Primary database is never a clone destination

- **WHEN** the named target resolves to the same database as the source
- **THEN** the run is refused before writing

### Requirement: Non-empty target is refused before writing

The identity clone SHALL verify that the target's content tables are empty before it writes any identity row, and SHALL fail closed when the target already holds content.

#### Scenario: Existing content blocks the write

- **WHEN** the target database contains rows in any non-identity, non-operational table
- **THEN** the run reports the offending tables and exits non-zero
- **AND** no identity row is inserted or updated

#### Scenario: Empty target proceeds

- **WHEN** every content table on the target is empty
- **THEN** the clone proceeds and the existing cross-database verification applies
- **AND** the run succeeds only when identity counts and credential hashes match and content stays empty

### Requirement: Bootstrap establishes application schema resolution

The bootstrap SHALL create the application tables in the instance's application schema and pin the database role's search path so every new connection resolves those tables before `public`.

#### Scenario: Fresh connection resolves the application schema

- **WHEN** a new connection opens with the instance database URL after bootstrap
- **THEN** its search path resolves the application schema before `public`
- **AND** unqualified application queries reach the instance's tables without per-request configuration

#### Scenario: Application tables are not left in public

- **WHEN** bootstrap completes on a fresh database
- **THEN** the application tables exist in the application schema
- **AND** no application table is created in `public`

### Requirement: Fresh instance is ready to use

After provisioning, the instance SHALL serve the application on its own host, authenticate cloned identities, persist new data and uploads, and remain isolated from the other instances.

#### Scenario: Cloned identity can sign in

- **WHEN** a user with a cloned credential signs in on the instance host
- **THEN** authentication succeeds with the cloned password
- **AND** the application loads without requiring a reset or a license activation

#### Scenario: Empty instance is writable

- **WHEN** the instance loads after bootstrap
- **THEN** content lists are empty
- **AND** a newly created record and uploaded document can be read back

#### Scenario: Instances stay isolated

- **WHEN** data is created on the new instance
- **THEN** the primary and demo instances do not see it
- **AND** requests using another instance's origin are rejected

### Requirement: Every instance configuration is covered by the deployment contract

Each Wrangler configuration in the repository SHALL be represented in the deployment-contract check, so a new instance cannot exist without its shared keys, identity, and deployment artifact being asserted.

#### Scenario: New configuration without coverage fails the check

- **WHEN** a Wrangler configuration exists that the contract check does not enumerate
- **THEN** the check fails and names the uncovered file

#### Scenario: Shared keys drift fails the check

- **WHEN** any instance configuration diverges from the primary for a shared key such as `main`, compatibility settings, assets, or Durable Object bindings
- **THEN** the check fails and names the drifted key

#### Scenario: Identity collision fails the check

- **WHEN** two instance configurations share a Worker name, R2 bucket, or public base URL
- **THEN** the check fails instead of allowing one instance to deploy over another

### Requirement: Automatic deployment covers every configured instance

Every configured instance SHALL deploy automatically from the same main branch through its own build project, supplying its own target configuration and credentials.

#### Scenario: Merge reaches every instance

- **WHEN** a commit is merged to the main branch
- **THEN** every configured build project deploys that commit
- **AND** each instance continues to serve its own database, bucket, and auth origin
