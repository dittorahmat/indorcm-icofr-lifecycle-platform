import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { DeficiencyHeaderBanner } from '../DeficiencyHeaderBanner';
import { SeverityMatrixCards } from '../SeverityMatrixCards';
import { CAPTrackingTable } from '../CAPTrackingTable';
import type { Deficiency, ActionPlan } from '@shared/types';

describe('DeficiencyWorkbench', () => {
  describe('DeficiencyHeaderBanner', () => {
    it('renders Light Sovereign card with mandate badges, headline, metrics pill, and protocol tags', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <DeficiencyHeaderBanner
            totalDeficiencies={14}
            materialWeaknessCount={2}
            significantDeficiencyCount={4}
            controlDeficiencyCount={8}
          />
        </I18nextProvider>
      );

      // Verify mandate and metadata badges
      expect(screen.getByText(/Mandat Lampiran 10 SK-5/i)).toBeInTheDocument();
      expect(screen.getByText(/SK-5\/DKU\.MBU\/11\/2024 Bab VII/i)).toBeInTheDocument();
      expect(screen.getByText(/(Pengawasan Komite Audit & BPKP|Audit Committee & BPKP Oversight)/i)).toBeInTheDocument();

      // Verify headline & subtitle
      expect(
        screen.getByText(/(Manajemen Temuan & Remediasi|Control Deficiency & Remediation)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/(Kompilasi defisiensi pengendalian internal|Compilation of verified internal control deficiencies)/i)
      ).toBeInTheDocument();

      // Verify metrics pill
      expect(screen.getByText(/(Total Temuan|Total Findings)/i)).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText(/(Kasus|Cases)/i)).toBeInTheDocument();
      expect(screen.getByText(/2 MW/i)).toBeInTheDocument();
      expect(screen.getByText(/4 SD • 8 CD/i)).toBeInTheDocument();

      // Verify protocol notes
      expect(screen.getByText(/(Protokol Pelaporan:|Reporting Protocols:)/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Material Weakness ->/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/30/i)).toBeInTheDocument();

      // Verify Light Sovereign styling classes on container
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('bg-white');
      expect(rootDiv.className).toContain('dark:bg-card');
      expect(rootDiv.className).toContain('text-foreground');
      expect(rootDiv.className).toContain('border-l-4');
      expect(rootDiv.className).toContain('border-l-secondary');

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

    it('handles 0 findings safely with default props', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <DeficiencyHeaderBanner />
        </I18nextProvider>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/0 MW/i)).toBeInTheDocument();
      expect(screen.getByText(/0 SD • 0 CD/i)).toBeInTheDocument();
    });
  });

  describe('SeverityMatrixCards', () => {
    it('renders Material Weakness, Significant Deficiency, and Control Deficiency counts', () => {
      const handleSelectSeverity = vi.fn();

      render(
        <I18nextProvider i18n={i18n}>
          <SeverityMatrixCards
            totalDeficiencies={15}
            materialWeaknessCount={2}
            significantDeficiencyCount={5}
            controlDeficiencyCount={8}
            remediationInProgressCount={7}
            activeSeverityFilter="Material Weakness"
            onSelectSeverity={handleSelectSeverity}
          />
        </I18nextProvider>
      );

      // Verify severity counts and badges
      expect(screen.getByText('Material Weakness')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Significant Deficiency')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Control Deficiency')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();

      // Click card to test selection callback
      fireEvent.click(screen.getByText('Significant Deficiency'));
      expect(handleSelectSeverity).toHaveBeenCalledWith('Significant Deficiency');
    });
  });

  describe('CAPTrackingTable', () => {
    const mockDeficiencies: Deficiency[] = [
      {
        id: 'def-1',
        organizationId: 'org-1',
        controlId: 'ctrl-1',
        controlCode: 'C-REV-01',
        controlName: 'Rekonsiliasi Pendapatan Harian',
        description: 'Selisih rekonsiliasi belum diinvestigasi',
        severity: 'Material Weakness',
        status: 'Open',
        source: 'Lini 2 - TOE Review',
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
      },
      {
        id: 'def-2',
        organizationId: 'org-1',
        controlId: 'ctrl-2',
        controlCode: 'C-AST-02',
        controlName: 'Inventarisasi Aset Tetap',
        description: 'Label barcode fisik belum diperbarui',
        severity: 'Control Deficiency',
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
      },
    ];

    const mockActionPlans: ActionPlan[] = [
      {
        id: 'ap-1',
        organizationId: 'org-1',
        deficiencyId: 'def-1',
        description: 'Implementasi automated reconciliation bot',
        planDescription: 'Implementasi automated reconciliation bot',
        picName: 'Budi Santoso',
        targetDate: Date.parse('2025-03-31'),
        status: 'In Progress',
        workflowStatus: 'In Review',
        workflowHistory: [],
        ownerId: null,
        dueDate: null,
        relatedFunction: null,
        activityDetail: null,
        remediatedControlDescription: null,
        actualCompletionDate: null,
        isApprovedByLine2: false,
        isBeforeYearEnd: false,
        severity: 'MW',
        rescheduleReason: null,
      },
    ];

    it('renders sample rows, status badges, PIC, and target date', () => {
      const handleAssess = vi.fn();
      const handleEditPlan = vi.fn();
      const handleStatusChange = vi.fn();

      render(
        <I18nextProvider i18n={i18n}>
          <CAPTrackingTable
            deficiencies={mockDeficiencies}
            actionPlans={mockActionPlans}
            onAssess={handleAssess}
            onEditPlan={handleEditPlan}
            onStatusChange={handleStatusChange}
            role="Admin"
          />
        </I18nextProvider>
      );

      // Verify row 1 (with action plan)
      expect(screen.getByText('C-REV-01')).toBeInTheDocument();
      expect(screen.getByText('Rekonsiliasi Pendapatan Harian')).toBeInTheDocument();
      expect(screen.getByText('MW')).toBeInTheDocument();
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      expect(screen.getByText('31 Mar 2025')).toBeInTheDocument();

      // Verify row 2 (without action plan - fallback text)
      expect(screen.getByText('C-AST-02')).toBeInTheDocument();
      expect(screen.getByText('CD')).toBeInTheDocument();

      // Verify action trigger
      const dodButtons = screen.getAllByRole('button', { name: /DoD/i });
      expect(dodButtons.length).toBe(2);
      fireEvent.click(dodButtons[0]);
      expect(handleAssess).toHaveBeenCalledWith('def-1');
    });

    it('locks wide layout density on CAPTrackingTable and narrative column width', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <CAPTrackingTable
            deficiencies={mockDeficiencies}
            actionPlans={mockActionPlans}
            onAssess={vi.fn()}
            onEditPlan={vi.fn()}
            onStatusChange={vi.fn()}
            role="Admin"
          />
        </I18nextProvider>
      );

      const table = container.querySelector('table');
      expect(table).not.toBeNull();
      expect(table?.className).toContain('min-w-[1040px]');

      const uraianHeader = screen.getByRole('columnheader', { name: /Uraian Temuan & Kontrol/i });
      expect(uraianHeader).toBeInTheDocument();
      expect(uraianHeader.className).toContain('min-w-[340px]');
    });
  });
});
