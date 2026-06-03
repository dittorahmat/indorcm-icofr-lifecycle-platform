## Why

Migrated RCM data is currently invisible in the RCM Matrix views because the system requires a link to a visual diagram node (`bpm_node_rcms`) to display them. This change ensures that all risk data is visible immediately after upload and that fiscal year filtering works correctly across all RCM modules.

## What Changes

- **Query Refactoring**: Change `innerJoin` to `leftJoin` for `bpmNodeRcms` and `bpmDiagrams` in RCM Matrix backend endpoints.
- **Year Filtering**: Update RCM backend endpoints to accept and filter by a `year` parameter.
- **Frontend Integration**: Pass the global `workingYear` from the application header to all RCM data fetching hooks.

## Capabilities

### New Capabilities
- `rcm-matrix-visibility`: View all risk and control mappings regardless of their visual placement in a BPM diagram.

### Modified Capabilities
- `global-fiscal-year-context`: Extend the centralized fiscal year filtering to the RCM Matrix and reporting modules.

## Impact

- **Backend**: `worker/routes/rcm.ts` (TLC and ITGC endpoints).
- **Frontend**: `src/pages/rcm/RCMTLCPage.tsx`, `src/pages/rcm/RCMList.tsx`, and `ITGCTabContent.tsx`.
