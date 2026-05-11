## Context

The RCM (Regulatory Compliance Matrix) system displays large datasets across three main pages: TLC, ITGC, and ELC. The current UI suffers from two primary issues:
1. **Double Scrollbars**: The `Table` component has a built-in `overflow-auto` wrapper, while the page layout also attempts to manage scrolling. This results in redundant scrollbars.
2. **Low Contrast Zebra Stripes**: The current `bg-slate-50/50` zebra striping is too subtle for dense regulatory data.

## Goals / Non-Goals

**Goals:**
- Consolidate horizontal and vertical scrolling into a single, predictable experience.
- Increase visual distinction between rows in the RCM matrices.
- Maintain existing sticky header functionality.

**Non-Goals:**
- Refactoring the entire `Table` component architecture.
- Changing the data fetching or state management logic.

## Decisions

### 1. `Table` Component Flexibility
**Decision**: Add a `noWrapper` prop to the `Table` component in `src/components/ui/table.tsx`.
**Rationale**: This allows specific pages to opt-out of the default `overflow-auto` wrapper without impacting other tables in the application.
**Alternative**: Creating a separate `MatrixTable` component. Rejected as it would lead to code duplication for minimal gain.

### 2. Parent-Level Scroll Management
**Decision**: Move the scroll responsibility to the container in the RCM pages.
**Rationale**: By making the parent container `relative overflow-auto`, we ensure that the sticky header (using `sticky top-0`) remains anchored to the top of the scrollable viewport.
**Implementation**: Use `<Table noWrapper ...>` and ensure the parent `div` has `overflow-auto`.

### 3. Explicit Zebra Stripe Coloring
**Decision**: Use `#A9A9A9` for even rows in the RCM matrices.
**Rationale**: Directly fulfilling the user's aesthetic and accessibility requirement for higher contrast.
**Implementation**: Update the `cn` logic in `TableRow` across the three RCM pages to use `even:bg-[#A9A9A9]`.

## Risks / Trade-offs

- [Risk] Sticky headers might not align if the parent container is not correctly positioned. → [Mitigation] Use `relative` on the parent container and verify `top-0` positioning.
- [Risk] Background color `#A9A9A9` (Dark Gray) might reduce text contrast. → [Mitigation] Monitor readability and ensure text colors are sufficiently dark (or light) to remain legible.
