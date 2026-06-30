## Context

The columns "Lini 1 Owner" (`departmentOwner`) and "Owner Acceptance" (`ownerAcceptance`) are currently placed in the middle of the `GLDataGrid` columns array. We will move them to the far right, specifically immediately after the "Application Significant" (`significantApp`) column.

## Goals / Non-Goals

**Goals:**
* Move `departmentOwner` and `ownerAcceptance` columns to the far right in `GLDataGrid`.
* Maintain existing column widths, styling, and functionality (filtering, sorting, and user role-based permissions).

**Non-Goals:**
* Changes to other grid columns or pages.
* Backend changes or schema modifications.

## Decisions

### Decision: Direct array reordering in `GLDataGrid` columns
We will relocate the column definition objects for `departmentOwner` and `ownerAcceptance` to the end of the React Table `columns` array.
* *Alternative considered*: Managing column order dynamically via table state.
* *Rationale*: Static reordering in the column definition array is simpler, more maintainable, and satisfies the requirement without introducing state management overhead.

## Risks / Trade-offs

* **Risk**: Sizing mismatch if columns overflow horizontally.
* **Mitigation**: The `GLDataGrid` uses a scrollable layout (`overflow-auto`), so horizontal scrolling is already enabled for wider viewports.
