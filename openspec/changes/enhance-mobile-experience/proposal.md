## Why

IndoGRC Pro operates as an enterprise-grade ICOFR compliance platform for State-Owned Enterprises (BUMN) under Regulation SK-5/DKU.MBU/11/2024. While the desktop interface handles complex matrix configurations, operational stakeholders (Lini 1 performers, Lini 2 reviewers, and executive leadership) frequently access the platform on mobile devices and during on-site inspections. Currently, key user interactions—such as opening global navigation, monitoring cycle progress on the dashboard, and performing Control Self-Assessments (CSA) in the field—suffer from desktop-centric layouts, horizontal table overflow, and inaccessible dialogs on smaller screens. 

Optimizing the mobile experience now provides operational agility: Lini 1 can capture evidence and complete assessments on-the-go, Lini 2 can quickly triage verification queues, and executives can view high-level cycle pulses and approve workflows in seconds.

## What Changes

- **Global Mobile Navigation Shell**:
  - Global `SidebarTrigger` (hamburger button) integrated directly into `MainHeader` on mobile viewports (`md:hidden`).
  - Mobile-compact header bar with condensed fiscal year selector and nested profile/language menus.
  - Dedicated `MobileBottomNav` component fixed to the bottom of the viewport with 4 key thumb-zone actions: Dashboard, My Tasks / CSA, RCM, and Menu Drawer.
  - Adjusted safe-area offsets so floating widgets (e.g. `AIFabButton`) do not obscure primary bottom controls.
- **Glanceable & Action-Oriented Mobile Dashboard**:
  - Refactored `DashboardKPIs` into an adaptive 2x2 responsive grid for mobile viewports without sacrificing typography hierarchy (no sub-12px text).
  - Elevated `ActionCenter` (urgent pending tasks) to the top position on mobile screens directly beneath KPIs, prior to visual analytic charts.
  - Collapsible/tabbed representation for dense analytics (COSO 17 principles and compliance charts) on mobile screens.
- **On-The-Go Field CSA Experience (Lini 1 / Auditor)**:
  - Dual-view presentation for CSA records: desktop data table transforms into touch-friendly audit cards (`CSAMobileCard`) on viewports under `md`.
  - Responsive Bottom-Sheet drawer pattern for `TODVerificationDialog` with sticky validation actions (`Batal` / `Simpan Penilaian`), replacing rigid desktop dialog modals on mobile.
  - Mobile-friendly file and photo upload triggers for capturing field evidence during physical walkthroughs.

## Capabilities

### New Capabilities
- `mobile-navigation-shell`: Persistent bottom navigation bar and mobile header ergonomics providing thumb-zone access to primary modules.
- `mobile-glanceable-dashboard`: Mobile-first dashboard layout prioritizing high-level cycle status KPIs and pending action items over dense multi-column desktop charts.
- `mobile-csa-field-workbench`: Responsive touch-first card view and bottom-sheet drawer for on-the-go Control Self-Assessment and evidence logging.

### Modified Capabilities
- `csa-management`: Extended to support adaptive card-stack rendering and mobile-optimized modal/drawer workflows for control testing without data loss.

## Impact

- **Affected UI Components**:
  - `src/components/layout/MainHeader.tsx`
  - `src/components/layout/RootLayout.tsx`
  - `src/components/layout/AppLayout.tsx`
  - `src/components/layout/MobileBottomNav.tsx` (new component)
  - `src/components/dashboard/DashboardKPIs.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/csa/CSAPage.tsx`
  - `src/components/csa/TODVerificationDialog.tsx`
- **Dependencies & Libraries**: Leverages existing Radix UI Sheet/Dialog, Tailwind CSS responsive variants, Lucide icons, and TanStack Query. No new external dependencies required.
- **Compliance & Design Rules**: Full adherence to `AGENTS.md` and `GEMINI.md` anti-AI slop requirements (minimum 12px font, solid surface contrast, enterprise border radius `rounded-lg`, no decorative italics or glassmorphism).
