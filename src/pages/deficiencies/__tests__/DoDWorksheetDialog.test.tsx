import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoDWorksheetDialog } from '@/components/deficiencies/DoDWorksheetDialog';
import type { Deficiency } from '@shared/types';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'simulations') {
      return {
        data: {
          items: [{ pmValue: 5_000_000_000, omValue: 10_000_000_000 }],
        },
        isLoading: false,
      };
    }
    if (queryKey[0] === 'controls') {
      return {
        data: {
          items: [
            {
              id: 'comp-101',
              code: 'CTRL-FIN-013',
              name: 'Secondary Variance Review',
              nature: 'Manual',
              line2Validation: { status: 'Validated' },
              type: 'Preventive',
            },
          ],
        },
        isLoading: false,
      };
    }
    return { data: { items: [] }, isLoading: false };
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import deficiencyId from '@/i18n/locales/id/deficiency.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      const parts = key.split('.');
      let current: any = deficiencyId;
      for (const p of parts) {
        if (current && typeof current === 'object' && p in current) {
          current = current[p];
        } else {
          current = undefined;
          break;
        }
      }
      if (typeof current === 'string') return current;
      return typeof opts === 'string' ? opts : (opts?.defaultValue || key);
    },
  }),
}));

const mockDeficiency: Deficiency = {
  id: 'DEF-TEST-001',
  organizationId: 'org-1',
  controlId: 'ctrl-1',
  description: 'Prosedur rekonsiliasi bank tidak dijalankan secara tepat waktu.',
  severity: 'Significant Deficiency',
  identifiedDate: Date.now(),
  identifiedBy: 'user-audit-1',
  status: 'Open',
  rootCause: 'Kekurangan staf di akhir kuartal',
  magnitude: 12_500_000_000,
  exposureValue: 12_500_000_000,
  likelihood: 'High',
  assertions: ['Accuracy', 'Completeness'],
  correctiveActionTaken: null,
  remediationEvidence: null,
  source: 'Lini 3 - Audit',
  controlCode: 'CTRL-FIN-012',
  controlName: 'Rekonsiliasi Bank Bulanan',
  relatedAssertions: ['Accuracy', 'Completeness'],
  compensatingControlIds: [],
  preAssessment: {
    seniorManagementFraud: false,
    materialFraudImpact: false,
    restatement: false,
    auditorIdentifiedMisstatement: false,
    ineffectiveAuditCommittee: false,
  },
};

describe('DoDWorksheetDialog (Lampiran 10)', () => {
  it('renders Lampiran 10 header information, assertions, and tabs', () => {
    render(
      <DoDWorksheetDialog
        isOpen={true}
        setIsOpen={vi.fn()}
        deficiency={mockDeficiency}
        onComplete={vi.fn()}
        performanceMateriality={5_000_000_000}
      />
    );

    expect(screen.getByText('DEF-TEST-001')).toBeInTheDocument();
    expect(screen.getByText('Rekonsiliasi Bank Bulanan')).toBeInTheDocument();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Completeness')).toBeInTheDocument();
  });

  it('renders Kotak 1 through Kotak 7 evaluation questions', () => {
    render(
      <DoDWorksheetDialog
        isOpen={true}
        setIsOpen={vi.fn()}
        deficiency={mockDeficiency}
        onComplete={vi.fn()}
        performanceMateriality={5_000_000_000}
      />
    );

    expect(screen.getByText(/Hubungan Langsung dengan Asersi LK/i)).toBeInTheDocument();
    expect(screen.getByText(/Kemungkinan \(Likelihood\) Salah Saji/i)).toBeInTheDocument();
  });

  it('derives Material Weakness when Box 5 (Compensating Control) is answered No', () => {
    render(
      <DoDWorksheetDialog
        isOpen={true}
        setIsOpen={vi.fn()}
        deficiency={mockDeficiency}
        onComplete={vi.fn()}
        performanceMateriality={5_000_000_000}
      />
    );

    // Box 5 default answer is false (No)
    const mwBadges = screen.getAllByText('Material Weakness');
    expect(mwBadges.length).toBeGreaterThan(0);
  });

  it('calls onComplete with certified worksheet data when saved', () => {
    const handleComplete = vi.fn();
    render(
      <DoDWorksheetDialog
        isOpen={true}
        setIsOpen={vi.fn()}
        deficiency={mockDeficiency}
        onComplete={handleComplete}
        performanceMateriality={5_000_000_000}
      />
    );

    const saveButton = screen.getByRole('button', { name: /Simpan & Sahkan Kertas Kerja DoD/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleComplete).toHaveBeenCalledWith(
      'Material Weakness',
      expect.stringContaining('[Kotak 1 - Ya]'),
      expect.objectContaining({
        exposureValue: 12_500_000_000,
        dodWorksheet: expect.objectContaining({
          deficiencyId: 'DEF-TEST-001',
          finalSeverity: 'Material Weakness',
        }),
      })
    );
  });
});
