## Context

See `proposal.md` for background and motivation. Currently, `ReportsPage` hosts several tabs:
1. `dashboard` (Executive Summary)
2. `management` (Asesmen Manajemen Lampiran 11)
3. `audit` (Hasil Pengujian TOD/TOE)
4. `appendices` (Regulatory Appendices hosting Lampiran 5, 6, 7, 8, 9, 10, 11)

In `RegulatoryAppendices.tsx`, the DoD worksheet report is rendered inside `<TabsContent value="dod">` using the `<DoDReport>` component (`DoDLampiran10Report.tsx`).
To give direct, 1-click access from the sidebar without duplicating heavy data fetching or breaking existing views, we need a dedicated route or query param sync in `ReportsPage`, coupled with a dedicated link in `app-sidebar.tsx`.

## Goals / Non-Goals

**Goals:**
- Add a sidebar menu item `items.app10` in `app-sidebar.tsx` situated between `items.wbs` and `items.app11`.
- Provide localized text in `id/sidebar.json` ("Lampiran 10 (Kertas Kerja DoD)") and `en/sidebar.json` ("Appendix 10 (DoD Worksheet)").
- Route `/reports/appendix-10` or `/reports?tab=appendices&appendix=dod` directly mounts the Lampiran 10 worksheet view.
- Maintain full compatibility with `workingYear` query parameter (`withYear(...)`).
- Strictly adhere to `design-taste-frontend` rules (minimum 12px font, enterprise border-radius, high contrast contrast tokens, no distracting animations).

**Non-Goals:**
- Modifying the underlying 24-column logic or decision tree of `DoDLampiran10Report.tsx`, as it is already verified 100% compliant with SK-5/2024.
- Removing the DoD tab from `RegulatoryAppendices.tsx` (it remains accessible both from `/reports` tabs and the direct sidebar link).

## Decisions

### Decision 1: Dedicated Route `/reports/appendix-10` vs Query Param Only
- **Choice**: Provide route `/reports/appendix-10` in `main.tsx` mapped to `Appendix10Page` (or `ReportsPage` pre-configured to default to the DoD appendix), while also supporting URL sync.
- **Rationale**: An explicit clean route like `/reports/appendix-10` matches the sidebar menu convention (e.g. `/wbs-recap`, `/reports`, `/rcm/elc`), makes deep-linking intuitive, and preserves browser history correctly.

### Decision 2: Sidebar Menu Icon
- **Choice**: Use `FileSpreadsheet` or `TableProperties` / `LayoutGrid` from `lucide-react`.
- **Rationale**: Represents an audit worksheet (kertas kerja matriks) distinctly from `FileBarChart` (Lampiran 11) and `AlertTriangle` (WBS).

## Risks / Trade-offs

- **[Risk]** Heavy data load if many deficiencies exist.
  - *Mitigation*: `DoDLampiran10Report` already implements client-side pagination / memoized filters and lightweight tabular rendering.
- **[Risk]** Active sidebar highlight mismatch if user navigates via tabs inside `/reports`.
  - *Mitigation*: `isActive` logic in `app-sidebar.tsx` checks exact match or path prefix, ensuring `/reports/appendix-10` and `/reports` don't collide.
