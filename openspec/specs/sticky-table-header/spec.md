# sticky-table-header Specification

## Purpose
TBD - created by archiving change freeze-rcm-header. Update Purpose after archive.
## Requirements
### Requirement: Sticky Header Visibility
The `RCMTable` header MUST remain fixed at the top of its scrollable container when the user scrolls vertically.

#### Scenario: Vertical scrolling maintains header position
- **WHEN** the user scrolls vertically within an RCM table that exceeds the container height
- **THEN** the table header SHALL stay visible at the top of the scrollable area

### Requirement: Scrollable Container Context
The container wrapping the `RCMTable` MUST establish a scrollable context with `overflow-y: auto` and a defined height (or flex-1 behavior) to allow `position: sticky` to function correctly.

#### Scenario: Table container allows internal scrolling
- **WHEN** data exceeds the viewport height on TLC, ELC, or ITGC pages
- **THEN** the scrollbar SHALL appear on the table container, and the page header SHALL remain fixed above the scrollable area

### Requirement: Sticky Group Rows
`RCMGroupRow` components MUST remain visible at the top of the scrollable container (below the main headers) when the user scrolls through data within that group.

#### Scenario: Scrolling within a group
- **WHEN** the user scrolls vertically past a group header
- **THEN** the `RCMGroupRow` SHALL remain visible below the table headers until the next group header replaces it or the group ends.

