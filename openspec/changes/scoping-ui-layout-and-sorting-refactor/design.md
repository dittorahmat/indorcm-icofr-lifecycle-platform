## Context

The Scoping worksheet is the primary tool for identifying significant accounts. It currently uses a static grid layout where parameters are fixed on the right. Financial data tables often have many columns, making the current layout cramped. Additionally, the regulatory requirement for sorting accounts based on `noUrut` (Sequence Number) is not fully honored in the hierarchical view.

## Goals / Non-Goals

**Goals:**
- Implement hierarchical sorting: Groups (FSLIs) sorted by `min(noUrut)`, and items (GLs) within groups sorted by `noUrut`.
- Relocate parameters to a left-side collapsible panel.
- Allow the data grid to take full width when parameters are hidden.
- Adhere to Clean Code principles (DRY, KISS, SOLID).

**Non-Goals:**
- Changing the underlying data model or API responses.
- Modifying the approval workflow logic.
- Adding new materiality calculation rules.

## Decisions

### 1. Hierarchical Sorting Utility
**Decision**: Extract the sorting logic into a standalone utility function in `src/lib/compliance-utils.ts`.
**Rationale**: This promotes DRY and SOLID principles. The logic is complex enough (grouping, calculating group-level metrics for sorting, then flattening) that it should be unit-testable and reusable.

### 2. Collapsible Layout with Framer Motion
**Decision**: Use `framer-motion` for the sidebar transition.
**Rationale**: Provides a professional, polished feel for the "ISB Risk Pro" brand. It handles smooth layout shifts better than raw CSS transitions in React.

### 3. State Management for Toggle
**Decision**: Store the `isSidebarCollapsed` state in `ScopingEditor` using `useState`.
**Rationale**: KISS. The state doesn't need to persist across sessions or be shared with other pages.

### 4. Visibility of `noUrut`
**Decision**: Default `noUrut` column to visible in `GLDataGrid`.
**Rationale**: Increases transparency for the user to understand why accounts are in a specific order.

## Risks / Trade-offs

- **[Risk]** Layout shift in the table might cause column headers to misalign temporarily.
  - **Mitigation**: Use `auto` column sizing and ensure the table container re-calculates width on resize/transition completion.
- **[Risk]** Performance lag on large GL datasets when sorting in-memory.
  - **Mitigation**: Keep sorting within `useMemo` and consider pagination if data exceeds 5000+ rows (current datasets are ~200-1000).
