## Context

The current UI uses Shadcn UI components based on Radix UI primitives. These primitives often use Portals to render overlay elements at the root of the document body. While this prevents overflow issues, it creates z-index competition between Portals. The `Dialog` (Modal) component is currently set to `z-[1000]`, while `SelectContent`, `PopoverContent`, and `Command` are defaulting to `z-50`.

## Goals / Non-Goals

**Goals:**
- Fix z-index layering globally for all overlay components.
- Standardize on a z-index scale that accommodates Modals, Sheets, Dropdowns, and Tooltips.
- Refactor existing code to remove brittle workarounds.

**Non-Goals:**
- Redesigning the component library or switching away from Radix UI.
- Modifying the styling of components beyond z-index and related positioning properties.

## Decisions

### Decision: Elevated Global Z-Index Scale for Select/Popover
- **Rationale**: Interactive dropdowns and popovers that originate from within a modal must always be layered above that modal. Elevating them to `z-[1100]` ensures they clear the `Dialog` (z-1000).
- **Alternatives Considered**: 
  - *Lowering Dialog z-index*: Risk of breaking visibility relative to other fixed elements (headers, sidebars).
  - *Context-aware z-index*: Too complex to implement with Portals; global constants are more reliable for this architecture.

### Decision: Centralized Refactor for Code Hygiene
- **Rationale**: Several components (e.g., `ScopingPage.tsx`) might have attempted local fixes. Removing these ensures the system remains predictable and follows DRY principles.

## Risks / Trade-offs

- **Risk**: Tooltips or other low-level overlays might still be hidden.
- **Mitigation**: Standardize tooltips to `z-[1200]` if conflicts are found during audit.
- **Risk**: Third-party libraries (if any) using higher z-indices.
- **Mitigation**: Monitor UI during build verification.
