## Context

The system needs a regulatory-compliant Heatmap visualization as per SK-5/2024 for PT BATUBARA NUSANTARA SEJAHTERA.

## Goals / Non-Goals

**Goals:**
- Implement a clean, responsive 3x3 CSS grid matrix.
- Ensure colors match Table 12 outcomes (Red, Yellow, Green).
- Integrate into the Reports -> Overview dashboard.

**Non-Goals:**
- Dynamic risk calculation (initial version uses mock data distribution).

## Decisions

- **UI Framework**: Use Tailwind Grid for the 3x3 layout.
- **Component**: Create `src/components/reports/RiskHeatmap.tsx`.
- **Interaction**: Use a `Popover` or `Dialog` to show the list of risks when a cell is clicked.
- **Data Source**: Extend `mock-regulatory-data.ts` to include risk-to-heatmap mapping.

## Risks / Trade-offs

- [Space Constraints] -> 3x3 matrix might be tight on mobile. *Mitigation*: Scrollable container or responsive font sizes for labels.
