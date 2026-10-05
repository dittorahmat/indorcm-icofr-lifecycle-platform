## 1. Shared primitives (root cause)

- [ ] 1.1 Compact `PageHeader` mobile mode (CTA scroll-row + clamped description) and verify header unit renders without page-level overflow at 360px
- [ ] 1.2 Create `CollapsibleFilterCard` primitive (Scoping pattern: `useIsMobile`, `hasUserToggledRef`, 44px trigger, i18n labels) and verify unit tests for mobile-collapsed / desktop-open / user-toggle persistence
- [ ] 1.3 Establish table scroll-wrapper convention on shared table containers and verify no page-level horizontal scroll at 320px/360px

## 2. BPM batch (highest severity)

- [ ] 2.1 Wrap `BPMScopingFilters` + `BPMStatusBanner` in collapsible and verify diagram list visible on mobile load
- [ ] 2.2 Wrap `BPMAccountAssertion` table in `overflow-x-auto` scroll container and verify 7-column table scrolls inside card only
- [ ] 2.3 Tidy BPM search toolbar stacking and verify no CTA pushes grid below fold

## 3. CSA + Testing batch

- [ ] 3.1 Make `CSAPage` filter + Executive Summary collapsible and verify record list visible on mobile load
- [ ] 3.2 Add collapse toggle to sticky `TodoListFilters` and verify agenda keeps independent scroll
- [ ] 3.3 Compact `TestWorkbench` header rows and verify first control card within ~1 viewport

## 4. Dashboard + Reports batch

- [ ] 4.1 Densify `DashboardKPIs` / WBS / Audit KPI grids (`grid-cols-2` base, snap row for 5-item counters) and verify values glanceable without interaction
- [ ] 4.2 Collapse `ReportsPage` audit-tab filters + Appendix10 filter bar + remove duplicated inner header and verify primary tables surface on mobile
- [ ] 4.3 Standardize `LifecycleProgress`-style pills where applicable and verify no KPI exceeds compact block height

## 5. RCM + Audit batch

- [ ] 5.1 Collapse `RCMPageHeader` metadata/search + Rollover cards on empty states and verify matrix visible on mobile
- [ ] 5.2 Unify header breakpoints to `sm:` and dedupe `VerificationDesignPage` embedded toolbar, verify 640-768px no prolonged stacking
- [ ] 5.3 Compact `ExternalAuditPortal` KPI block and verify opinion workflow within 1-2 scrolls

## 6. Verification

- [ ] 6.1 Run `npm run type-check`, `npm run lint`, `npm run build` sequentially (redirect output to files) and verify zero errors
- [ ] 6.2 Run `npm test` with new/updated dual-render tests (`getAllByText`, `closest()` scroll asserts) and verify green
- [ ] 6.3 Verify full i18n (no hardcoded strings) and analytical 320px/360px layout pass (no page h-scroll, touch targets >= 44px)
