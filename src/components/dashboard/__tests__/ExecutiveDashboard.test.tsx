import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExecutiveHeaderBanner } from '../ExecutiveHeaderBanner';
import { ExecutiveStatCards } from '../ExecutiveStatCards';
import { RiskHeatmap5x5 } from '../RiskHeatmap5x5';
import { DeficiencySummary } from '../DeficiencySummary';
import { SubsidiaryMonitoringTable } from '../SubsidiaryMonitoringTable';
import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number | undefined>) => {
      validateI18nKey(key);
      if (options?.year) return `Year ${options.year}`;
      if (options?.level) return `Level ${options.level}`;
      if (options?.tested && options?.total) return `${options.tested} of ${options.total}`;
      if (options?.count !== undefined) return `${options.count} count`;
      if (options?.percent !== undefined) return `${options.percent}%`;
      return (options?.defaultValue as string) || key;
    },
  }),
}));

describe('Executive Dashboard Sovereign Governance Components', () => {
  it('renders ExecutiveHeaderBanner with mandate badges, opinion, and maturity score', () => {
    const { container } = render(
      <ExecutiveHeaderBanner
        workingYear="2024"
        opiniManagement="EFEKTIF DENGAN CATATAN"
        maturityScore={88.4}
        maturityLevel={4}
      />
    );

    expect(screen.getByText('executiveBanner.badgeMandat')).toBeInTheDocument();
    expect(screen.getByText('executiveBanner.regNo')).toBeInTheDocument();
    expect(screen.getByText('executiveBanner.headline')).toBeInTheDocument();
    expect(screen.getByText('EFEKTIF DENGAN CATATAN')).toBeInTheDocument();
    expect(screen.getByText('88.4%')).toBeInTheDocument();
    expect(screen.getByText('Level 4')).toBeInTheDocument();

    // Anti-slop checks
    const html = container.innerHTML;
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');

    // Institutional Sky Gradient styling assertions
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('bg-gradient-to-r');
    expect(rootDiv.className).toContain('from-sky-50');
    expect(rootDiv.className).toContain('border-sky-200/80');
  });

  it('renders ExecutiveStatCards with 4 primary executive metrics', () => {
    const { container } = render(
      <ExecutiveStatCards
        totalControls={1348}
        testedControls={1240}
        effectivePercentage={92}
        minorDeviations={108}
        tlcEffective={1120}
        tlcTotal={1210}
        elcCompliance={96}
        itgcCompliance={94}
        openDeficienciesCount={14}
        actionPlansCount={34}
        overdueDeficienciesCount={7}
      />
    );

    // Verify 4 cards title and values
    expect(screen.getByText('statCards.card1.title')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('statCards.card2.title')).toBeInTheDocument();
    expect(screen.getByText('1120 / 1210')).toBeInTheDocument();
    expect(screen.getByText('statCards.card3.title')).toBeInTheDocument();
    expect(screen.getByText('statCards.card4.title')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    // Verify grid responsiveness classes
    const rootGrid = container.firstChild as HTMLElement;
    expect(rootGrid.className).toContain('grid-cols-1');
    expect(rootGrid.className).toContain('md:grid-cols-2');
    expect(rootGrid.className).toContain('xl:grid-cols-4');
  });

  it('renders RiskHeatmap5x5 with BPKP standard and scrollable wrapper', () => {
    const { container } = render(<RiskHeatmap5x5 />);

    expect(screen.getByText('riskHeatmap.title')).toBeInTheDocument();
    expect(screen.getByText('riskHeatmap.bpkpStandard')).toBeInTheDocument();

    // Scroll container
    const scrollContainer = container.querySelector('.overflow-x-auto');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer?.className).toContain('touch-pan-x');

    // Matrix rows and columns
    expect(screen.getByText('riskHeatmap.l5')).toBeInTheDocument();
    expect(screen.getByText('riskHeatmap.i5')).toBeInTheDocument();
  });

  it('renders DeficiencySummary with DoD vs DoO classification and 3 tiers', () => {
    const { container } = render(
      <DeficiencySummary
        totalFindings={108}
        dodCount={38}
        dooCount={70}
        materialWeaknessCount={1}
        significantDeficiencyCount={13}
        controlDeficiencyCount={94}
      />
    );

    expect(screen.getByText('deficiencySummary.title')).toBeInTheDocument();
    expect(screen.getByText(/38/)).toBeInTheDocument();
    expect(screen.getByText(/70/)).toBeInTheDocument();
    expect(screen.getByText('deficiencySummary.mwTitle')).toBeInTheDocument();
    expect(screen.getByText('deficiencySummary.sdTitle')).toBeInTheDocument();
    expect(screen.getByText('deficiencySummary.cdTitle')).toBeInTheDocument();

    const html = container.innerHTML;
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');
  });

  it('renders SubsidiaryMonitoringTable with touch horizontal scroll and cluster filter', () => {
    const { container } = render(<SubsidiaryMonitoringTable />);

    expect(screen.getByText('subsidiaryTable.title')).toBeInTheDocument();
    expect(screen.getByText('PT Semen Indonesia (Persero) Tbk')).toBeInTheDocument();
    expect(screen.getByText('PT Pupuk Nusantara Holding')).toBeInTheDocument();
    expect(screen.getByText('PT Perkebunan Madani Persero')).toBeInTheDocument();
    expect(screen.getByText('PT Logistik Energi Nusantara')).toBeInTheDocument();

    const tableWrapper = container.querySelector('.overflow-x-auto');
    expect(tableWrapper).not.toBeNull();
    expect(tableWrapper?.className).toContain('touch-pan-x');
  });
});
