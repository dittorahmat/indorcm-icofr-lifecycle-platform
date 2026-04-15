# Proposal: Relational Audit Mapping in BPM

## Problem Statement
Currently, the relationships between Activities, Risks, and Controls in the BPM workflow are stored exclusively inside the `nodes` JSONB column of the `bpm_diagrams` table. While this works for visual rendering, it creates a "data silo" that prevents proper auditing and cross-module integration. Specifically, the Control Self-Assessment (CSA) module and the Risk Control Matrix (RCM) reporting cannot effectively query which controls mitigate which risks on which specific business activities.

## Goal
Migrate the `Activity -> Risk -> Control` relationship from a flat JSON structure into a fully relational database model. This ensures referential integrity, enables deep querying, and supports an interactive "Mini-Viewer" for CSA.

## Proposed Changes
1. **Schema Updates (Junction Tables)**:
   - Create `bpm_node_rcms`: Links a specific Activity node (`node_id`) in a diagram to a Risk (`rcm_id`).
   - Create `rcm_controls`: Links a Risk (`rcm_id`) to a Control (`control_id`), establishing a true Many-to-Many relationship (as a control can mitigate multiple risks).
2. **Backend API (`/api/bpm/sync`)**:
   - Implement a new "Global Save" API endpoint that takes the visual diagram data and automatically syncs the underlying junction tables to match the visual state.
3. **CSA Mini-Viewer Integration**:
   - Provide an endpoint to fetch a diagram and highlight a specific node, enabling CSA evaluators to visually see the context of the control they are assessing.
4. **Data Integrity on Deletion**:
   - Enforce database-level cascading or warnings. If a relationship is severed in the database, the visual diagram automatically reflects this reality, eliminating "visual lies".

## Impact
- **Compliance**: Fully supports SK-5/2024 auditing requirements where risks and controls must be traceable to specific transaction-level activities.
- **Reporting**: Allows for instant generation of RCM tables via simple SQL JOINs.
