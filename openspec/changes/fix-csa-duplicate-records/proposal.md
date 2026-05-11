## Why

Currently, saving a draft in the CSA module creates a new record in the database every time because the system defaults to a POST request, and there is no logic to handle updates for existing CSA records. This leads to data duplication and an inflated number of records in the assessment history.

## What Changes

- Implement a new `PUT /api/csa/:id` endpoint in the backend.
- Update the `createMutation` logic in `useCSA.ts` to differentiate between creating (POST) and updating (PUT) CSA records based on the presence of an `activeCsaId`.
- Ensure transactional integrity for updating both the main CSA record and its associated samples.

## Capabilities

### New Capabilities
- `csa-record-update`: Enables updating of existing CSA records and their samples.

### Modified Capabilities
- `csa-management`: Updating requirements to support update (PUT) operations alongside create (POST).

## Impact

- **Backend**: New API endpoint `/api/csa/:id`.
- **Frontend**: `useCSA.ts` will now handle updates properly, improving data integrity.
