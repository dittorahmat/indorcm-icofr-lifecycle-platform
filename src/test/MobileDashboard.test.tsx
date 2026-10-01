import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LifecycleProgress } from '@/components/dashboard/LifecycleProgress';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key}:${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

describe('Mobile Dashboard Components', () => {
  describe('LifecycleProgress Component', () => {
    it('renders all 6 SK-5 lifecycle stages in mobile stepper', () => {
      render(<LifecycleProgress currentStage="evaluasi" workingYear="2027" />);

      // Verify all 6 stages are present
      expect(screen.getAllByText('lifecycle.perancangan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('lifecycle.implementasi').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('lifecycle.evaluasi').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('lifecycle.remediasi').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('lifecycle.pelaporan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('lifecycle.asurans').length).toBeGreaterThanOrEqual(1);

      // Verify current stage progress calculation (Stage 3 of 6 = 50%)
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  describe('DashboardKPIs Component', () => {
    it('renders executive cycle readiness and all 3 KPI cards without crashing', () => {
      render(
        <DashboardKPIs 
          controlsCount={42} 
          openDeficienciesCount={3} 
          cosoPercentage="88" 
          workingYear="2027" 
        />
      );

      expect(screen.getByText('kpis.cycleReadiness')).toBeInTheDocument();
      expect(screen.getByText('kpis.ready')).toBeInTheDocument();
      expect(screen.getByText('kpis.controlCoverage')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('kpis.openDeficiencies')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('kpis.cosoCoverage')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });
});
