## Context

The IndoGRC Pro application currently uses a modern, airy UI based on shadcn/ui defaults. While visually pleasing, this layout is inefficient for power users managing hundreds of rows in Regulatory Compliance Matrices (RCM). Specifically, the collapsible sidebar consumes cognitive load to toggle, and large fonts/padding reduce the "information density" of the tables.

## Goals / Non-Goals

**Goals:**
- Convert the sidebar to a static, non-collapsible component with reduced width and typography.
- Standardize RCM table typography to a consistent 10px size.
- Implement an "Edited" indicator for table cells to provide immediate visual feedback.
- Eliminate redundant vertical scrollbars in RCM pages.

**Non-Goals:**
- Changing the underlying data structures or API schemas.
- Adding new functional features to the RCM matrices (except for visual indicators).
- Modifying non-RCM pages unless necessary for sidebar consistency.

## Decisions

### 1. Static Sidebar Implementation
- **Decision**: Set `collapsible="none"` on the `Sidebar` component and remove the `SidebarTrigger` from `AppLayout`.
- **Rationale**: Provides the requested "sturdy" feel. Users on large screens (BUMN auditors) prefer fixed navigation.
- **Alternatives**: Keeping the sidebar collapsible but defaulting it to "open". *Rejected* as it doesn't solve the "font size" and "static feel" request.

### 2. High-Density Typography (Tailwind Overrides)
- **Decision**: Use `text-[11px]` for sidebar items and `text-[10px]` for RCM table content.
- **Rationale**: Standard `text-xs` (12px) is still too large for the desired density. Explicit pixel values provide the precise control requested by the user.

### 3. Scrollbar Unification
- **Decision**: Apply `overflow-hidden` to `SidebarInset` when the RCM page is active. Set the table's container to `h-[calc(100vh-theme(spacing.14)-theme(spacing.4))]`.
- **Rationale**: This forces the vertical scroll to live only on the table container, which also enables `sticky` headers to function correctly relative to the table's scroll position.

### 4. Edit Indicators
- **Decision**: Compare the current cell value with the initial value from `matrixData.items`. If they differ, display a 2px blue right-border on the input field or a small indicator icon.
- **Rationale**: Minimalist feedback that doesn't add layout shift or consume extra horizontal space.

## Risks / Trade-offs

- **[Risk] Accessibility** → Mitigation: Ensure the small font size remains legible by using high-contrast colors (indigo on white) and allowing browser zoom to work correctly.
- **[Risk] Responsive Breakpoints** → Mitigation: Maintain the existing mobile menu behavior where the sidebar becomes a drawer, only applying the "static" logic to desktop views.
