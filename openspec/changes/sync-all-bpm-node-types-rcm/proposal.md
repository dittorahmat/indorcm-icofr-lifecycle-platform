## Why

Users are experiencing an issue where Risks and Controls created directly in the BPM Editor using specialized custom node types (such as Hexagon `preparation`, Cylinder `data-media` or `stored-data`, Inverted Triangle `archive`, Decision, Document, etc.) do not appear in the RCM TLC, ELC, or ITGC matrices. 

The root cause is that the backend synchronization logic in `BpmService.ts` restricts processing and hydration of Risk/Control data exclusively to nodes of type `'activity'` and `'automated-activity'`. Since these custom shapes are ignored by the backend sync, they are never written to the `rcms`, `controls`, and `rcmControls` database tables.

## What Changes

- **Update BpmService Node Sync Logic**: Modify the backend service (`worker/services/bpm-service.ts`) to sync RCM data for all node types except start, end, reference, and swimlane nodes (matching the frontend capability check in `RegulatoryPropertySheet.tsx`).
- **Update Node Hydration Logic**: Update `hydrateDiagramNodes` in `bpm-service.ts` to fetch and hydrate RCM data for all valid RCM node types.
- **Implement Backfill Migration Script**: Provide a script `scripts/backfill-bpm-custom-nodes.ts` that scans all diagrams in `bpm_diagrams`, extracts risks and controls from all node types, and syncs them to the RCM database tables.

## Capabilities

### Modified Capabilities
- `bpm-execution-hub`: Extend synchronization to support all valid compliance node shapes defined by Regulation SK-5/DKU.MBU/11/2024.

## Impact

- **Worker Services**: `worker/services/bpm-service.ts` logic updates.
- **Data Completeness**: All previously orphaned risks/controls in diagrams will be synced to the RCM matrices via backfill.
