## Context

The application utilizes PostgreSQL managed via Drizzle ORM. Before handing over the system for a client demonstration, test and sample transactional records must be purged so stakeholders can test clean end-to-end flows. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provide a repeatable, atomic TypeScript CLI script (`worker/db/wipeout-demo.ts`) to truncate all transactional and operational lifecycle tables.
- Add an `npm run db:wipeout` shortcut command.
- Preserve all RBAC tables (`user`, `account`, `member`, `organization`, `business_entities`, `departments`, `system_licenses`).
- Preserve AI semantic search and knowledge base assets (`documents`, `document_chunks`, `document_departments`, `document_gls`, `document_fslis`).

**Non-Goals:**
- Creating a public/open web UI button for database wipeout (kept as an administrative CLI tool for security).
- Dropping or altering database schemas or migrations.

## Decisions

### Decision 1: Single Atomic Transaction Truncation
- **Approach**: Execute `TRUNCATE TABLE <tables> CASCADE` within an atomic SQL transaction block using Neon / Postgres client.
- **Rationale**: Fast execution, resets table auto-increment/state cleanly, and fails safely if any unexpected constraint violation occurs.
- **Alternative considered**: Sequential `DELETE FROM table`. Rejected due to slowness and cascade trigger overhead.

### Decision 2: Explicit Preserved & Wiped Table Listing
- **Approach**: Hardcode the explicit list of tables to truncate and log before/after verification counts.
- **Tables Truncated**:
  - Remediation & Deficiencies: `aggregate_deficiencies`, `action_plans`, `deficiencies`
  - Testing: `test_samples`, `test_records`, `tod_evaluations`, `csa_samples`, `csa_records`, `csa_schedules`
  - RCM & BPM: `bpm_node_rcms`, `bpm_exports`, `bpm_diagrams`, `bpm_process_gl_codes`, `bpm_processes`, `rcm_controls`, `controls`, `rcms`
  - Scoping & GL: `simulation_account_applications`, `simulations`, `materiality`, `transaction_uploads`, `transaction_details`, `gl_rows`, `gl_snapshots`
  - IT, Vendor & Logs: `application_documents`, `applications`, `soc_evaluations`, `soc_reports`, `vendors`, `wbs_reports`, `migration_sessions`, `audit_logs`, `notifications`

## Risks / Trade-offs

- **[Risk] Accidental deletion in production**: The command could be executed against a real production database.
  - **Mitigation**: Script requires explicit confirmation prompt or checks environment flags before truncating.
- **[Risk] Foreign Key constraints locking truncation**: Truncating tables in wrong order or with active references.
  - **Mitigation**: Use `CASCADE` in the truncate statement while ensuring preserved tables are NOT referenced by foreign keys from preserved tables down to truncated tables.
