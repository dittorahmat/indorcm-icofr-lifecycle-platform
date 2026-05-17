## Context

The `RCMTable` component is designed with sticky header classes (`sticky top-0`), but these are currently ineffective because the table is rendered within parent containers that either do not have a height constraint or do not have `overflow: auto`. Consequently, the browser scrolls the entire page body, causing the header to move out of view.

## Goals / Non-Goals

**Goals:**
- Fix the `RCMTable` header so it remains stuck at the top during vertical scrolling.
- Standardize the scrollable container pattern across TLC, ELC, and ITGC pages.
- Ensure horizontal scrolling remains functional and performant.

**Non-Goals:**
- Complete refactor of the `RCMTable` data handling.
- Changing the existing sticky column (left/right) logic, unless required for header compatibility.

## Decisions

- **Container-Based Scrolling**: Instead of scrolling the whole window, the RCM table area will be made scrollable. This is achieved by adding `overflow-auto` and ensuring the parent container uses a flex layout (`flex-1`) with a minimum height of 0.
- **Z-Index Layering**:
  - Sticky Headers: `z-30` (Level 1) and `z-20` (Level 2).
  - Sticky Group Rows: `z-40`.
  - This layering ensures headers always stay on top of body cells.
- **Group Row Stickiness**: `RCMGroupRow` will use `position: sticky` with a `top` value of `88px` (40px + 48px from headers) to stay anchored below the main headers.
- **Native CSS Sticky**: Avoid JavaScript-based scroll listeners for performance and simplicity.
- **Simplified Columns**: All horizontal sticky column (left/right) logic is removed to avoid conflicts with vertical scrolling and simplify the table implementation.

## Risks / Trade-offs

- **Risk**: Table might look "cut off" if the container height isn't calculated correctly.
  - **Mitigation**: Use `flex-1` and ensure the main page container spans the full height of the viewport minus the navbar/header.
- **Risk**: Interaction with tooltips in headers.
  - **Mitigation**: Ensure `TooltipContent` has a sufficiently high z-index (`z-[100]`) to appear above all sticky elements.
