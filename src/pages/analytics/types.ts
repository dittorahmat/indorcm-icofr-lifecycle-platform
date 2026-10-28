export interface AnalyticsSummary {
  totalRisks: number;
  totalControls: number;
  toePassRate: number;
  csaHealthScore: number;
  openDeficiencies: number;
  materialWeaknesses: number;
  complianceRate: number;
  mitigationProgress: number;
  controlsByEffectiveness: Array<{
    name: string;
    value: number;
  }>;
}

export type AnalyticsTab =
  | 'analytics-overview'
  | 'csa-heatmap'
  | 'bubble-analytics'
  | 'tod-toe-charts'
  | 'remediation-dod-charts';
