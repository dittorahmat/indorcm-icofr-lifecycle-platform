## Context

See proposal.md for motivation and problem statement. IndoGRC Pro currently uses Tailwind CSS and Shadcn UI components wrapped in a custom `AppLayout` and `RootLayout` structure. Viewport responsiveness exists partially in the layout, but individual business screens—most notably `Dashboard.tsx`, `CSAPage.tsx`, and `TODVerificationDialog.tsx`—were originally composed for full-width desktop monitoring (1280px+). 

Key constraints:
1. Strict compliance with `AGENTS.md` and `GEMINI.md`: Anti-AI slop checklist enforces minimum 12px font (`text-xs font-semibold`), solid background contrast (`bg-card`, `bg-background`), institutional border radius (`rounded-md` or `rounded-lg`), and zero decorative italics.
2. Form state preservation: Form modifications must hook into `useUnsavedChanges` to prevent inadvertent data loss when switching responsive modes or toggling drawers.
3. Multi-language support: Every new label, tooltip, and button text must map to `src/i18n/locales/{en,id}/`.

## Goals / Non-Goals

**Goals:**
- Provide effortless one-thumb mobile navigation via a persistent `MobileBottomNav` and global `SidebarTrigger` in `MainHeader`.
- Reorganize `Dashboard.tsx` layout on `< md` viewports so executives and managers see the cycle health pulse and pending action tasks immediately without scrolling past tall charts.
- Introduce adaptive card-stack rendering in `CSAPage.tsx` for field walkthroughs and audits.
- Convert `TODVerificationDialog` into a responsive drawer with sticky submit controls on mobile screens.

**Non-Goals:**
- Rebuilding the React Flow BPM editor into an entire standalone mobile app (BPM canvas will receive viewport fit improvements, but complex canvas edge dragging remains a desktop-oriented modeling activity).
- Modifying backend database schemas or Cloudflare Workers APIs (all updates are strictly frontend responsive adaptation).

## Decisions

### 1. Global Shell: Mobile Bottom Navigation Bar & Fixed Safe Area Clearance
- **Decision**: Introduce `src/components/layout/MobileBottomNav.tsx` rendered conditionally on viewports `< md` within `RootLayout.tsx`. Add bottom padding (`pb-16` / `pb-20`) to the main content container when bottom navigation is active. Offset `AIFabButton` by adding `bottom-20` on mobile viewports.
- **Rationale**: Reaching the top-left hamburger button on tall modern phones (e.g. 6.7" screens) creates ergonomic strain. A bottom navigation bar covers the "thumb zone" for 80% of daily lookups.
- **Alternatives Considered**: 
  - *Floating speed-dial button*: Dismissed because it covers content and adds unnecessary cognitive load.
  - *Sidebar drawer only*: Requires two hands to open on large smartphones.

### 2. Dashboard Layout: Prioritized Stack & 2x2 Metric Grid
- **Decision**: In `DashboardKPIs.tsx`, change `grid md:grid-cols-4` to `grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6`. In `Dashboard.tsx`, reorder components on mobile using CSS grid / flex ordering: render `ActionCenter` (pending items) right after KPIs, while analytical charts (`ComplianceCharts`, `COSOCoverageGrid`) are placed in a tabbed or accordion container on `< md`.
- **Rationale**: Mobile users open the dashboard to see immediate action items ("What do I need to approve or execute right now?"), not to read detailed 17-principle radar bars.
- **Alternatives Considered**: 
  - *Hiding all charts on mobile*: Rejected because users occasionally want to check high-level distribution during meetings.

### 3. CSA Field Experience: Dual-View Table & Drawer Dialog
- **Decision**: In `CSAPage.tsx`, wrap the existing `<Table>` in a `hidden md:block` block, and introduce a `block md:hidden` card-stack list (`CSAMobileCard`). For `TODVerificationDialog.tsx`, conditionally render a bottom sliding `<Sheet side="bottom">` on mobile viewports with sticky action buttons (`Batal` / `Simpan Penilaian`), while retaining `<Dialog>` on desktop.
- **Rationale**: Standard HTML data tables with 8+ columns force horizontal scrolling that breaks visual context on mobile. Cards provide clear card boundaries, distinct status badges, and full-width touch targets.
- **Alternatives Considered**: 
  - *Pure CSS horizontal scroll table*: Already exists and causes extreme user friction in field trials.

## Risks / Trade-offs

- **[Risk]**: Virtual keyboard opening on mobile pushes form fields off-screen in `TODVerificationDialog`.
  - **Mitigation**: Use a scrollable content container (`overflow-y-auto max-h-[75vh]`) with a sticky footer so submit buttons remain accessible regardless of keyboard state.
- **[Risk]**: Bottom navigation bar conflicts with mobile browser home indicator bar (iOS safe-area-inset).
  - **Mitigation**: Add `pb-[env(safe-area-inset-bottom)]` and Tailwind `pb-safe` classes to ensure adequate clearance.
- **[Risk]**: Dual-view in `CSAPage.tsx` causes code duplication.
  - **Mitigation**: Share identical action handlers (`handleExportPDF`, `setSelectedControl`, `saveMutation`) between table rows and mobile card components.
