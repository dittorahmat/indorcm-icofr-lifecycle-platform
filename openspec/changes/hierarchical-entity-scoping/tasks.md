## 1. Database Schema Updates

- [x] 1.1 Create the `business_entities` table in the database schema.
- [x] 1.2 Update the `gl_rows` table to include `entityId` and `parentEntityCode` fields.
- [x] 1.3 Generate and apply the Drizzle migration using `npx drizzle-kit push`.

## 2. Backend Implementation (Logic & CSV Parsing)

- [x] 2.1 Update `gl-parser.ts` to support the `Parent_Entity` column in CSV/Excel uploads.
- [x] 2.2 Implement the recursive tree construction logic from the flat entity list.
- [x] 2.3 Implement the bottom-up aggregation logic for rolling up GL balances.
- [x] 2.4 Update the scoping data fetcher to perform dynamic re-aggregation based on entity filters.

## 3. Frontend State & Hooks

- [x] 3.1 Update the `useScopingEditor` hook to manage `selectedEntityIds` state (using a Set).
- [x] 3.2 Implement the logic in `useScopingEditor` to automatically select/deselect child entities when a parent is toggled.
- [x] 3.3 Create a utility for calculating tri-state checkbox status based on selected children.

## 4. Frontend UI Components

- [x] 4.1 Create the `EntityTreeFilter` component for hierarchical selection.
- [x] 4.2 Integrate `EntityTreeFilter` into `ScopingEditorContent.tsx`.
- [x] 4.3 Update the Scoping Data Grid to respect the active entity filter.
- [x] 4.4 Add visual indicators/breadcrumbs showing the current roll-up context.

## 5. Testing & Validation

- [x] 5.1 Add unit tests for the recursive aggregation logic.
- [x] 5.2 Add unit tests for the hierarchical CSV parsing.
- [x] 5.3 Verify the tri-state checkbox behavior in the `EntityTreeFilter` component.
- [x] 5.4 Perform a full end-to-end test of the hierarchical scoping workflow.
