## Why

The platform needs a clean-slate state before handing over to users for external demonstration. All operational lifecycle and transactional data (RCM, controls, BPM diagrams, scoping/GL data, testing records, deficiencies, SOC reports, WBS, and audit logs) must be wiped clean, while strictly preserving essential foundational assets:
1. Multi-tenant RBAC, organization hierarchy, departments, users, and license validity.
2. AI Knowledge base documents and vector embeddings (768-dimensional vectors and FTS tokens) to avoid expensive re-indexing.

## What Changes

- Add a dedicated maintenance CLI utility script (`worker/db/wipeout-demo.ts`) to execute an atomic, cascaded wipeout of transactional and operational tables.
- Add `npm run db:wipeout` script in `package.json`.
- Safely preserve auth/RBAC (`user`, `account`, `member`, `organization`, `business_entities`, `departments`, `system_licenses`).
- Safely preserve AI knowledge source documents and embeddings (`documents`, `document_chunks`, `document_departments`, `document_gls`, `document_fslis`).

## Capabilities

### New Capabilities
- `db-wipeout`: CLI tooling to reset database to demo baseline while preserving system knowledge and RBAC foundations.

### Modified Capabilities
None.

## Impact

- **Affected code**: `package.json`, `worker/db/wipeout-demo.ts`.
- **Database**: Truncates 24 transactional tables across RCM, Scoping, Testing, Remediation, Vendor SOC, WBS, and Logging modules.
- **Breaking Changes**: None to application runtime. Running the script will permanently delete non-seed transactional data in the target database.
