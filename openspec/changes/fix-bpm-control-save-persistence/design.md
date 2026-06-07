## Context

In the `BPMEditor`, Risk-Control mappings are managed via a `RegulatoryPropertySheet`. Users can add multiple controls to a single risk. Currently, the `addControlToRisk` function initializes new entries with `controlId: null`. The backend `BpmService.ts` has a check `if (riskId && ctrlId)` which causes it to skip any mapping where the `controlId` is null. Since the backend is responsible for creating records in the `controls` table based on the diagram data, it never sees the new controls, leading to persistence failure.

## Goals / Non-Goals

**Goals:**
- Ensure all controls added in the UI are saved to the database.
- Maintain stable identities for UI rendering (React keys).
- Prevent data loss during "Save & Sync" operations.

**Non-Goals:**
- Changing the backend schema or service logic (if possible, though a backend loosening of the check might be a fallback, frontend ID generation is cleaner).
- Redesigning the RCM data model.

## Decisions

### 1. Frontend ID Generation for Controls
Generate a unique ID (prefixed with `C-`) at the moment a control is added in the `RegulatoryPropertySheet`.
- **Rationale**: The backend uses these IDs to identify existing records or create new ones. By providing a valid-looking ID from the start, we bypass the `null` check in `BpmService.ts` and allow the backend to process the new entry.
- **Alternatives**:
  - *Backend Change*: Loosen the check in `BpmService.ts` to allow `null` control IDs and generate them server-side. *Rejected* because the frontend needs stable keys anyway, and generating them on-add solves both problems at once.

### 2. Synchronization of `_tempControlId` and `controlId`
Ensure that `_tempControlId` (used for UI stability) and `controlId` (used for database persistence) are the same.
- **Rationale**: Simplifies the state model and ensures that the ID used to render the accordion is the same one sent to the API.

## Risks / Trade-offs

- **[Risk] ID Collisions** → Using `crypto.randomUUID()` or a sufficiently long random string (8+ chars) makes the collision probability negligible for this scale.
- **[Risk] Empty Controls** → Users might add a control but leave it blank. Mitigation: The backend already handles "Draft" status for incomplete records, or we can add a frontend validation if needed.
