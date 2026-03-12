# Phase 3: Testing & CSA - Context

## Objectives
- Finalize the Control Self-Assessment (CSA) workspace with Line 2 validation workflow.
- Complete the Testing Workbench for TOD & TOE with mandatory 6 pilar evaluation (Table 21).
- Ensure robust implementation of Sampling (Table 22) and Remediation Readiness (Table 23) logic.
- Implement missing backend routes for CSA validation.

## Technical Architecture
- **CSA State**: `CSARecord` in Durable Objects. Line 1 submits, Line 2 validates.
- **Testing State**: `TestRecord` in Durable Objects with `evaluationAttributes`.
- **API**: Hono routes in `worker/user-routes.ts`.
- **Compliance Logic**: Resides in `src/lib/compliance-utils.ts` (Sampling, Remediation).

## Regulatory References
- **Table 21**: Mandatory evaluation attributes (6 pilars).
- **Table 22**: Sample size suggestions based on frequency and risk.
- **Table 23**: Remediation testing waiting periods.
- **Lampiran 7**: ITAC/ITDM mandatory fields.
