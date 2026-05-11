## Context

Currently, the `CSA` module uses a `POST` request for all submissions, regardless of whether it's a new entry or an update. This causes a new database record to be created for every save, leading to duplicates. The backend lacks a corresponding `PUT` handler to update existing records, and the frontend currently lacks the logic to trigger such an update.

## Goals / Non-Goals

**Goals:**
- Implement a `PUT /api/csa/:id` backend route.
- Implement transactional record update in the database to keep `csaRecords` and `csaSamples` in sync.
- Refactor the frontend `useCSA.ts` to switch to `PUT` when an `activeCsaId` is present.

**Non-Goals:**
- Refactoring the entire database schema.
- Changing existing `POST` or `GET` functionality, except where necessary to avoid interference.

## Decisions

- **Transactional Update:** Use `db.transaction` to ensure that updating `csaRecords` and refreshing `csaSamples` (delete-then-re-insert) happens atomically, preventing partial updates.
- **Sample Management Strategy:** To ensure the samples stored in the database exactly match the samples submitted from the frontend, the backend will delete all existing `csaSamples` associated with the specific `csaRecordId` and then perform a batch insert of the new samples.

## Risks / Trade-offs

- **[Risk] Transaction Failure:** If a transaction fails mid-update, the samples might be deleted without a successful re-insert.
  - **Mitigation:** Use proper error handling in the database transaction and ensure the client can retry the update.
- **[Risk] Sample Deletion Complexity:** Deleting all samples and re-inserting might lose audit trails for individual samples.
  - **Mitigation:** The current design treats the CSA assessment as a monolithic state; audit logs are focused on the record-level sign-off.
