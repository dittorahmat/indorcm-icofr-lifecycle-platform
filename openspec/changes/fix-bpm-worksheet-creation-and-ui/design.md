## Context

The current implementation of the BPM Worksheet has a critical data loss bug where `bpmProcessId` is sent by the frontend but ignored by the backend, leading to "orphaned" control records that do not appear in the worksheet table after creation. Furthermore, the UI lacks proper localization namespace binding and detailed context in the header.

## Goals / Non-Goals

**Goals:**
- Ensure 100% data persistence for the link between Controls and BPM Processes.
- Enable Lini 1 users to participate in the worksheet authoring process.
- Fix UI "raw key" display bugs by correcting i18n namespace usage.
- Improve the informational density of the Worksheet header.

**Non-Goals:**
- Redesigning the control data model.
- Implementing bulk approval/rejection features.
- Modifying the BPM Diagramming logic.

## Decisions

### 1. Update Backend `POST /api/controls`
- **Decision**: Include `bpmProcessId` in the database insert operation and relax the role check to allow `Line 1`.
- **Rationale**: Fixes the orphaned record bug and enables user-intended workflow for Lini 1.
- **Alternatives**: Using a separate endpoint for BPM controls, but unified `api/controls` is more maintainable.

### 2. Implement Workflow Endpoints
- **Decision**: Add `/api/controls/:id/submit-for-approval` and `/api/controls/:id/reject` to `user-routes.ts`.
- **Rationale**: Completes the authoring-to-approval cycle required by the UI.
- **Alternatives**: Using a generic `PATCH` endpoint, but explicit action-based endpoints are safer for audit logging.

### 3. Frontend Namespace and Header Enhancement
- **Decision**: Switch `useTranslation()` to use the `bpm` namespace and interpolate `fsliName` and `noGL` into the header.
- **Rationale**: Restores correct UI labels and provides immediate context to the user.

## Risks / Trade-offs

- **[Risk]** Data model mismatch → **Mitigation**: Ensure `bpmProcessId` exists in the `Control` type and DB schema (already verified in `shared/types.ts`).
- **[Risk]** Unintentional access by Line 1 to sensitive controls → **Mitigation**: The update is scoped to the creation and update of controls, with status logic (`Draft` for Staff) maintaining governance.
