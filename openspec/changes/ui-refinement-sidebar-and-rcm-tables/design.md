## Context

The current UI design has redundant controls in the `MainHeader` (Pin/Unpin) and lacks sufficient visual distinction for the dense RCM data tables. We need to declutter the header and apply consistent zebra-striping to improve table readability.

## Goals / Non-Goals

**Goals:**
- Streamline `MainHeader` by removing the redundant sidebar pin toggle.
- Enhance readability of RCM tables by implementing alternating row background colors.
- Maintain consistent visual standards across the project.

**Non-Goals:**
- Changing sidebar functionality beyond UI cleanup.
- Refactoring the entire table component logic.

## Decisions

- **Remove Pin/Unpin**: The button will be deleted from `MainHeader.tsx`. Pinning state management will remain in `useSidebar` but we assume the user will rely on sidebar behavior as-is.
- **Zebra-Striping**: Implement using `idx % 2 === 0` logic in the row mapping functions.
  - White rows (`bg-white`) for alternating indices.
  - Slate rows (`bg-slate-50`) for the other alternating indices.
  - This is a lightweight, performant change.

## Risks / Trade-offs

- [Risk] UI Inconsistency → Mitigation: Ensure all three pages (TLC, ELC, ITGC) are updated with identical striping styles.
