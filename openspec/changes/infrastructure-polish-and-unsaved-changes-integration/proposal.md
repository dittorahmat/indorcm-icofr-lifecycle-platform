## Why

The IndoGRC Pro platform currently suffers from several architectural issues and technical debt: missing API endpoints (Audit Logs), "Monster Components" that violate SRP (CSATabContent), inconsistent backend patterns (BPM logic in routes), and the absence of a navigation safety net. This change consolidates infrastructure polish with a comprehensive refactor to ensure the system is robust, auditable (SK-5/DKU.MBU/11/2024), and maintainable.

## What Changes

- **Backend Architectural Refactor**:
    - **Audit Route**: Implement `worker/routes/audit.ts` to fix the missing `/api/changelogs` endpoint.
    - **BPM Service Layer**: Extract logic from `worker/routes/bpm.ts` into a new `BpmService.ts`.
    - **Audit Consolidation**: Replace manual audit logging with centralized `AuditService.logAction`.
    - **Standardization**: Enforce uniform use of `ok`/`bad` utilities and `rbac` middleware across all routes.
- **Frontend Decomposition**:
    - **CSA Monster Component**: Decompose `CSATabContent.tsx` into `CSADiagramView`, `CSAForm`, `CSAList`, and a custom hook `useCSA`.
- **Infrastructure & Usability**:
    - **Unsaved Changes Guard**: Integrate the `useUnsavedChanges` hook and confirmation dialog.
    - **Database Schema Sync**: Apply Drizzle migrations/push for schema consistency.
    - **Localization & UI Polish**: Standardize translations and refine the `NotificationBell`.

## Capabilities

### New Capabilities
- `audit-log-management`: Exposure of system change logs via dedicated API.
- `unsaved-changes-guard`: Data loss prevention mechanism.
- `infrastructure-integrity`: System-wide standardization and schema sync.

### Modified Capabilities
- `rcm-bpm-visualization`: Refactored backend and frontend for better separation of concerns.
- `csa-management`: Decomposed UI and standardized testing workflows.
- `compliance-reporting`: Enhanced auditability and notifications.

## Impact

- `worker/routes/`: `bpm.ts`, `rcm.ts`, `csa.ts`, and new `audit.ts`.
- `worker/services/`: New `BpmService.ts` and updates to `AuditService.ts`.
- `src/components/bpm/`: Decomposition of `CSATabContent.tsx`.
- `src/hooks/`: New `useCSA.ts` and `useUnsavedChanges.ts`.
- `shared/types.ts`: Refinement of audit and CSA types.
