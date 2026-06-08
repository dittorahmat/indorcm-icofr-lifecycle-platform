## Why

Users are experiencing data loss when creating Risks and Controls directly in the BPM Editor. Although saved on the canvas, these entities do not appear in the RCM TLC tab because they lack the required `year` metadata and robust `bpmProcessId` linkage, which are essential for tabular filtering and regulatory reporting.

## What Changes

- **BpmService Update**: Modify the sync logic to inject the current `year` from the diagram into all associated `rcms` and `controls` records.
- **Robust Linkage**: Enhance the `bpmProcessId` resolution logic to be more resilient (e.g., handling name normalization and organization/year matching).
- **Tabular Visibility**: Ensure that data created in the BPM Editor is immediately visible in the RCM TLC tab of the Execution Hub.
- **Data Integrity**: Ensure that `fsliCodes` and other metadata are correctly propagated during visual-to-database sync operations.

## Capabilities

### New Capabilities
- `temporal-data-consistency`: Ensures that all regulatory entities created via visual tools maintain strict temporal (year) and organizational alignment.

### Modified Capabilities
- `bpm-execution-hub`: Strengthening the visual-to-tabular data linking requirement to include mandatory `year` propagation and resilient name matching.

## Impact

- **Worker Services**: `worker/services/bpm-service.ts` will undergo logic changes for record synchronization.
- **Database Records**: Existing records with `null` years may need to be updated to restore visibility.
- **Frontend Sync**: Ensures the BPM Editor sends sufficient metadata during save operations.
