import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ScopingHeaderBanner } from '../ScopingHeaderBanner';
import { MaterialityKpiCards } from '../MaterialityKpiCards';
import { MaterialityJustificationPanel } from '../MaterialityJustificationPanel';
import { SubsidiaryAllocationGrid } from '../SubsidiaryAllocationGrid';
import type { MaterialityJustification } from '@shared/types';

describe('ScopingComponents', () => {
  describe('ScopingHeaderBanner', () => {
    it('renders Light Sovereign card with mandate badges, headline, and active context', () => {
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <ScopingHeaderBanner
            workingYear="2024"
            activeSnapshotFilename="TB_Dec_2024_Audited.xlsx"
            hasBenchmark={true}
          />
        </I18nextProvider>
      );

      // Verify mandate and metadata badges
      expect(screen.getByText(/Phase 2 • Governance & Scope/i)).toBeInTheDocument();
      expect(screen.getByText('SK-5/DKU.MBU/11/2024')).toBeInTheDocument();
      expect(screen.getByText(/FY 2024 Audited/i)).toBeInTheDocument();

      // Verify headline & subheadline
      expect(screen.getByText(/Scoping & Materiality Determination Workbench/i)).toBeInTheDocument();

      // Verify context card content
      expect(screen.getByText(/FY 2024 \/ Annual/i)).toBeInTheDocument();
      expect(screen.getByText('TB_Dec_2024_Audited.xlsx')).toBeInTheDocument();
      expect(screen.getByText(/Benchmark Ready/i)).toBeInTheDocument();

      // Verify Light Sovereign styling classes
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain('bg-white');
      expect(rootDiv.className).toContain('border-l-4');
      expect(rootDiv.className).toContain('border-l-secondary');

      // Anti-slop typography checks
      const html = container.innerHTML;
      expect(html).not.toContain('text-[8px]');
      expect(html).not.toContain('text-[9px]');
      expect(html).not.toContain('text-[10px]');
      expect(html).not.toContain('text-[11px]');
      expect(html).not.toContain('bg-primary-container');
    });

    it('renders benchmark pending indicator when hasBenchmark is false', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <ScopingHeaderBanner
            workingYear="2025"
            hasBenchmark={false}
          />
        </I18nextProvider>
      );

      expect(screen.getByText(/Mapping Incomplete/i)).toBeInTheDocument();
      expect(screen.getByText(/No Active Snapshot/i)).toBeInTheDocument();
    });
  });

  describe('MaterialityKpiCards', () => {
    it('renders OM, PM, and Threshold values with BPKP benchmark formatting', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MaterialityKpiCards
            omValue={100_000_000_000}
            omPercentage={1.0}
            pmValue={75_000_000_000}
            haircutPercentage={25}
            clearlyTrivialThreshold={5_000_000_000}
            basisName="Total Aset BUMN"
            benchmarkValue={10_000_000_000_000}
          />
        </I18nextProvider>
      );

      // Verify OM card content
      expect(screen.getByText(/Overall Materiality \(OM\)/i)).toBeInTheDocument();
      // Verify PM card content
      expect(screen.getByText(/Performance Materiality \(PM\)/i)).toBeInTheDocument();
      // Verify Threshold / Clearly Trivial card content (Posting Threshold (SUD))
      expect(screen.getByText(/Posting Threshold \(SUD\)/i)).toBeInTheDocument();
      expect(screen.getByText('5% OM')).toBeInTheDocument();
    });
  });

  describe('MaterialityJustificationPanel', () => {
    it('allows typing and triggers onSaveJustification for anti-deadlock narrative updates', () => {
      const handleSave = vi.fn();
      const mockJustification: MaterialityJustification = {
        justificationText: 'Justifikasi awal materialitas entitas',
        justifiedAt: new Date().toISOString(),
      };

      render(
        <I18nextProvider i18n={i18n}>
          <MaterialityJustificationPanel
            justification={mockJustification}
            isLocked={false}
            isJustificationLocked={false}
            onSaveJustification={handleSave}
            isSaving={false}
          />
        </I18nextProvider>
      );

      const textarea = screen.getByPlaceholderText(/Document the economic rationale/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Justifikasi awal materialitas entitas');

      // Edit textarea to trigger dirty state and enable save
      fireEvent.change(textarea, {
        target: { value: 'Penambahan justifikasi risiko tinggi pada anak perusahaan holding' },
      });

      expect(textarea).toHaveValue('Penambahan justifikasi risiko tinggi pada anak perusahaan holding');

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save Justification/i });
      expect(saveButton).toBeEnabled();
      fireEvent.click(saveButton);

      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          justificationText: 'Penambahan justifikasi risiko tinggi pada anak perusahaan holding',
        })
      );
    });

    it('disables editing when isJustificationLocked is true', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MaterialityJustificationPanel
            isLocked={true}
            isJustificationLocked={true}
            onSaveJustification={vi.fn()}
          />
        </I18nextProvider>
      );

      const textarea = screen.getByPlaceholderText(/Document the economic rationale/i);
      expect(textarea).toBeDisabled();
    });
  });

  describe('SubsidiaryAllocationGrid', () => {
    it('renders subsidiary allocation rows with in-scope and out-of-scope statuses', () => {
      const mockItems = [
        {
          id: 'alloc-1',
          code: 'SUB-A',
          name: 'PT Semen Alpha',
          segmentType: 'Holding',
          balanceValue: 50_000_000_000,
          percentageContribution: 50,
          processCount: 10,
          scopingStatus: 'In-Scope' as const,
          qualitativeReason: 'EBITDA tinggi',
        },
        {
          id: 'alloc-2',
          code: 'SUB-B',
          name: 'PT Logistik Beta',
          segmentType: 'Anak Perusahaan',
          balanceValue: 1_000_000_000,
          percentageContribution: 1,
          processCount: 2,
          scopingStatus: 'Out-of-Scope' as const,
          qualitativeReason: 'Nilai di bawah ambang batas',
        },
      ];

      render(
        <I18nextProvider i18n={i18n}>
          <SubsidiaryAllocationGrid items={mockItems} />
        </I18nextProvider>
      );

      expect(screen.getByText('PT Semen Alpha')).toBeInTheDocument();
      expect(screen.getByText('PT Logistik Beta')).toBeInTheDocument();
      expect(screen.getByText('IN-SCOPE')).toBeInTheDocument();
      expect(screen.getByText('OUT-SCOPE')).toBeInTheDocument();
      expect(screen.getByText(/1 In-Scope/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Out-of-Scope/i)).toBeInTheDocument();
    });
  });
});
