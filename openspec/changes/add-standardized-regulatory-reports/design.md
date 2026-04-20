## Context

The user needs to see realistic mockup reports for a coal mining company (PT BATUBARA NUSANTARA SEJAHTERA) following the exact formats of the 7 sheets in "Template Report.xlsx".

## Goals / Non-Goals

**Goals:**
- Add a "Regulatory Appendices" tab to the existing `ReportsPage`.
- Implement responsive, sortable tables for each of the 7 report types.
- Ensure styling matches the existing IndoGRC Pro design system.

**Non-Goals:**
- Real-time data integration for these mockups (static mockup data will be used initially).
- PDF export for all 7 reports (only visual mockup).

## Decisions

- **Sub-navigation**: Use a `Tabs` component with `vertical` orientation or a sidebar-style selector within the "Regulatory Appendices" main tab to navigate the 7 reports.
- **Component Modularization**: Create a `src/components/reports/RegulatoryAppendices.tsx` component to keep `ReportsPage.tsx` clean.
- **Industry Data**: Use terms specific to coal mining (e.g., "OB Removal", "Coal Getting", "Stockpile Survey") in the mockup data.

## Risks / Trade-offs

- [Tab Bloat] -> Adding 7 more reports might make the UI heavy. *Mitigation*: Use a clean sidebar list or accordion for the sub-selection.
- [Static Mockups] -> The data won't reflect actual database state. *Mitigation*: Clear "Simulation Mode" or "Mockup Data" badge.
