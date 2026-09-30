## Purpose

Provides a clean database reset mechanism for demonstration and handover purposes, purging operational lifecycle data while safeguarding authentication and AI knowledge assets.

## ADDED Requirements

### Requirement: Database Wipeout for Demo
The database wipeout utility SHALL truncate all operational, scoping, testing, deficiency, and logging tables while strictly preserving user accounts, role definitions, organizational hierarchy, department lists, system licenses, and AI knowledge documents and chunk embeddings.

#### Scenario: Successful database wipeout
- **WHEN** an operator runs the database wipeout utility script with a valid database connection
- **THEN** all transactional tables (GL scoping, BPM diagrams, RCM, testing, deficiencies, and audit logs) are truncated cleanly
- **AND** table records in `user`, `account`, `member`, `organization`, `business_entities`, `departments`, `system_licenses`, and `documents` / `document_chunks` remain intact and queryable.

#### Scenario: Transaction safety and atomicity
- **WHEN** an error occurs during the truncation process
- **THEN** the entire operation is rolled back and no partial deletion occurs.
