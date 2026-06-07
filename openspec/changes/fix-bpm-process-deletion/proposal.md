## Why

Attempting to delete a BPM process from the system currently fails with a PostgreSQL foreign key constraint violation (`23503`). This happens because records in the `controls` table (and potentially `csa_records`) still reference the `bpm_processes` ID being deleted. The database schema does not have `ON DELETE CASCADE` or `SET NULL` configured for these relationships, and the application service does not perform a manual cleanup before deletion.

## What Changes

- **Backend (BpmService.ts)**: Update `deleteProcess` to manually clean up or decouple dependent records before deleting the parent BPM process.
- **Database Schema (Optional/Future)**: Consider adding `onDelete: 'set null'` or `cascade` to the `bpmProcessId` columns in `controls` and `csa_records`. For now, we will implement the fix in the service layer for immediate effect without requiring a migration if preferred, or include the migration if we want a permanent fix. *Decision: We will implement a surgical service-layer cleanup first to avoid breaking existing data mappings unexpectedly.*

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Update process lifecycle management to handle cascading deletions or decoupling of related audit entities.

## Impact

- **Affected Code**: `worker/services/bpm-service.ts`.
- **Database Integrity**: Ensures that deleting a process doesn't leave orphaned references or cause server crashes.
- **User Experience**: Users can now successfully delete processes they created by mistake or that are no longer relevant.
