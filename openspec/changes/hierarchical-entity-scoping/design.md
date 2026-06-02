## Context

IndoGRC Pro currently handles financial scoping as a flat list of GL accounts. BUMN structures require a hierarchical approach where data can be viewed and aggregated at different levels (Holding, Subsidiary, Branch). This requires a structural shift in how entities are modeled and how data is associated and rolled up.

## Goals / Non-Goals

**Goals:**
- Implement a recursive data model for business entities.
- Support hierarchical GL data association via CSV import.
- Provide a bottom-up aggregation logic for financial metrics.
- Enable multi-tier filtering in the scoping UI with automatic child selection.

**Non-Goals:**
- Implementing "Multiplier Capping" logic (OM Grup x Multiplier) at this stage.
- Creating individual RCM/CSA workspaces per sub-branch; scoping remains linked to the global simulation.

## Decisions

### 1. Database Schema
- **New Table: `business_entities`**:
  - `id`: Primary Key (UUID)
  - `orgId`: Reference to organization
  - `code`: Unique entity code (e.g., 'SUB-01')
  - `name`: Display name
  - `parentId`: Self-referencing FK to `id` for hierarchy
  - `levelType`: Enum ('holding', 'subsidiary', 'branch', 'other')
- **Update Table: `gl_rows`**:
  - Add `entityId`: Reference to `business_entities.id`
  - Add `parentEntityCode`: (Denormalized) string to aid in initial linking during CSV upload if `id` is not yet known.

### 2. Recursive Aggregation Logic
- **Approach**: Bottom-up traversal using an in-memory tree structure.
- **Rationale**: For typical BUMN structures (hundreds to thousands of accounts), building a tree in memory within a Cloudflare Worker is more performant than multiple recursive SQL queries.
- **Implementation**: A utility function will fetch all relevant entities and GL rows, build a hierarchy, and perform a post-order traversal to roll up balances.

### 3. Frontend Filtering Component (`EntityTreeFilter`)
- **Component**: A recursive checkbox tree component.
- **State Management**: Uses a `selectedEntityIds` set in `useScopingEditor`.
- **Logic**: Checking a parent automatically adds all descendant IDs to the set. Unchecking a parent removes them.
- **Tri-state**: Visual "indeterminate" state if only some children are selected.

### 4. Hierarchical CSV Parser (`gl-parser.ts`)
- **Logic**: Use a two-pass approach. First pass identifies all unique entities and their parent codes. Second pass links GL rows to the identified entity IDs.
- **Validation**: Ensure no circular dependencies are created in the parent-child relationships.

## Risks / Trade-offs

- **[Risk] Performance with deep hierarchies** → **Mitigation**: Implement memoization for roll-up calculations and optimize the tree construction logic.
- **[Risk] Ambiguous Parent mapping in CSV** → **Mitigation**: Require unique `Entity_Code` in CSV to ensure precise mapping.
- **[Risk] Complexity of Tri-state checkboxes** → **Mitigation**: Use a well-tested pattern for recursive checkbox selection to avoid state desync.
