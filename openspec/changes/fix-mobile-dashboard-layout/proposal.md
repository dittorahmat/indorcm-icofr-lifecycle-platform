## Why

Visual inspection of the live mobile dashboard (`C:\backup\dashboard mobile.jpeg`) revealed severe layout regressions on mobile viewports (<768px):
1. The global header (`MainHeader`) is clipped or hidden under browser chrome due to `h-screen overflow-hidden` scroll boundaries in layout containers.
2. The `LifecycleProgress` component attempts to render all 6 ICOFR stages in a single horizontal row on small screens, causing severe text overlap (e.g. `EVALUATIONREMEDIATION`) and pushing stages off-screen.
3. The 2x2 KPI grid (`DashboardKPIs`) overflows horizontally to the right, truncating the second column (`OPEN DEFICIENCIES` card is clipped at the right margin).
4. Page action buttons in `PageHeader` (`Manage RCM` and `Start Assessment`) and unconstrained Recharts containers trigger horizontal page overflow.

Addressing these issues produces a clean, readable, professional mobile experience compliant with BUMN standards and the strict anti-AI slop requirements.

## What Changes

- **Layout & Viewport Scroll Fixes**:
  - Fix root scroll hierarchy in `RootLayout.tsx` and `AppLayout.tsx` by eliminating rigid `h-screen overflow-hidden` constraints that suppress `MainHeader` on mobile browsers.
  - Enforce `w-full max-w-full overflow-x-hidden` across the main layout shell to prevent horizontal viewport leakage.
- **Adaptive Lifecycle Stepper**:
  - Redesign `LifecycleProgress.tsx` to provide an adaptive mobile stepper: on `< md` viewports, render a compact active stage card with a linear progress bar and stage badge (e.g., "Langkah 3 dari 6: Evaluasi Efektivitas (50%)") instead of forcing 6 text labels into 360px width.
- **Responsive KPI Grid & Card Constraints**:
  - Adjust `DashboardKPIs.tsx` so cards utilize `min-w-0 w-full` with flexible padding, preventing right-side truncation.
- **PageHeader & Floating Elements Ergonomics**:
  - Make `PageHeader` action buttons stack or wrap into a compact 2-button row on mobile.
  - Ensure `AIFabButton` sits in a safe thumb zone without obscuring dashboard metrics.

## Capabilities

### Modified Capabilities
- `mobile-glanceable-dashboard`: Update requirements to enforce non-overlapping stage indicators, strict horizontal overflow bounds, and unclipped multi-column scorecards on screens as narrow as 360px.

## Impact

- **Affected UI Components**:
  - `src/components/layout/RootLayout.tsx`
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/PageHeader.tsx`
  - `src/components/dashboard/LifecycleProgress.tsx`
  - `src/components/dashboard/DashboardKPIs.tsx`
  - `src/pages/Dashboard.tsx`
- **Dependencies & APIs**: No external dependencies or backend schema changes. Pure frontend CSS/Tailwind responsiveness and layout refactoring.
