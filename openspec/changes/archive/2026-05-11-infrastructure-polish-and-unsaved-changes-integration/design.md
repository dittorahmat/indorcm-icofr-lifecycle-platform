## Context

IndoGRC Pro is undergoing a comprehensive refactoring and infrastructure polish. This design covers the extraction of business logic into services, fixing broken API endpoints, decomposing god components, and implementing a safety net for unsaved changes.

## Goals / Non-Goals

**Goals:**
- **Backend Decoupling**: Extract BPM logic into `BpmService` and consolidate audit logging via `AuditService`.
- **API Completion**: Fix the missing `/api/changelogs` endpoint to enable audit log visibility.
- **Frontend Modularity**: Decompose the 1200+ line `CSATabContent.tsx` into smaller, focused components.
- **Standardization**: Uniform error/success responses and RBAC enforcement.
- **Data Protection**: Implement internal and external navigation guards.
- **Schema Sync**: Synchronize database models using `drizzle-kit push`.

**Non-Goals:**
- Complete rewrite of the BPM engine (only logic extraction).
- Replacing the auth system (only RBAC standardization).

## Decisions

### 1. BPM Service Layer Extraction
- **Decision**: Create `worker/services/bpm-service.ts` to handle diagram hydration, node processing, and RCM linkages.
- **Rationale**: The current `bpm.ts` route is too complex and mixes HTTP concerns with complex business rules.

### 2. Centralized Audit Route & Service
- **Decision**: Create `worker/routes/audit.ts` and ensure all entity mutations use `AuditService.logAction`.
- **Mechanism**: Use the `AuditService` to automatically generate descriptions based on `dataBefore`/`dataAfter` diffs.

### 3. CSATabContent Decomposition
- **Decision**: Split `CSATabContent.tsx` into:
    - `CSADiagramView.tsx`: React Flow rendering.
    - `CSAForm.tsx`: React Hook Form for assessment.
    - `CSAList.tsx`: History of CSA records.
    - `useCSA.ts`: Shared state and API logic.

### 4. Standardized API Response & Guarding
- **Decision**: Ensure all routes return `ok(c, data)` or `bad(c, message)` and use `rbac(['Role'])` for all mutations.

### 5. Unsaved Changes Integration
- **Decision**: Restore the `useUnsavedChanges` hook to protect editors. It will be triggered by form dirty states and diagram modification flags.

## Risks / Trade-offs

- **[Risk]** → Moving logic to services might introduce regression in diagram hydration.
- **[Mitigation]** → Perform thorough validation of the `/api/bpm-diagrams/:id` hydrated output.
- **[Risk]** → Breaking down `CSATabContent` might complicate props/state passing.
- **[Mitigation]** → Use a custom hook (`useCSA`) or a localized context to manage shared state.
- **[Risk]** → `drizzle-kit push` risks.
- **[Mitigation]** → Review SQL diffs before execution.
