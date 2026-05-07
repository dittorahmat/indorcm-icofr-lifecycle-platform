## Why

Users require a higher-density UI to view more data simultaneously, especially for complex RCM matrices. The current collapsible sidebar and standard font sizes reduce the visible working area and efficiency for data-heavy tasks.

## What Changes

- **Static Sidebar**: The application sidebar will be changed from collapsible to a fixed, static state to provide constant navigation access and a consistent layout.
- **UI Scaling**: Main sidebar fonts and group labels will be reduced in size to maximize density.
- **Uniform Table Typography**: RCM matrices (TLC, ELC, ITGC) will use a uniform, smaller font size (approx. 10px) for all headers, cells, and inputs.
- **Edit Feedback**: Visual indicators (icons or dots) will be added to table cells to highlight unsaved changes.
- **Scrollbar Unification**: Table scrolling logic will be refactored to prevent overlapping vertical scrollbars between the main layout and the table container.

## Capabilities

### New Capabilities
- `compact-ui-standards`: Establishment of high-density typography and layout standards across the platform, including edit indicators and unified scrolling.

### Modified Capabilities
<!-- None -->

## Impact

- `AppSidebar.tsx`: Significant styling and logic changes.
- `AppLayout.tsx`: Header and layout container adjustments.
- `RCMTLCPage.tsx`, `RCMELCPage.tsx`, `RCMITGCPage.tsx`: Table styling and scroll logic.
