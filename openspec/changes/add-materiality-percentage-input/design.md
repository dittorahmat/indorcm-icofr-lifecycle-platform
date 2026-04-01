## Context

The current `ScopingPage.tsx` uses a hidden `percentage` field in the form logic but does not expose it to the user.

## Goals / Non-Goals

**Goals:**
- Expose the `% OM` field in the UI.
- Ensure it updates the `baseOM` calculation.
- Maintain existing `multiplier` and `haircut` logic.

## Decisions

- **UI Placement**: Insert the field in the `grid-cols-2` layout of the "Materiality Calculation" card, likely next to the "Benchmark Basis" or "Benchmark Value".
- **Form Integration**: Use `react-hook-form`'s `register` to bind the input to the `percentage` field in the `MaterialityForm` schema.
- **Iconography**: Use an `Info` icon with a tooltip explaining that 5% is standard for profit and 1% for assets/revenue as per Table 3.

## Risks / Trade-offs

- [Layout Shift] -> Adding a new field might push the OM/PM result boxes further down. *Mitigation*: Adjust the grid layout to accommodate the extra field without excessive scrolling.
