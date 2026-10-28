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

export interface ControlDetail {
  id: string;
  code: string;
  cycle: string;
  impact: string;
  impactDesc: string;
  csa: string;
  csaDesc: string;
  status: string;
  statusColor: string;
}

export interface HeatmapResponse {
  matrix: Record<string, Array<{ id: string; code: string; title: string }>>;
  controls: Record<string, ControlDetail>;
}

export interface RiskBubbleItem {
  id: string;
  process: string;
  name: string;
  rating: string;
  x: number;
  y: number;
  z: number;
}

export type AnalyticsTab =
  | 'analytics-overview'
  | 'csa-heatmap'
  | 'bubble-analytics'
  | 'tod-toe-charts'
  | 'remediation-dod-charts';
