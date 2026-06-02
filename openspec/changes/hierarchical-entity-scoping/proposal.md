## Why

State-Owned Enterprises (BUMN) often operate under complex hierarchical structures involving Holdings, Subsidiaries, and Branches. The current scoping process lacks a native way to represent these relationships, making it difficult to achieve transparent risk visibility and automated data roll-up across multiple organizational tiers.

This change digitizes hierarchical corporate structures in the scoping process, enabling bottom-up data aggregation and dynamic multi-tier filtering, which is essential for BUMN compliance with Regulation SK-5/DKU.MBU/11/2024.

## What Changes

- **Infinite Nesting Support**: Implementation of a recursive business entity structure (Holding -> Subsidiary -> Branch).
- **Hierarchical CSV Upload**: Update the GL upload process to support a `Parent_Entity` column for automatic hierarchy construction.
- **Bottom-up Balance Roll-up**: Automatic aggregation of GL balances from lower-tier entities to their parents.
- **Tri-state Hierarchical Filter**: A new multi-select checkbox filter in the Scoping Data Grid that supports selecting entire branches of the organizational tree.
- **Dynamic Re-aggregation**: Real-time recalculation of worksheet values based on the active entity filter.
- **Per-entity Scoping Logic**: Enable OM/PM calculations at the individual entity level.

## Capabilities

### New Capabilities
- `hierarchical-entities`: Core capability for managing parent-child relationships between business entities and constructing the organizational tree.
- `hierarchical-data-aggregation`: Recursive logic for bottom-up aggregation of GL balances and worksheet metrics across the entity hierarchy.
- `hierarchical-scoping-filter`: UI component and state management for filtering the scoping matrix using a hierarchical tri-state checkbox tree.

### Modified Capabilities
- `gl-integration`: Update the GL CSV parser and data model to support `Parent_Entity` mapping and associate financial data with specific business entities.

## Impact

- **Database**: New `business_entities` table and schema updates for `gl_rows`.
- **Backend**: Update to `gl-parser.ts` and new aggregation services.
- **Frontend**: New `EntityTreeFilter` component and updates to `ScopingEditorContent.tsx` and `useScopingEditor` hook.
- **Data Model**: Financial calculations will now be context-aware based on the filtered entity hierarchy.
