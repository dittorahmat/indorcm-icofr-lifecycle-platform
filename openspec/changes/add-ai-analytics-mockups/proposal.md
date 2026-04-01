## Why

To demonstrate the future capabilities of AI and Advanced Data Analytics in the ICoFR lifecycle for BUMN entities, we need to implement mockup dashboards based on standard industry use cases (Coal Mining). This helps stakeholders visualize how automation can enhance control monitoring and fraud detection.

## What Changes

- **New AI & Analytics Dashboard**: Add a new tab in the Reports page or a standalone page for AI/Analytics mockups.
- **Three Core Modules**:
    1. **Data Analytics (Slide 8)**: Use cases like stockpile vs sales analysis, weighbridge detection, and abnormal journal entries.
    2. **AI Use Cases (Slide 9)**: Visualization of fraud detection, predictive maintenance, and NLP contract review.
    3. **Continuous Control Monitoring (Slide 10)**: Real-time dashboard for "Red Flags" like PO split, backdated journals, and negative stock.
- **Fictional Data**: Data tailored for **PT BATUBARA NUSANTARA SEJAHTERA**.

## Capabilities

### New Capabilities
- `ai-analytics-dashboards`: High-fidelity mockups for AI and Analytics use cases in Mining.

### Modified Capabilities
- None

## Impact

- `src/pages/reports/ReportsPage.tsx`: Addition of new tab navigation.
- `src/components/reports/AIAnalyticsMockup.tsx`: New component for these visualizations.
