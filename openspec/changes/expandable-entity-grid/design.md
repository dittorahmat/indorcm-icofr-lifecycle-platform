## Context

Currently, the Scoping Page's `GLDataGrid` displays financial statements as a flat table grouped strictly by `fsliName`. When multiple hierarchical entities are active in a simulation, balances are rolled up in calculations, but the breakdown of accounts across parent and child entities (e.g., parent entity `030` vs. child entity `002`) is hidden inside the flat FSLI groupings. This design outlines how we will implement expandable grouping by parent and child entities in the scoping table.

## Goals / Non-Goals

**Goals:**
- Enable visual parent-child entity expansion within the main scoping table.
- Display correct roll-up balances for parent entity levels, child entity levels, and FSLI levels.
- Support scoping status ("In Scope") roll-up to parent levels.
- Maintain existing feature sets (owner assignment, department picker, application mapping) for individual accounts.

**Non-Goals:**
- Changing the underlying data structures passed between the page and components; the data type remains `GLRow[]`.
- Storing separate workflow or review approvals per sub-entity; the baseline simulation approval remains unified.

## Decisions

### 1. Leverage TanStack Table Grouping vs. Pre-constructed Custom Hierarchical Trees
- **Decision**: Use TanStack Table's built-in `grouping` state with columns `['fsliName', 'parentEntityCode', 'entityCode']`.
- **Alternatives Considered**: Modifying the dataset into a custom nested object model (`subRows` recursive structure).
- **Rationale**: Transforming the data type to a custom tree model would break compatibility with all other React table accessories, selection helpers, and backend API contracts. Using TanStack Table's built-in grouping allows us to keep the `GLRow[]` type intact while achieving the exact visual nesting desired.

### 2. Dynamic Grouping Hierarchy
- **Decision**: Compute the `grouping` state dynamically in `GLDataGrid` based on the dataset:
  *   If unique entities count <= 1: Group by `['fsliName']` only.
  *   If multiple entities are present and have parent-child relationships (e.g., `parentEntityCode !== entityCode`): Group by `['fsliName', 'parentEntityCode', 'entityCode']`.
  *   Otherwise: Group by `['fsliName', 'entityCode']`.
- **Rationale**: Prevents empty/redundant outer groupings for single-entity spreadsheets while automatically supporting complex organizational trees when they are present.

### 3. Unified Expandable Column
- **Decision**: Customize the `fsliName` column renderer to display the group label and expansion chevrons depending on `row.groupingColumnId`.
  *   `parentEntityCode` level: Renders "Parent Entity: [Code]" with chevron.
  *   `entityCode` level: Renders "Entity: [Code]" with chevron.
  *   `fsliName` level: Renders FSLI name with chevron.
  *   Leaf rows: Renders the FSLI name as plain text.
- **Rationale**: Keeps the grid layout clean without needing to introduce extra columns that would clutter the screen.

### 4. Table Cell Aggregation Function
- **Decision**: Define `aggregationFn: 'sum'` for the `balance` column, and custom aggregation checks for scoping badges (`quantFlag`, `finalStatus`) to show proper status tags on parent levels.
- **Rationale**: Standardizes cell rendering behavior on grouped rows.

## Risks / Trade-offs

- **[Risk] Redundancy in Parent vs. Entity labels** &rarr; *Mitigation*: The dynamic grouping logic checks if there is any actual parent-child difference. If `parentEntityCode === entityCode` for all rows, it falls back to grouping by `entityCode` only.
- **[Risk] Expansion state reset on table updates** &rarr; *Mitigation*: Maintain `autoResetExpanded: false` in the `useReactTable` config to prevent unwanted collapses when a user modifies departments or apps.
