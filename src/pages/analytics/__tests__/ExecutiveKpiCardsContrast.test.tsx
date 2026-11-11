import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveKpiCards } from '../ExecutiveKpiCards';
import type { AnalyticsSummary } from '../types';
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number; defaultValue?: string }) => strictT(key, opts),
  }),
}));

const mockSummary: AnalyticsSummary = {
  totalRisks: 120,
  totalControls: 85,
  openDeficiencies: 4,
  materialWeaknesses: 0,
  toePassRate: 95.2,
  csaHealthScore: 4.8,
  complianceRate: 98,
  mitigationProgress: 90,
  controlsByEffectiveness: [{ name: 'Effective', value: 81 }, { name: 'Deficient', value: 4 }],
};

describe('ExecutiveKpiCards Contrast & Readability (#158)', () => {
  it('renders card category labels with high contrast text-slate-600 dark:text-slate-300 font-bold', () => {
    render(<ExecutiveKpiCards data={mockSummary} />);

    const totalRiskLabel = screen.getByText('kpi.totalRisk');
    expect(totalRiskLabel).toHaveClass('text-xs', 'font-bold', 'text-slate-600', 'dark:text-slate-300', 'tracking-wider');

    const toePassRateLabel = screen.getByText('kpi.toePassRate');
    expect(toePassRateLabel).toHaveClass('text-xs', 'font-bold', 'text-slate-600', 'dark:text-slate-300', 'tracking-wider');

    const csaScoreLabel = screen.getByText('kpi.csaHealthScore');
    expect(csaScoreLabel).toHaveClass('text-xs', 'font-bold', 'text-slate-600', 'dark:text-slate-300', 'tracking-wider');

    const openDeficienciesLabel = screen.getByText('kpi.openDeficiencies');
    expect(openDeficienciesLabel).toHaveClass('text-xs', 'font-bold', 'text-slate-600', 'dark:text-slate-300', 'tracking-wider');
  });

  it('renders secondary units and tags with calibrated readable tones', () => {
    render(<ExecutiveKpiCards data={mockSummary} />);

    const csaMaxScore = screen.getByText('/ 5.0');
    expect(csaMaxScore).toHaveClass('text-slate-600', 'dark:text-slate-400', 'font-medium');

    const mediumSeverity = screen.getByText('kpi.mediumSeverity');
    expect(mediumSeverity).toHaveClass('text-slate-600', 'dark:text-slate-400', 'font-medium');

    const riskUnit = screen.getByText('kpi.riskUnit');
    expect(riskUnit).toHaveClass('text-slate-600', 'dark:text-slate-400', 'font-medium');
  });
});
