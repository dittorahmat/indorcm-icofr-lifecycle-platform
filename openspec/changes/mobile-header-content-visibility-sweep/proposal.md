## Why

On mobile viewports (< 768px), page headers plus always-open filter/KPI cards stack vertically and push primary content (GL grids, RCM matrices, CSA lists, BPM diagrams) 2-3 viewports below the fold. The Scoping fix proved the pattern; the same anti-pattern exists across BPM, CSA, Dashboard, Reports, WBS, Appendix10, RCM, and Audit pages.

## What Changes

- Add a compact mobile mode to the shared `PageHeader` (clamped description, horizontally scrolling CTA row instead of full-width stacked buttons).
- Introduce a shared `CollapsibleFilterCard` primitive extracted from the Scoping `useIsMobile() + useState(!isMobile) + hasUserToggledRef` pattern; all filter walls adopt it (collapsed by default on mobile, open on desktop).
- Densify numeric KPI blocks on mobile (`grid-cols-2` / horizontal snap) so values stay glanceable instead of 4-5 stacked rows; filters (not KPIs) are the ones that collapse.
- Wrap every wide table (`BPMAccountAssertion` 840px, RCM matrices up to 4800px, import previews) in a dedicated `overflow-x-auto` scroll wrapper so pages never scroll horizontally.
- Standardize header breakpoints to `sm:` and remove duplicated inner headers (Appendix10, VerificationDesignPage).

## Capabilities

### New Capabilities
- `mobile-content-visibility`: responsive presentation contract — headers stay compact, filters collapse on mobile, KPIs stay glanceable, primary content visible within ~1 viewport of scroll on 320px/360px.

### Modified Capabilities
<!-- None -->

## Impact

- `src/components/layout/PageHeader.tsx`: compact mobile CTA row + clamped description.
- New `src/components/layout/CollapsibleFilterCard.tsx` (+ tests): shared collapse primitive with i18n toggle labels.
- Adopters: `BPMPage`, `BPMScopingFilters`, `BPMStatusBanner`, `BPMAccountAssertion`, `CSAPage`, `TodoListFilters`, `TestWorkbench`, `Dashboard`, `DashboardKPIs`, `ReportsPage`, `DoDLampiran10Report`, `WBSPage`, `RCMPageHeader`, `RCMTLCPage`, `RCMELCPage`, `VerificationDesignPage`, `ExternalAuditPortal`.
- Tests: unit tests for the new primitive + dual-render regression tests per touched page; full `type-check`, `lint`, `build`, `npm test` run sequentially.
