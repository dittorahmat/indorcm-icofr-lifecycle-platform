## Context

The `GLDataGrid` component uses `@tanstack/react-table` v8 to render the Scoping worksheet. It implements grouping by `fsliName` to organize GL accounts. Currently, all data is rendered at once, leading to performance issues when datasets grow large. React Table provides a built-in pagination model that can be integrated to solve this.

## Goals / Non-Goals

**Goals:**
- Implement client-side pagination to improve rendering performance.
- Limit display to 15 FSLI groups per page.
- Provide clear navigation controls (Previous/Next/Page Info).
- Ensure row expansion works correctly within the paginated view.

**Non-Goals:**
- Server-side pagination (the full dataset is already fetched and held in memory; the bottleneck is DOM rendering).
- Configurable page size (keeping it fixed at 15 for simplicity and consistency).

## Decisions

- **Decision 1: Use `getPaginationRowModel`**
  - **Rationale**: This is the standard TanStack Table extension for pagination. It integrates seamlessly with existing `getGroupedRowModel` and `getExpandedRowModel`.
  - **Alternatives**: Manual slicing of data. *Reason for rejection*: Manual slicing would require duplicating TanStack's grouping logic to ensure we don't cut in the middle of a group.
- **Decision 2: Paginating by Groups**
  - **Rationale**: By placing the pagination model after the grouped model in the table processing pipeline, the "rows" being paginated are the top-level group rows (FSLIs).
- **Decision 3: `autoResetExpanded: false`**
  - **Rationale**: We must ensure that navigating between pages does not collapse expanded rows, which is the default behavior when data or state changes.

## Risks / Trade-offs

- **[Risk] State Loss on Page Change** → **Mitigation**: Use stable row IDs and set `autoResetExpanded: false` in the table configuration to preserve expansion state.
- **[Risk] Confusion with GL counts** → **Mitigation**: Explicitly label the pagination as "FSLI pages" or use "Showing X of Y FSLIs" to clarify that the limit applies to the groups, not the individual accounts.
- **[Risk] Mobile Layout** → **Mitigation**: Ensure pagination controls are responsive or wrap cleanly on smaller screens.
