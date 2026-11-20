import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { TestingHeaderBanner } from '../TestingHeaderBanner';
import { TestingSummaryMetrics } from '../TestingSummaryMetrics';
import { TestingControlRow } from '../TestingControlRow';
import type { Control, Deficiency } from '@shared/types';

vi.mock('@/components/testing/ControlTestCard', () => ({
  ControlTestCard: () => <div data-testid="control-test-card">Mock ControlTestCard</div>,
}));

describe('TestingWorkbench', () => {
  describe('TestingHeaderBanner', () => {
    it('renders Light Sovereign card with mandate badges, headline, metrics pill, and methodology tags', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <TestingHeaderBanner
            workingYear="2024"
            totalControls={50}
            testedCount={35}
          />
        </I18nextProvider>
      );

      // Verify mandate and metadata badges
      expect(screen.getByText(/Mandat SK-5 \/ BPKP-2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Lampiran 8 \(TOD\) & Lampiran 9 \(TOE\)/i)).toBeInTheDocument();
      expect(screen.getByText(/(Siklus Audit FY 2024|Audit Cycle FY 2024)/i)).toBeInTheDocument();

      // Verify title & subtitle (using flexible matchers across i18n locales)
      expect(
        screen.getByText(/(Kertas Kerja Pengujian|Audit Testing Working Paper)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/(Kertas kerja audit terintegrasi|Integrated audit working papers)/i)
      ).toBeInTheDocument();

      // Verify metrics pill
      expect(screen.getByText(/(Pengendalian Diuji|Controls Tested)/i)).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText(/\/ 50/i)).toBeInTheDocument();
      expect(screen.getByText(/70%/i)).toBeInTheDocument();
      expect(screen.getByText(/PIPK/i)).toBeInTheDocument();

      // Verify methodology tags
      expect(screen.getByText(/(Metodologi Terverifikasi:|Verified Methodology:)/i)).toBeInTheDocument();
      expect(screen.getByText(/(6-Pilar Walkthrough TOD|6-Pillar Walkthrough TOD)/i)).toBeInTheDocument();
      expect(screen.getByText(/Attribute Sampling TOE/i)).toBeInTheDocument();
      expect(screen.getByText(/Three Lines Model Governance/i)).toBeInTheDocument();

      // Verify Light Sovereign styling classes on container
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('bg-white');
      expect(rootDiv.className).toContain('dark:bg-card');
      expect(rootDiv.className).toContain('text-foreground');
      expect(rootDiv.className).toContain('border-border/80');

      // Anti-slop: dark containers and glow circles removed
      expect(rootDiv.className).not.toContain('bg-primary-container');
      const html = container.innerHTML;
      expect(html).not.toContain('bg-primary-container');
      expect(html).not.toContain('blur-3xl');
      expect(html).not.toContain('blur-2xl');
      expect(html).not.toContain('text-[8px]');
      expect(html).not.toContain('text-[9px]');
      expect(html).not.toContain('text-[10px]');
      expect(html).not.toContain('text-[11px]');
    });

    it('handles 0 controls safely with 0% coverage and default props', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <TestingHeaderBanner />
        </I18nextProvider>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/\/ 0/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
      expect(screen.getByText(/(Siklus Audit FY 2024|Audit Cycle FY 2024)/i)).toBeInTheDocument();
    });
  });

  describe('TestingSummaryMetrics', () => {
    it('renders tested count, effective count, deviations, and L2 validation metrics', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <TestingSummaryMetrics
            totalControls={20}
            testedCount={15}
            effectiveCount={12}
            deviationCount={3}
            validatedL2Count={10}
          />
        </I18nextProvider>
      );

      // Verify tested count
      expect(screen.getByText('15')).toBeInTheDocument();
      // Verify effective count
      expect(screen.getByText('12')).toBeInTheDocument();
      // Verify deviation count
      expect(screen.getByText('3')).toBeInTheDocument();
      // Verify validated L2 count
      expect(screen.getByText('10')).toBeInTheDocument();
      // Verify percentage calculated (10/20 = 50%)
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  describe('TestingControlRow', () => {
    const mockControl: Control = {
      id: 'ctrl-test-1',
      organizationId: 'org-1',
      code: 'C-FIN-01',
      name: 'Verifikasi Otorisasi Pengeluaran Kas',
      description: 'Pengecekan bukti transaksi pengeluaran kas di atas Rp 100 juta',
      frequency: 'Bulanan',
      nature: 'Manual',
      businessProcess: 'Treasury & Cash Management',
      assertions: [],
      ipos: [],
      cosoPrinciples: [],
      relatedControlIds: [],
      effectiveDate: null,
      lastCsaDate: null,
    } as Control;

    const mockItemVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    it('renders control details and toggles expansion card', () => {
      const handleToggle = vi.fn();

      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <TestingControlRow
            control={mockControl}
            isExpanded={false}
            onToggleExpand={handleToggle}
            hasCoolingOffViolation={false}
            controlHistory={[]}
            itemVariants={mockItemVariants}
          />
        </I18nextProvider>
      );

      // Verify name, code, frequency, and process
      expect(screen.getByText('Verifikasi Otorisasi Pengeluaran Kas')).toBeInTheDocument();
      expect(screen.getByText('C-FIN-01')).toBeInTheDocument();
      expect(screen.getByText('Bulanan')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Treasury & Cash Management')).toBeInTheDocument();

      // Click card header to trigger expansion
      fireEvent.click(screen.getByText('Verifikasi Otorisasi Pengeluaran Kas'));
      expect(handleToggle).toHaveBeenCalledTimes(1);

      // Rerender as expanded
      rerender(
        <I18nextProvider i18n={i18n}>
          <TestingControlRow
            control={mockControl}
            isExpanded={true}
            onToggleExpand={handleToggle}
            hasCoolingOffViolation={false}
            controlHistory={[]}
            itemVariants={mockItemVariants}
          />
        </I18nextProvider>
      );

      expect(screen.getByTestId('control-test-card')).toBeInTheDocument();
    });

    it('displays warning banner when cooling-off violation is present', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <TestingControlRow
            control={mockControl}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            hasCoolingOffViolation={true}
            controlHistory={[]}
            itemVariants={mockItemVariants}
          />
        </I18nextProvider>
      );

      // Verify cooling-off alert badge and banner in expanded view
      expect(screen.getAllByText(/Cooling-off/i).length).toBeGreaterThan(0);
    });

    it('displays CSA Ineffective banner when latestOpenDeficiency source includes CSA', () => {
      const mockDeficiency: Deficiency = {
        id: 'def-csa-1',
        organizationId: 'org-1',
        controlId: 'ctrl-test-1',
        description: 'Inefektif dalam CSA',
        severity: 'Significant Deficiency',
        status: 'Open',
        source: 'Lini 1 - CSA',
        identifiedDate: Date.now(),
        relatedAssertions: [],
        compensatingControlIds: [],
        bpmProcessId: null,
        period: '2025',
        identifiedBy: 'user-1',
        rootCause: null,
        magnitude: null,
        exposureValue: null,
        likelihood: null,
        correctiveActionTaken: null,
        remediationEvidence: null,
      };

      render(
        <I18nextProvider i18n={i18n}>
          <TestingControlRow
            control={mockControl}
            isExpanded={true}
            onToggleExpand={vi.fn()}
            latestOpenDeficiency={mockDeficiency}
            hasCoolingOffViolation={false}
            controlHistory={[]}
            itemVariants={mockItemVariants}
          />
        </I18nextProvider>
      );

      expect(screen.getByText(/INEFFECTIVE IN CSA/i)).toBeInTheDocument();
      expect(screen.getByText(/Line 3 Testing Suspended/i)).toBeInTheDocument();
    });
  });
});
