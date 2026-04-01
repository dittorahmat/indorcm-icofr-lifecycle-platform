## Context

Currently, the `MainHeader.tsx` uses standard Shadcn/Tailwind background classes (`bg-background/95`). This proposal changes the header to a prominent green theme (Emerald) to meet user branding requirements.

## Goals / Non-Goals

**Goals:**
- Implement a vibrant green header for Light Mode.
- Implement a deep, professional forest green header for Dark Mode.
- Ensure all text and icons are accessible and have high contrast.

**Non-Goals:**
- Changing the overall application theme (sidebar, cards, etc.).
- Modifying the global CSS theme variables (changes are scoped to the header component).

## Decisions

- **Color Palette**: Use `emerald-600` for Light Mode and `emerald-950` (`#022c22`) for Dark Mode.
  - *Rationale*: Emerald is more professional than standard Green and fits the enterprise/BUMN context. Emerald 950 provides better depth in dark mode than pure black or standard gray.
- **Component Level Styling**: Apply Tailwind classes directly to `MainHeader.tsx` using conditional classes or theme-aware colors.
  - *Alternative*: Changing global CSS variables. *Rejected* because it might break contrast in other parts of the UI that expect a light background.
- **Text Color**: Force `text-white` or `text-emerald-50` in the header regardless of the rest of the app's theme state when the header is in Light Mode.

## Risks / Trade-offs

- [Contrast] → Mitigation: Manually verify all icon and text colors using WCAG guidelines.
- [Visual Consistency] → Mitigation: Use standard Tailwind colors (`emerald-x`) to ensure they play well with the existing UI elements.
