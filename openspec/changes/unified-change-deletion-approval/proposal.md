## Why

In SOE/BUMN Internal Control over Financial Reporting (Regulation SK-5/DKU.MBU/11/2024), governance integrity relies on the maker-checker principle. Currently, entities such as Scoping Simulations and Controls require formal multi-level approvals to be activated (`Pending CFO` -> `Pending Komut` -> `Approved`). However, modifications (Edits) and Deletions to approved entities currently lack symmetric approval safeguards:
1. Approved simulations and controls can be physically deleted or updated directly without authorization, bypassing regulatory segregation of duties.
2. In modules without an active approval workflow, destructive actions are occasionally executed without standard confirmation dialogs, risking accidental data loss.

This change introduces unified governance for Change Requests (Edit) and Deletion Requests across core ICOFR entities, with a strict fallback to institutional confirmation modals whenever the approval workflow is toggled off or bypassed.

## What Changes

- **Symmetric Maker-Checker for Approved Entities**: Modifying or deleting an entity that has achieved `Approved` status now generates a formal Change/Deletion Request instead of immediately executing in place.
  - Entities enter pending states (`Pending Update Approval` / `Pending Deletion Approval`).
  - Authorizers (Line 2 / CFO / Board of Commissioners) review proposed diffs or deletion rationale before changes take effect.
- **Workflow Toggle & Fallback Confirmation Guard**:
  - If the approval workflow is disabled (by tenant policy or environment setting), direct edit and delete actions are permitted, but **MUST** present an explicit institutional confirmation dialog (`useConfirm` modal with impact warning, non-native browser dialogs) before dispatching mutations.
- **Audit Logging Alignment (Lampiran 6)**: Every approved update, approved deletion, or directly confirmed bypass action is permanently logged with actor metadata, justification, and before/after snapshot.
- **Unified Approval Queue UI**: The Approval portal expands to display pending modification diffs and deletion requests alongside initial scoping/RCM activations.

## Capabilities

### New Capabilities
- `governance-change-approval`: Governs modification and deletion lifecycles for approved ICOFR entities with maker-checker queues, status transitions, and fallback confirmation guards.

### Modified Capabilities

## Impact

- **Backend**:
  - `worker/routes/scoping.ts` & `worker/routes/rcm.ts`: Guards on `PUT` and `DELETE` endpoints checking entity approval state; addition of deletion request submission/approval endpoints.
  - `worker/services/control-service.ts` & scoping services: Soft-deletion / pending-deletion state handling and change diff snapshots.
- **Frontend**:
  - `src/pages/scoping/ScopingPage.tsx`, `src/pages/bpm/BPMPage.tsx`, `src/pages/csa/TodoListPage.tsx`: Elimination of raw `window.confirm()` in favor of `useConfirm()`.
  - Approval workspace (`src/pages/scoping/ApprovalPage.tsx` / approval queues): Addition of update/deletion request review cards.
- **Regulatory**: Full audit compliance with SK-5 Lampiran 6 Change Management and Principle 1-5 Control Environment.
