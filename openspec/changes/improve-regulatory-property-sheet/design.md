## Context

The current `RegulatoryPropertySheet` utilizes a slider (`Sheet`) component which limits the width for property editing, leading to low font sizes and poor information density. This impacts the audit experience.

## Goals / Non-Goals

**Goals:**
- Improve clarity and readability of audit properties.
- Enhance accessibility and UX for corporate/BUMN staff.
- Adopt a full-screen `Dialog` layout.

**Non-Goals:**
- Overhauling the entire diagramming system (only modifying the property sheet).
- Changing the underlying data storage logic, unless necessary for UI state.

## Decisions

- **Full-screen Modal**: Replacing `Sheet` with `Dialog` (from `radix-ui`) to provide a more focused editing environment.
- **Accordion Layout**: Using `Accordion` for Control items within the Risk groups to manage vertical space efficiently.
- **Typography Refresh**: Increasing base font size from `text-xs/10px` to `text-sm/12px` and updating color to `text-slate-700`.
- **Action Buttons Layout**:
  - **Add Control**: Placed inside the `Risk Card` at the bottom, using a full-width, indigo-bordered dashed button for high visibility and clear visual affordance.
  - **Delete Control**: Moved into the `AccordionTrigger` area or right-aligned within the accordion header for immediate access when expanded.
  - **Delete Risk**: Positioned at the bottom of the `Risk Card` with clear visual separation from the main content.

## Risks / Trade-offs

- **[Transition Complexity]** → Moving to a full-screen dialog may require updates to state management if there are existing dependencies on the slider's lifecycle events. Mitigated by testing dialog lifecycle hooks.
- **[Content Overlap]** → If the modal is too large on some screens, ensure standard `ScrollArea` behavior is maintained.
