## Why

Currently, new scoping simulations start with empty qualitative assessment data (the 8 pillars). This requires Line 2 teams to manually input ratings for every standard FSLI account, even though many accounts have predictable risk profiles based on their nature (e.g., "Cash and Cash Equivalents" always has high Fraud and Volume risks). This manual process is inefficient and prone to inconsistencies across different periods.

## What Changes

- **Assertion Library Integration**: Introduce a predefined mapping of FSLI names to default qualitative ratings (Low/Medium/High) for each of the 8 pillars.
- **Auto-Population Logic**: Modify the scoping simulation initialization to automatically look up FSLIs from the active snapshot in the library and populate `assessmentData` with defaults.
- **Library Storage**: Implement the library as a persistent service or constant, derived from the provided CSV data.

## Capabilities

### New Capabilities
- `scoping-assertions-library`: Centralized repository and service for mapping FSLI names to default qualitative assessment values.

### Modified Capabilities
- `gl-integration`: Extend scoping initialization to apply library defaults to the matrix immediately upon simulation creation, rather than starting with a blank state.

## Impact

- **Backend**: `ScopingService` will require logic to iterate unique FSLIs and apply defaults during simulation insertion.
- **Database**: The `assessmentData` field in the `simulations` table will now be initialized with JSON content instead of an empty object.
- **Frontend**: The `GLDataGrid` will display these defaults immediately, affecting the calculated `In Scope` status for FSLI groups.
