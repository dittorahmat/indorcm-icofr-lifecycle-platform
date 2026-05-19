## Why

The current RBAC configuration for BPM process management incorrectly restricts access to 'Line 2' and 'Admin' roles. According to the business process, 'Line 1' (Business Process Owners) should be the primary actors responsible for creating and modifying BPM processes, while 'Line 2' focuses on review and approval.

## What Changes

- Update the RBAC middleware on BPM process endpoints (`POST`, `PATCH`, `DELETE`) to include the 'Line 1' role.
- Correct the misconfigured permission that was preventing 'Line 1' users from managing their business processes.

## Capabilities

### New Capabilities
<!-- No new capabilities, this is a permission fix -->

### Modified Capabilities
- `bpm-execution-hub`: Update permission requirements for process management to include Line 1.

## Impact

- `worker/routes/bpm.ts`: The specific file where RBAC middleware is applied to `/api/bpm-processes` endpoints.
- Users with the 'Line 1' role will now be able to manage BPM processes.
