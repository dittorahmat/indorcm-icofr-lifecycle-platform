## Why

In the CSA Review Matrix (`CSAPage.tsx` & `CSAReviewMatrix.tsx`), controls are fetched from the general RCM matrix endpoint (`/api/rcm-matrix/tlc`). Because a single internal control often mitigates multiple risks, the RCM endpoint returns multiple rows for the same control (one per risk mapping). When rendered in the CSA Review Matrix, the table duplicates identical control rows consecutively without displaying risk context, which confuses Line 2 reviewers into thinking duplicate controls exist or that each row corresponds to a separate transaction sample. Additionally, transaction sample headers in the review matrix are truncated excessively, obscuring document reference IDs.

## What Changes

- **Deduplicate Controls by `controlId`**: Ensure the CSA Review Matrix displays each unique control exactly once per sub-process, avoiding redundant rows for multi-risk controls.
- **Clarify Sample Transaction Headers**: Enhance sample reference presentation in `CSAReviewMatrix.tsx` with clear transaction identifiers, proper tooltips, and remove restrictive truncation so reviewers immediately recognize which transaction sample is being verified.

## Capabilities

### Modified Capabilities
- `csa-management`: Update CSA review matrix presentation requirements to enforce unique control rows per sub-process and clear transaction sample identification.

## Impact

- **Affected Code**: `src/pages/csa/CSAPage.tsx`, `src/components/csa/CSAReviewMatrix.tsx`.
- **APIs**: No breaking backend API changes; existing `/api/rcm-matrix/tlc` remains intact for full RCM risk-mapping views.
- **Database**: No schema migration required.
