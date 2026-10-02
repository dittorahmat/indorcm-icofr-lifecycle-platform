## Context

See `proposal.md` for background and regulatory motivation.
Current state:
- Entities (such as `simulations` in `worker/routes/scoping.ts` and `controls` in `worker/routes/rcm.ts`) have creation approval workflows, but deletion and updates directly execute mutations against the database.
- A client-side confirmation system (`useConfirm()`) is already present in `src/hooks/use-confirm.ts`, but some pages still call browser-native `window.confirm()`.

## Goals / Non-Goals

**Goals:**
- Provide symmetric Maker-Checker lifecycle (`Draft` -> `Pending Activation` -> `Approved` -> `Pending Update/Deletion` -> `Archived/Deleted`).
- Add a tenant/system configurable toggle `enableApprovalWorkflow` (default true for production compliance).
- Ensure client-side confirmation dialogs are consistently powered by `useConfirm()` when workflows are bypassed or disabled.
- Log all actions into the Lampiran 6 regulatory change log.

**Non-Goals:**
- Multi-tenancy isolation rewrite: we operate within the existing `organizationId` model.
- Third-party external approval engines (BPMN external engines like Camunda); logic remains native and lightweight in Cloudflare Workers / Hono.

## Decisions

### Decision 1: Unified Change Request & Deletion Staging
- **Choice**: Store pending modification payloads (`pendingChanges`) and deletion intent (`status = 'Pending Deletion'`) directly on the entity record or in a staged changelog table, with status transitions.
- **Alternatives Considered**:
  - *Separate CR Table for everything*: Cleaner separation, but requires multi-table joins for every read query and complicates list filtering.
  - *Direct Soft-Delete flag without approval*: Fails Maker-Checker requirement.

### Decision 2: Approval Bypass Fallback with useConfirm
- **Choice**: When `enableApprovalWorkflow` is false or when deleting unapproved draft entities, immediate deletion is allowed but must pass through an institutional confirmation dialog (`useConfirm`) with a prompt summarizing the impact.
- **Alternatives Considered**:
  - *Browser `window.confirm()`*: Fails accessibility and anti-slop standards, inconsistent styling across operating systems.

### Decision 3: Approver Matrix
- **Choice**:
  - Scoping Simulations: CFO and Board of Commissioners (`CFO`, `Commissioner`, `Admin`).
  - Controls & BPM Processes: Line 2 Head / Internal Audit / Admin (`Line 2`, `Admin`).

## Risks / Trade-offs

- **[Risk] User confusion when "Delete" does not immediately remove item**  
  → *Mitigation*: The action button dynamically reflects state: "Request Deletion" for approved items, accompanied by a badge and toast explanation that it has been submitted to the approval queue.
- **[Risk] Concurrent edits while a deletion is pending**  
  → *Mitigation*: When an item has status `Pending Deletion Approval` or `Pending Update Approval`, further edits are locked until the pending request is resolved by the approver.

## Migration Plan

1. Add status enums (`Pending Deletion`, `Pending Update`) to Drizzle schema where applicable.
2. Update backend endpoints in `worker/routes/scoping.ts` and `worker/routes/rcm.ts`.
3. Update frontend action handlers to check entity status and trigger either `submitDeletionRequest` or `useConfirm()`.
4. Replace all occurrences of `window.confirm()` in `src/` with `useConfirm()`.
