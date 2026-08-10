## Context

The `DeficiencyBoard` relies on `localStorage.getItem('mockRole')`, which defaults to `'Line 1'` when unconfigured or not actively clicked in the UI header. This disconnects the interface from the authenticated `user.role` (e.g. `Admin`) retrieved via `useAuth()`. Users logged in as `Admin` are unable to see action buttons on Kanban cards (e.g., `Pass Review`, `Approve`, `Reject`, `Edit Plan`) without manually toggling the `Mock Role` button bar on the page header.

## Goals / Non-Goals

**Goals:**
- Connect `DeficiencyBoard` role evaluation directly to `useAuth().user?.role` with a fallback to `localStorage.getItem('mockRole')` only when authentication is not present.
- Remove the redundant `Mock Role` UI switcher header from `DeficiencyBoard.tsx`.
- Ensure users logged in as `Admin` (or when `user.role === 'Admin'`) automatically receive full workflow privileges across all Kanban columns (`Ineffective`, `In Review`, `In Approval`, `Resolved`).

**Non-Goals:**
- Rewriting backend API role validation or Cloudflare Durable Object permissions.
- Changing authentication token structure or SSO login mechanism.

## Decisions

- **Decision 1**: Bind `DeficiencyBoard` role directly to `useAuth()`.
  - *Rationale*: Guarantees that the active user's actual login role is respected out-of-the-box.
  - *Alternative Considered*: Keep `Mock Role` switcher in header. Rejected as it creates confusion for logged-in users who expect their login role (`Admin`) to work automatically.

- **Decision 2**: Keep `Admin` super-user permission checks in UI.
  - *Rationale*: In ICOFR lifecycle workflows, Administrators require full override/approval visibility to inspect and action deficiencies at any stage.

## Risks / Trade-offs

- [Risk]: Demo or testing environments relying on switching roles on the fly without re-logging in.
  - *Mitigation*: Fallback to `user?.role || localStorage.getItem('mockRole') || 'Admin'` (or preserve mockRole override option in Dev/Profile if needed, but remove from production board header).
