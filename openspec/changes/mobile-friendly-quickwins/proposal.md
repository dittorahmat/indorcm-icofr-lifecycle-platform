## Why

IndoGRC Pro is frequently accessed by enterprise auditors, process owners (Lini 1), and executives on mobile devices or tablets to quickly review status, approve changes, and conduct on-the-go inspections. Currently, key shell elements (MainHeader, PageHeader) take up excessive vertical and horizontal space on small screens (<640px), causing cognitive overload and element clipping. In addition, dense audit data views like the CSA (Control Self-Assessment) records rely strictly on desktop-oriented multi-column tables, requiring awkward horizontal scrolling on smartphones and hurting productivity.

This change delivers a cohesive, low-effort, high-impact mobile enhancement that addresses both the global layout shell and critical data inspection workflows.

## What Changes

- **Global Shell & Top Bar Optimization**:
  - Compact `MainHeader` on mobile screens with responsive brand title clipping and touch targets >= 44x44px.
  - Streamlined `FiscalYearSelector` rendering a concise indicator (e.g. FY year pill) on viewport < 640px to prevent header overcrowding.
  - Responsive `PageHeader` typography scaling (reducing title height from `text-3xl mb-8` to `text-xl mb-4` on mobile) to save crucial screen real estate.
- **Responsive Mobile Data Transformation**:
  - Implement mobile card view pattern in `CSAPage` (`src/pages/csa/CSAPage.tsx`): On small screens (< 768px), display process assessments as structured touch-friendly cards showing Process Name, Unit, Lini 2 Status, and verification actions, while retaining the full table on desktop.
  - Mobile dialog viewport containment: Ensure modal verification and review dialogs are scrollable, within `max-h-[90vh]`, and have sticky bottom actions accessible within the thumb zone.

## Capabilities

### New Capabilities
- `mobile-responsive-experience`: Mobile view transformations, layout shell compactness, and card-based responsive views for dense audit assessment tables.

### Modified Capabilities
- `csa-management`: Update CSA record display to support responsive dual presentation (data table on desktop, interactive summary cards on mobile).

## Impact

- `src/components/layout/MainHeader.tsx`: Layout and item spacing adjustments on `< sm` breakpoints.
- `src/components/layout/FiscalYearSelector.tsx`: Compact trigger mode on mobile screens.
- `src/components/layout/PageHeader.tsx`: Responsive typography and spacing classes.
- `src/pages/csa/CSAPage.tsx`: Add responsive card-view rendering alongside desktop table.
- `src/i18n/locales/*`: Translation keys for mobile action labels if needed.
