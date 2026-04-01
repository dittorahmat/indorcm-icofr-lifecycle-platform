## Why

As per **Regulation SK-5/2024 Tabel 12 (page 37)**, the ICoFR lifecycle requires a formal combination of Qualitative and Quantitative factors to determine the overall Risk Rating. Implementing a high-fidelity Heatmap visualization allows auditors and management to quickly identify High-Risk areas in mining operations (e.g., Coal Getting, OB Removal) that require immediate testing or remediation.

## What Changes

- **New Heatmap Component**: Implement a 3x3 Risk Heatmap matrix.
- **Regulatory Logic**: Align matrix cells with the outcomes specified in Table 12:
    - High Qn + High Ql = High (Red)
    - Low Qn + Low Ql = Low (Green)
    - etc.
- **Interactive Drill-down**: Clicking a cell shows the list of risks/controls from **PT BATUBARA NUSANTARA SEJAHTERA** that fall into that category.
- **Dashboard Integration**: Add the heatmap to the "Overview" tab of the Reports page.

## Capabilities

### New Capabilities
- `risk-heatmap-visualization`: Regulatory-compliant risk matrix with interactive mining data.

### Modified Capabilities
- None

## Impact

- `src/pages/reports/ReportsPage.tsx`: Integration of the heatmap component.
- `src/components/reports/RiskHeatmap.tsx`: New visualization component.
