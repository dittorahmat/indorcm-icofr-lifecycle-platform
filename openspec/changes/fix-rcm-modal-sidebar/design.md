## Context

The `RCMTLCPage` already handles the `embedded` prop correctly by returning only its content when `embedded` is true. However, `RCMELCPage` and `RCMITGCPage` always wrap their content in `AppLayout`, leading to the sidebar being rendered inside the `BPMModal`.

## Goals / Non-Goals

**Goals:**
- Fix the layout nesting issue in `RCMELCPage` and `RCMITGCPage`.
- Ensure a clean, sidebar-less view of RCM matrices when embedded in a modal.
- Maintain consistent behavior across all RCM pages.

**Non-Goals:**
- Modifying the functionality or data loading logic of RCM pages.
- Changing the styling of the RCM tables themselves.

## Decisions

### Decision: Conditional Content Rendering
We will adopt the pattern used in `RCMTLCPage`:
1. Define a `content` variable that holds the page's actual UI.
2. If `embedded` is true, return `content` directly.
3. If `embedded` is false (standalone mode), return `content` wrapped in `AppLayout`.

**Rationale:** This is the most surgical approach that respects existing component structures while solving the layout conflict. It also ensures consistency with existing patterns in the codebase.

**Alternatives:**
- Modify `AppLayout` to detect modals: Too complex and risky for global layout.
- Use a separate "EmbeddedLayout": Unnecessary overhead for a simple conditional.

## Risks / Trade-offs

- **Risk:** Potential for missing global styles provided by `AppLayout` when embedded.
- **Mitigation:** Ensure that any critical styles (e.g., background colors, overflow handling) are either included in the `content` variable or handled by the parent modal. `BPMModal` already provides a clean background and overflow container.
