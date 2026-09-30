## Why

State-Owned Enterprises (BUMN) compliance stakeholders, control owners (Line 1), and supervisory reviewers (Line 2 / Internal Audit) frequently require immediate access to pending approval items, CSA testing status, and overdue remediation tasks outside desktop environments. Currently, key governance interfaces—notably the 7-column CSA Todo Calendar and desktop-sized modal dialogs in the Workflow Panel—degrade on mobile viewports (< 768px), causing content overflow, clipped status badges, and cumbersome approval operations on touchscreens.

Optimizing mobile review and approval flows directly accelerates the mandatory ICOFR 5-step lifecycle compliance by eliminating sign-off bottlenecks on mobile devices without violating BUMN institutional design standards.

## What Changes

- **Mobile Agenda View for Todo Calendar**: Transform the rigid 7-column monthly grid on mobile viewports into a thumb-friendly vertical Agenda / Task Feed grouped by date/urgency (Today, Overdue, Upcoming) with one-tap status badges and review triggers.
- **Workflow Panel Thumb-Friendly Drawers & Quick Actions**: Adapt desktop approval modals to responsive bottom sheets (Drawers) on mobile viewports (< 768px), equipped with sticky bottom action bars (Approve / Reject / Submit) and quick note presets to avoid extensive keyboard typing.
- **Mobile Bottom Navigation Pending Approval Integration**: Equip the mobile bottom bar with a dedicated or contextual "Approvals / Tasks" destination featuring an unread/pending badge counter.
- **Executive Summary Card for CSA on Mobile**: Provide a high-density, card-based executive summary on mobile for CSA review records (effectiveness rate, Line 2 status, and immediate sign-off entry point) to eliminate horizontal table panning.

## Capabilities

### New Capabilities
- `mobile-approval-experience`: Introduces thumb-friendly mobile bottom sheet workflows, sticky mobile action bars, quick notes, and executive summary cards for ICOFR review and sign-off.

### Modified Capabilities
- `csa-todo-calendar-sync`: Modifies calendar presentation behavior to support an adaptive mobile Agenda/Feed mode alongside desktop monthly grid representation.

## Impact

- **Affected Code**:
  - `src/pages/csa/TodoListPage.tsx`
  - `src/components/csa/TodoListGrid.tsx`
  - `src/components/workflow/WorkflowPanel.tsx`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/pages/csa/CSAPage.tsx`
- **APIs & Dependencies**: Utilizes existing TanStack Query endpoints (`/api/csa/schedules`, `/api/action-plans`, `/api/csa`); uses existing UI components (`Drawer` / `Sheet`, `Badge`, `Button`).
- **Breaking Changes**: None. Desktop views remain preserved.
