## Context

See proposal.md for visual findings from `C:\backup\dashboard mobile.jpeg`. The previous implementation introduced a 2x2 grid in `DashboardKPIs.tsx` and reordered the action center in `Dashboard.tsx`, but left several critical mobile regressions:
1. `LifecycleProgress.tsx` rendered 6 absolute/flex stepper points with text labels in a single 360px row, causing severe font collision ("EVALUATIONREMEDIATION").
2. Root layout scroll containers (`RootLayout.tsx` and `AppLayout.tsx`) created conflicting `h-screen overflow-hidden` contexts that swallowed the global header and pushed right-hand cards outside the viewport.
3. `DashboardKPIs.tsx` lacked `min-w-0` on its inner flex items, causing the second column (`OPEN DEFICIENCIES` card) to be pushed beyond the right screen margin.

## Goals / Non-Goals

**Goals:**
- Fix `LifecycleProgress.tsx`: Render an adaptive view where desktop shows the full 6-stage timeline and mobile (`< md`) shows an elegant compact card: current stage badge, step indicator ("Langkah 3 dari 6: Evaluasi Efektivitas"), and animated linear progress indicator.
- Fix `DashboardKPIs.tsx`: Ensure cards fit comfortably within 360px–390px screens with `min-w-0`, zero horizontal overflow, and fully visible text.
- Fix Root/App layouts: Ensure `MainHeader.tsx` is persistently visible on mobile and horizontal scroll is locked (`overflow-x-hidden`).
- Fix `PageHeader.tsx`: Make title and action buttons wrap cleanly on mobile viewports.

**Non-Goals:**
- Altering the backend API or desktop layout presentation.

## Decisions

### 1. Dual-Mode Stepper in LifecycleProgress
- **Decision**: Render a desktop stepper (`hidden md:flex`) with the full 6 nodes, and a mobile stepper (`flex md:hidden`) that displays a focused active phase card with progress percentage and next-stage guidance.
- **Rationale**: 6 text items in 360px width yields ~50px per item, which is mathematically impossible for words like "Implementation" or "Remediation" without breaking words or overlapping.

### 2. Viewport Overflow Guard & Mobile Padding
- **Decision**: In `AppLayout.tsx` and `Dashboard.tsx`, apply `w-full max-w-full overflow-x-hidden px-3 sm:px-6`. On KPI cards, apply `min-w-0` and responsive padding (`p-3`).
- **Rationale**: Flex and CSS grid items default to `min-width: auto`, which prevents children from shrinking below content size and causes right-side clipping on narrow viewports.

## Risks / Trade-offs

- **[Risk]**: Mobile users cannot see the names of past and future stages in the compact stepper.
  - **Mitigation**: Add an expandable toggle ("Lihat Semua 6 Tahapan") or sheet popover if the user wants to inspect all stages on mobile.
