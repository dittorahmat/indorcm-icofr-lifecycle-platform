## Why

Users experience intermittent saving of qualitative rules and department/application assignments when editing the materiality scoping worksheet. This is caused by React state synchronization logic that unconditionally resets local workspace edits whenever background refetches or React Query queries are completed, resulting in data loss.

## What Changes

- Modify `useScopingEditor` in `useScopingPage.ts` to guard state synchronization from the server.
- Ensure that `simState`, `localDeptMappings`, and `localAppMappings` are only overwritten with incoming server values if the simulation ID has changed or if the state has no unsaved changes (`isDirty === false`).
- Preserve the user's edits during active session editing while retaining background sync capabilities.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Each creates specs/<name>/spec.md -->

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation). -->

## Impact

- **Frontend Hook**: `src/pages/scoping/hooks/useScopingPage.ts` (`useScopingEditor`)
- **Scoping Worksheet Components**: dropdown values for Qualitative Rules, department owners, and significant applications will no longer revert randomly while editing.
