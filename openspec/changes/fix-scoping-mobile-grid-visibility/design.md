## Context

In `ScopingEditor` (`src/pages/scoping/ScopingPage.tsx`), `isParamsOpen` is initialized with `React.useState(true)`. On mobile screens (< 768px), `ScopingEditorHeader` plus `MaterialityParamsCard` fill the entire screen height, pushing `ScopingEditorContent` (containing the GL grid) below the fold.

## Goals / Non-Goals

**Goals:**
- Automatically collapse the materiality parameters card on mobile devices (`isMobile`) on initial mount, while keeping it open on desktop.
- Retain manual expand/collapse capability via the header button and collapsed strip.
- Ensure the mobile collapsed state has a clear, accessible banner or button (`min-h-[44px]`) to toggle parameters.
- Ensure no layout shift or hydration mismatch issues.

**Non-Goals:**
- Modifying the calculation logic of OM/PM or significant locations.
- Changing the schema or backend APIs for scoping simulations.

## Decisions

### Decision 1: Use `useIsMobile()` for initial state and responsive handling
- *Rationale*: `@/hooks/use-mobile` is already the established pattern in the project (`SidebarProvider`, layout components). Initializing `isParamsOpen` based on `!isMobile` ensures desktop users retain their 2-column sidebar experience while mobile users get a 100% focused data view immediately.
- *Alternatives considered*: CSS media queries hiding the container without state - rejected because the header toggle button state needs to stay synchronized with the DOM visibility.

### Decision 2: Mobile collapsed parameter bar styling
- *Rationale*: When collapsed, show an accessible horizontal bar with an icon and label on mobile (`w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50`), while keeping the vertical ribbon on desktop (`md:w-8 md:[writing-mode:vertical-rl]`).
- *Alternatives considered*: Only showing the toggle in the header - rejected because having an inline accordion button where the card was gives direct visual continuity.

## Risks / Trade-offs

- [User resizing window across breakpoint] → The toggle state remains under user control once interacted with.
