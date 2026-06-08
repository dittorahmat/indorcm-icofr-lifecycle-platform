## Context

The IndoGRC Pro application is undergoing a theme transition to the Manchester City palette. While base colors were updated in `index.css`, existing components with hardcoded Tailwind background classes (`bg-slate-900`, `bg-indigo-900`) create accessibility issues because they now contrast poorly with the default Dark Navy text (`text-primary-foreground`).

## Goals / Non-Goals

**Goals:**
- Eliminate unreadable dark-on-dark text combinations.
- Standardize all primary action buttons to use the Manchester City theme.
- Modernize dialog headers and banners with the patterned sky blue aesthetic.
- Ensure consistent hover/active state behaviors for these elements.

**Non-Goals:**
- Changing the fundamental CSS variables in `index.css`.
- Modifying secondary buttons (ghost, outline, etc.) that do not suffer from contrast issues.
- Refactoring the internal logic of any affected component.

## Decisions

### Decision 1: Use `.bg-mancity-pattern` for High-Contrast Elements
Instead of just changing `bg-slate-900` to a plain blue class, we will use `.bg-mancity-pattern` (defined in `index.css`).
- **Rationale**: This provides a unique, professional look with diagonal stripes and uses the `--primary` variable, making it future-proof if the sky blue shade is adjusted.
- **Alternative**: Using `bg-primary`. Rejected because it looks too flat compared to the established header style.

### Decision 2: Enforce `text-primary-foreground` for Content
Every element getting a Manchester City background MUST explicitly use `text-primary-foreground`.
- **Rationale**: While `bg-primary` in `index.css` is associated with `text-primary-foreground` in some Shadcn components, hardcoded button classes often override this. Explicitly setting it ensures the Dark Navy color is used instead of White or Slate-400.

### Decision 3: Transition Hover States to Opacity
For Manchester City themed buttons, we will move away from `hover:bg-slate-800` to `hover:opacity-90`.
- **Rationale**: Since `bg-mancity-pattern` uses a gradient/image, changing the background color on hover is complex. Opacity changes are simple, effective, and maintain the patterned look.

## Risks / Trade-offs

- **[Risk]** Visual noise if too many elements use the pattern.
  - **Mitigation:** Only apply the pattern to "Primary" elements (main action button per form, main header per modal). Secondary buttons will remain as is.
- **[Risk]** Breaking layouts with extra classes.
  - **Mitigation:** Use surgical `replace` calls to swap classes without affecting sizing or padding.
