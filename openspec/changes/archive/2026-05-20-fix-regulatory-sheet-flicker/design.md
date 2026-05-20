## Context

The `RegulatoryPropertySheet` component uses an `Accordion` to display control details. Each accordion item's `value` and React `key` are bound to `controlId` or `riskId`. Currently, these IDs are generated "lazily" when the user types the first character of a description. This causes the identity of the component to change mid-typing, triggering a React re-mount which results in:
1. A visual "flicker" due to entry animations.
2. The `Accordion` collapsing because it no longer recognizes the active `value` as being the same item.

## Goals / Non-Goals

**Goals:**
- Eliminate UI flickering during risk/control description input.
- Prevent accordion collapse while typing.
- Ensure stable identity for all items in the `regulatoryPairs` array.

**Non-Goals:**
- Refactoring the entire state management of `BPMEditor`.
- Changing the visual style of the property sheet.

## Decisions

### 1. Shift ID Generation to Creation Time
Instead of waiting for `onChange` to check for empty IDs, we will generate permanent IDs immediately in the `addNewRisk` and `addControlToRisk` functions.
- **Rationale**: Ensures the `riskId` and `controlId` are stable from the moment the item appears in the UI.
- **Alternative**: Using a separate `stableKey` field. *Rejected* because it adds redundancy when the ID itself can serve as a stable key if generated early.

### 2. Remove "Smart ID Assignment" Logic
Delete the conditional blocks in `updateAllPairsForRisk` and `updateSpecificControl` that generate IDs when `value.trim().length > 0`.
- **Rationale**: This logic is the root cause of the identity swap.

### 3. Use Stable Keys in Render
Ensure that the `key` prop for risk cards and accordion items uses the permanent ID.
- **Rationale**: React uses the `key` to track component identity across renders.

## Risks / Trade-offs

- **[Risk]** → Premature ID generation might lead to "empty" records if the user adds a risk but never fills it out.
- **[Mitigation]** → The existing `onSave` logic or backend validation should handle the cleanup of empty/incomplete records during the sync process. The benefit of UI stability outweighs the cost of handling sparse data.
