## Context

The current sidebar uses fixed-height buttons (`h-8`, `h-7`, `h-12`) and `truncate` classes from Tailwind CSS. This combination prevents browser text-wrapping logic from functioning. Specifically, `truncate` sets `white-space: nowrap`, forcing all text onto a single line and clipping it with an ellipsis if it's too long.

## Goals / Non-Goals

**Goals:**
- Enable multi-line text wrapping for sidebar menu buttons.
- Ensure buttons expand vertically to fit their content.
- Maintain visual alignment of icons and badges.
- Ensure zero regression for the collapsed (icon-only) state.

**Non-Goals:**
- Changing the overall width of the sidebar.
- Redesigning the sidebar navigation structure.
- Adding tooltips for long labels (text will be fully visible via wrap).

## Decisions

### Decision: Replace Fixed Height with `min-h-*` and `h-auto`
To allow the container to grow, we must remove the explicit `h-8` (and variants) and replace them with `min-h-8` and `h-auto`. This ensures a consistent minimum size while allowing expansion.
- **Rationale**: Browser `flex` and `block` layouts correctly calculate auto height only if a fixed height is not overriding them.

### Decision: Remove `truncate` and set `white-space: normal`
The `truncate` class is a shortcut for `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap`. We need to remove this and explicitly set `white-space: normal` (or use `whitespace-normal` in Tailwind) to allow wrapping.
- **Rationale**: `whitespace-nowrap` is the primary blocker for multi-line text.

### Decision: Scope Wrap to Expanded State
When the sidebar is collapsed (`group-data-[collapsible=icon]`), the text labels are technically still in the DOM but hidden via `opacity-0` or similar. To prevent unexpected layout shifts or "phantom" heights, we will ensure that the text container is explicitly hidden in the collapsed state.
- **Rationale**: Prevents wide/tall invisible elements from interfering with the icon-only view.

### Decision: Icon Alignment via `items-start`
Currently, items are likely centered (`items-center`). For multi-line text, `items-start` with top padding is often more professional as it keeps the icon anchored to the first line.
- **Rationale**: Icons appearing in the middle of a 3-line block look disconnected.

## Risks / Trade-offs

- **[Risk] Visual Density** → Large menus with many multi-line items might feel cluttered. *Mitigation*: Ensure adequate vertical padding between items.
- **[Risk] Layout Jumps** → Sidebar might "grow" as items load if translations are slow. *Mitigation*: The minimum height (`min-h-8`) handles the standard case.
