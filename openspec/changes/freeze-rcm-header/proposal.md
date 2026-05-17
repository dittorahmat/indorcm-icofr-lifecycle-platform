## Why

RCM tables (TLC, ELC, ITGC) are data-intensive and often contain a large number of rows and columns. When users scroll vertically to view more data, the table headers disappear, causing a loss of context regarding what each data point represents. This change aims to improve usability by keeping headers visible during vertical scrolling, similar to the "Freeze Panes" feature in Excel.

## What Changes

- Modify the `RCMTable` component to support a functional sticky header.
- **REMOVAL**: Remove horizontal sticky column (freeze column) functionality to resolve conflicts with vertical stickiness and simplify the UI.
- Ensure `RCMGroupRow` remains visible during vertical scroll within its context.
- Update parent layout containers for TLC, ELC, and ITGC RCM pages to ensure the sticky context is properly established (handling overflow and height).
- Ensure consistent behavior across all RCM-related tables.

## Capabilities

### New Capabilities
- `sticky-table-header`: Provides a consistent mechanism for keeping table headers fixed at the top of the viewport or container during vertical scrolling across all RCM views.

### Modified Capabilities
<!-- None -->

## Impact

- `src/components/rcm/RCMTable.tsx`: Core table component where the sticky logic resides.
- `src/pages/rcm/RCMTLCPage.tsx`, `src/pages/rcm/RCMELCPage.tsx`, `src/pages/rcm/RCMITGCPage.tsx`: Page layouts that wrap the RCMTable.
- General UI consistency and vertical scroll behavior.
