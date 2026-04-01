# Design: AI Use Case Drilldown UI

This design details the interactive Grid-to-Detail interface for AI Analytics Use Cases.

## Component Hierarchy

```
AIAnalyticsMockup
└── TabsContent (ai-cases)
    └── AICasesTab (Grid View) ─ [ onClick ] ─▶ AICasesTab (Detail View)
                                               └── AIDrilldownView
                                                   ├── MetricRow
                                                   ├── DynamicChart (Recharts)
                                                   └── FindingTable
```

## UI Behavior & Continuity

- **Transition**: Use `<AnimatePresence>` and `<motion.div layoutId="..." />` for a smooth expansion effect.
- **Color Identity**: The drilldown header must inherit the `color` and `icon` of the selected use case (e.g., Red/Shield for Fraud).
- **Navigation**: A persistent "[ ← Back to AI Hub ]" button in the Detail View.

## Data Schema (shared/ai-mock-data.ts)

A flexible structure for various analytical insights:

```typescript
export interface AIUseCaseStat {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export interface AIUseCaseDrilldown {
  id: string;
  metrics: AIUseCaseStat[];
  chart: {
    type: 'bar' | 'line' | 'scatter' | 'radar';
    title: string;
    data: any[];
  };
  findings: any[]; // Table-friendly data
}
```

## Content Mapping (6 Use Cases)

1.  **Fraud Detection**: Bar chart of "Risk Score by Vendor" (Mining Contractors).
2.  **Anomaly Journal**: Scatter plot of "Journal Value vs Time of Day" (Manual Overrides).
3.  **Predictive Control**: Line chart showing "Control Failure Probability Trend".
4.  **NLP Review**: Detailed table of "High Risk Clauses" found in PKP2B contracts.
5.  **Vendor Risk**: Radar chart of "Safety vs Compliance vs Cost" for TOP 3 contractors.
6.  **Predictive Maint**: Scatter plot of "Maintenance Cost vs Operation Hours" for Heavy Equipment.
