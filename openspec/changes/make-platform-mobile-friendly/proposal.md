## Why

IndoGRC Pro (ICOFR Lifecycle Platform) is primarily utilized by enterprise users, field auditors, Line 1 business process owners, and executive approvers (CFO, Head of Internal Audit). While desktop workstations are standard for deep audits, operational realities demand on-the-go access via mobile devices (smartphones and tablets) for:
1. Reviewing and approving agendas, materiality thresholds, and deficiency remediations.
2. Conducting walkthroughs and performing CSA (Control Self-Assessment) testing directly in field locations or production units.
3. Reviewing executive dashboards and risk metrics without encountering unreadable truncated layouts or extreme horizontal scrolling.

Currently, key operational tables (RCM TLC/ELC/ITGC, Deficiency boards, Scoping matrices) are hardcoded with wide desktop table grids (`minWidth: 2000px`), and dialog modals and floating elements (like the AI Chatbot FAB) obstruct navigation on mobile screens (< 768px). This change introduces comprehensive mobile-friendliness across the platform, dynamically transforming wide tables into structured vertical cards on mobile viewports while preserving complete SK-5 regulatory data integrity.

## What Changes

- **Adaptive Table-to-Card Engine**: Convert wide desktop data grids into vertical stacked card views on screens below 768px breakpoint (`md:hidden`), displaying core compliance attributes (Control Code, Process, Risk, Effectiveness Status, Line 2 Validation) with expandable detail sheets.
- **RCM Mobile Experience**: Implement mobile vertical card layouts for `RCMTable` (covering TLC, ELC, and ITGC views) with quick-action edit and status indicators.
- **App Shell & Floating Actions Optimization**:
  - Adjust `AIFabButton` and `AIChatDrawer` offsets on mobile viewports to prevent collision with `MobileBottomNav`.
  - Ensure touch targets adhere strictly to the minimum 44x44px accessible size.
  - Optimize `MainHeader` density for small viewports (< 380px) with responsive dropdown access for locale and fiscal year controls.
- **Deficiency & Remediation Board Mobile Stacking**: Adapt the multi-column Kanban deficiency board into mobile tabbed/segmented vertical card streams.
- **Responsive Form Dialogs / Drawers**: Wrap dense desktop dialogs with responsive drawer / bottom-sheet behaviors on mobile to prevent virtual keyboard occlusion.
- **Strict Anti-AI Slop Compliance**: Enforce minimum 12px font sizes (`text-xs` / `text-sm`), institutional rounded borders (`rounded-md` / `rounded-lg`), solid surface contrast, zero decorative italics, and full i18n localization.

## Capabilities

### New Capabilities
- `mobile-responsive-platform`: Comprehensive platform-wide mobile responsive patterns, including responsive table-to-card transformations, mobile bottom drawer adapters, and touch-optimized shell interactions across ICOFR workflows.

### Modified Capabilities
- `rcm-risk-control-accordion`: Extend RCM display requirements to support mobile vertical card rendering alongside desktop tabular view.

## Impact

- **Affected UI Components**: `RCMTable.tsx`, `AppLayout.tsx`, `RootLayout.tsx`, `MainHeader.tsx`, `MobileBottomNav.tsx`, `DeficiencyBoard.tsx`, `CSAPage.tsx`, `TodoListPage.tsx`.
- **Styling & Design System**: Tailwind responsive classes (`sm:`, `md:`, `max-md:`, `env(safe-area-inset-*)`).
- **Dependencies**: No new external dependencies required; leverages existing Tailwind CSS, Lucide Icons, Shadcn UI primitives, and React hooks.
- **APIs**: No backend schema or API breaking changes; strictly client-side presentation and viewport ergonomics.
