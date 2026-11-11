import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { MaterialityKpiCards } from '../MaterialityKpiCards';
import { MaterialityJustificationPanel } from '../MaterialityJustificationPanel';
import { SubsidiaryAllocationGrid } from '../SubsidiaryAllocationGrid';
import type { MaterialityJustification } from '@shared/types';

describe('ScopingComponents', () => {
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
