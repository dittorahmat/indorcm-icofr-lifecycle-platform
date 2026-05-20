## Why

The Materiality Simulation table (GLDataGrid) currently renders all FSLI rows on a single page. For large datasets with many FSLIs and their corresponding GL accounts, this results in significant performance degradation, causing the UI to become unresponsive or "laggy." Implementing pagination will improve rendering performance and provide a better user experience by limiting the amount of data processed and displayed at once.

## What Changes

- **Pagination Implementation**: Integrate `getPaginationRowModel` from `@tanstack/react-table` into the `GLDataGrid` component.
- **Fixed Page Size**: Set the default page size to 15 FSLI (top-level) rows.
- **UI Controls**: Add a pagination control bar at the bottom of the table including "Previous," "Next," and "Page X of Y" indicators.
- **Localization**: Add new strings for pagination labels in both English (`en`) and Indonesian (`id`) scoping locale files.
- **Refined Grouping Behavior**: Ensure that expanding an FSLI row displays its child GL accounts within the same page without affecting the FSLI count limit.

## Capabilities

### New Capabilities
- `scoping-pagination`: Handles the paginated view and navigation of FSLI-grouped rows in the Scoping worksheet.

### Modified Capabilities
- (None)

## Impact

- `src/components/scoping/GLDataGrid.tsx`: Main logic and UI for the table.
- `src/i18n/locales/en/scoping.json`: English translations.
- `src/i18n/locales/id/scoping.json`: Indonesian translations.
