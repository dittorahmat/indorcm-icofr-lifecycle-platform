## Context

The BPM process endpoints currently use an `rbac` middleware that restricts management actions (POST, PATCH, DELETE) to 'Line 2' and 'Admin'. This prevents the actual business process owners ('Line 1') from initializing or modifying their own processes.

## Goals / Non-Goals

**Goals:**
- Grant 'Line 1' users the ability to manage BPM processes.
- Maintain existing access for 'Admin'.
- Optionally keep access for 'Line 2' if they need to make corrections, or restrict them to just review. (Based on user input, it should be 'Line 1' and 'Admin').

## Decisions

### 1. Endpoint Authorization Update
**Decision:** Update `worker/routes/bpm.ts` to change `rbac(['Line 2', 'Admin'])` to `rbac(['Line 1', 'Admin'])` for process management endpoints.
**Rationale:** This directly addresses the identified access denial for 'Line 1' users.

## Risks / Trade-offs

- **Risk:** Potential for unauthorized modification if roles are assigned incorrectly.
- **Mitigation:** Rely on the centralized RBAC system and existing audit trails for all process mutations.
