## Why

While the system currently calculates rollup balances for parent-child entities, the scoping matrix displays them in a flat list grouped only by FSLI. To allow State-Owned Enterprises (BUMN) to visualize and manage financial statement risk across multiple organizational tiers, the scoping grid itself needs to support expandable/collapsible hierarchical rows for parent and child entities.

## What Changes

- **Dynamic Table Grouping**: Update `GLDataGrid` to automatically group rows by `parentEntityCode`, `entityCode`, and `fsliName` when multiple entities with hierarchical relationships are active in the simulation.
- **Unified Expandable Row Renderer**: Add expand/collapse chevrons and formatted labels for parent entities and child entities within the main scoping grid.
- **Hierarchical Balance Aggregation in Grid**: Aggregated values for `balance` will be summed and displayed at every parent group level (Parent Entity, Child Entity, and FSLI).
- **Hierarchical Scoping Badge Aggregation**: The "In Scope" or "Out of Scope" badge will roll up so that parent entity levels visually show as "In Scope" if any nested entity or account within them is significant.

## Capabilities

### New Capabilities
- `hierarchical-grid-grouping`: Core capability to group and render the GL scoping matrix table dynamically as a nested parent-child entity and FSLI tree.

### Modified Capabilities
<!-- None -->

## Impact

- **Frontend**: Update `GLDataGrid.tsx` and custom TanStack Table configurations to support multiple grouping states, custom aggregated cell rendering, and collapse/expand handlers.
