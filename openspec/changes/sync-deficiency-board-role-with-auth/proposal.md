## Why

Currently, the `DeficiencyBoard` component relies on an outdated local `Mock Role` state switcher (`Line 1`, `Line 2`, `Admin`) stored in `localStorage`, causing a mismatch with the user's actual authenticated role (e.g. `Admin`). As a result, users logging in as `Admin` cannot immediately see or execute actions like `Pass Review`, `Approve`, `Reject`, or `Edit Plan` on cards in states like `In Review` without discovering and clicking the `Mock Role` switcher header.

## What Changes

- Remove the manual `Mock Role` header selector from `DeficiencyBoard.tsx`.
- Connect `DeficiencyBoard` role evaluation directly to `AuthContext` (or authenticated user role context) fallback to unified role state.
- Ensure `Admin` role automatically gains full workflow execution privileges across all columns (`Ineffective`, `In Review`, `In Approval`, `Resolved`).
- Update card hover action buttons visibility and accessibility so users can clearly see available workflow actions based on their actual role.

## Capabilities

### Modified Capabilities

- `deficiency-management`: Update workflow permission and role determination on the Deficiency Board to use authenticated user roles instead of standalone mock role state.

## Impact

- Affected files: `src/pages/deficiencies/DeficiencyBoard.tsx`, `src/components/deficiencies/DeficiencyCard.tsx`, `src/components/layout/MainHeader.tsx` (if cleanup of stale `mockRole` is required).
- No database or backend API schema changes required.
