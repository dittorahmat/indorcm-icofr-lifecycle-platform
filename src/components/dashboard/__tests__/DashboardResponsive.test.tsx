import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardKPIs } from '../DashboardKPIs';
import { COSOCoverageGrid } from '../COSOCoverageGrid';
import { LifecycleProgress } from '../LifecycleProgress';

import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      validateI18nKey(key);
      if (options?.year) return `Year ${options.year}`;
      return options?.defaultValue || key;
    },
  }),
}));

describe('Dashboard Mobile Responsiveness & Anti-Slop Integrity', () => {
  it('renders DashboardKPIs with non-clipped structure and mobile layout', () => {
    const { container } = render(
      <DashboardKPIs
        controlsCount={120}
        openDeficienciesCount={4}
        cosoPercentage="94"
        workingYear="2026"
      />
    );

    // Mobile-first: single-column base (no page-level horizontal scroll at
    // 320px); densified columns only at/above the 420px breakpoint.
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('lg:grid-cols-4');

    // Inner KPI strip stacks below 420px, densifies at/above it.
    const innerStrip = grid.querySelector('.min-\\[420px\\]\\:grid-cols-3');
    expect(innerStrip).not.toBeNull();

    // Verify text renders cleanly
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('renders COSOCoverageGrid with no sub-12px font classes', () => {
    const mockCoverage = [
      { principle: 1, count: 12 },
      { principle: 2, count: 0 },
    ];

    const { container } = render(
      <COSOCoverageGrid
        cosoCoverage={mockCoverage}
        isLoading={false}
      />
    );

    // Anti-slop verification: ensure no text-[8px], text-[9px], text-[10px], or text-[11px]
    const html = container.innerHTML;
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');

    // Confirm Principle labels exist
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('renders LifecycleProgress mobile stepper and active stage pill', () => {
    const { container } = render(
      <LifecycleProgress currentStage="evaluasi" workingYear="2026" />
    );

    // Verify mobile stepper exists with touch scroll classes
    const mobileContainer = container.querySelector('.flex.md\\:hidden');
    expect(mobileContainer).not.toBeNull();

    const scrollablePills = container.querySelector('.overflow-x-auto');
    expect(scrollablePills).not.toBeNull();
    expect(scrollablePills?.className).toContain('touch-pan-x');

    // Anti-slop check: no sub-12px text in LifecycleProgress
    const html = container.innerHTML;
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');
  });

  it('renders ActionCenter with flex protection and badge containment', async () => {
    const { ActionCenter } = await import('../ActionCenter');
    const { MemoryRouter } = await import('react-router-dom');
    const { container } = render(
      <MemoryRouter>
        <ActionCenter csaCompletion={75} openDeficienciesCount={3} />
      </MemoryRouter>
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Verify truncate protection classes on titles
    const titles = container.querySelectorAll('h4');
    expect(titles.length).toBeGreaterThan(0);
    titles.forEach(title => {
      expect(title.className).toContain('truncate');
    });
  });

  it('locks wide container max-width classes on AppLayout when container is enabled', async () => {
    const { AppLayout } = await import('@/components/layout/AppLayout');
    const { MemoryRouter } = await import('react-router-dom');
    const { container } = render(
      <MemoryRouter>
        <AppLayout container>
          <div data-testid="layout-child">Content</div>
        </AppLayout>
      </MemoryRouter>
    );

    const contentWrapper = container.querySelector('[data-testid="layout-child"]')?.parentElement;
    expect(contentWrapper).not.toBeNull();
    expect(contentWrapper?.className).toContain('max-w-[1720px]');
    expect(contentWrapper?.className).toContain('2xl:max-w-[1840px]');
  });
});
