# Proposal: AI Use Case Drilldown Mockups

Implement an interactive drilldown experience for the "AI Use Cases" (Slide 9) in the Digital Analytics Hub.

## Problem
The current AI Use Case grid in `src/components/reports/AIAnalyticsMockup.tsx` is static. Users see summary cards but cannot explore the underlying analytical insights or mockup data mentioned in the "Details →" links.

## Solution
Transform the static grid into a state-driven "Grid-to-Detail" interface.

1.  **Grid-to-Detail Transition**: Use React state to toggle between a list of use cases and a detailed "Analytical Deep Dive" for the selected case.
2.  **Rich Visualizations**: Each drilldown will feature unique `recharts` (Bar, Line, Scatter, or Radar) tailored to the specific AI model (e.g., Vendor Risk Radar, Maintenance Cost Scatter).
3.  **Mock Data Expansion**: Create `shared/ai-mock-data.ts` to house realistic, mining-specific analytical findings for all 6 use cases.
4.  **Premium UX**: Use `framer-motion` for layout transitions to maintain visual continuity and an "Enterprise AI" aesthetic.

## Scope
- Modify `AICasesTab` in `AIAnalyticsMockup.tsx` to handle drilldown state.
- Implement a new `AIDrilldownView` component for detailed insights.
- Populate 6 unique drilldown datasets (Fraud, Anomaly, Predictive, NLP, Vendor Risk, Maintenance).
- Ensure consistency with "PT BATUBARA NUSANTARA SEJAHTERA" branding.

## Non-Goals
- Real API integration (strictly mockup/local state).
- Drilldowns for Slide 8 or Slide 10 (out of scope for this change).
