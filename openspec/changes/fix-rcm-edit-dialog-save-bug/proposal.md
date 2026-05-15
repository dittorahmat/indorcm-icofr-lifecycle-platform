## Why

The current RCM implementation has a critical bug where changes made in the standardized `RCMEditDialog` popup are not persisted to the database. This occurs due to a mismatch between frontend form field names and backend database schema across different RCM levels (ELC, TLC, ITGC), as well as incorrect API endpoint handling and HTTP methods. Fixing this is essential to ensure data integrity and a functional auditor workflow as mandated by the SK-5 regulation.

## What Changes

- **Identity Handling**: Add missing `id` field to `formSchema` in `RCMEditDialog` to prevent `undefined` values in API URLs.
- **Bi-directional Mapping**: Implement a "Reverse Mapping" logic to translate frontend-standardized field names (e.g., `mappedControlName`) back to their respective database names (e.g., `name` for ELC, `controlName` for TLC/ITGC).
- **HTTP Method Correction**: Transition from incorrect `PATCH` calls to supported `PUT` calls for the ELC update endpoint.
- **Risk Data Persistence**: Ensure Risk Description and Rating changes in TLC/ITGC are correctly routed to the `rcms` table or handled by an updated backend endpoint.
- **Boolean Conversion**: Standardize the conversion of boolean UI states (Switches) to the expected database string formats for IPO and Assertions.

## Capabilities

### New Capabilities
- `rcm-data-synchronization`: A standardized mechanism to ensure bi-directional consistency between the unified RCM UI components and the heterogeneous backend data models.

### Modified Capabilities
- `rcm-standardized-components`: Update existing requirements for `RCMEditDialog` to include strict data contract validation and multi-level mapping support.

## Impact

- **Frontend**: `RCMEditDialog.tsx`, `RCMELCPage.tsx`, `RCMTLCPage.tsx`, `RCMITGCPage.tsx`.
- **Backend**: `worker/routes/rcm.ts` (potentially needs a new or updated endpoint for integrated risk-control updates).
- **Database**: No schema changes expected, but data integrity is restored.
