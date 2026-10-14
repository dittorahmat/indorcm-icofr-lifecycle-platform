import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CSAReviewMatrix } from '../CSAReviewMatrix';
import { CSARecord, Control, TODEvaluation } from '@shared/types';

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

describe('CSAReviewMatrix Mobile & Desktop Dual-Render', () => {
  const mockRecord: CSARecord = {
    id: 'csa-rec-1',
    organizationId: 'org-1',
    bpmProcessId: 'proc-1',
    period: '2026-Q1',
    result: 'Effective',
    assessmentDate: Date.now(),
    capturedAt: null,
    line2ValidatedDate: null,
    comments: 'Evaluated clean',
    samples: [
      {
        id: 'sample-1',
        organizationId: 'org-1',
        csaRecordId: 'csa-rec-1',
        sampleRef: 'SMP-001',
        attrA: true,
        attrB: true,
        attrC: true,
        itacMatch: true,
        controlResults: {
          'ctrl-1': {
            implemented: true,
            evidenceUrl: 'https://example.com/doc.pdf',
            riskId: 'risk-1',
            riskName: 'Procurement Risk',
            controlName: 'Approval PO',
          },
        },
      } as any,
    ],
  } as unknown as CSARecord;

  const mockControls: Control[] = [
    {
      id: 'ctrl-1',
      organizationId: 'org-1',
      controlId: 'ctrl-1',
      mappingId: 'map-1',
      controlCode: 'CTL-PTP-01',
      code: 'CTL-PTP-01',
      name: 'Approval PO Threshold',
      mappedControlName: 'Approval PO Threshold',
      description: 'Manager approval above 50M',
      riskRating: 'High',
      nature: 'Manual',
      frequency: 'Monthly',
      status: 'Active',
    } as any,
  ];

  const mockEvaluations: TODEvaluation[] = [
    {
      id: 'tod-1',
      organizationId: 'org-1',
      evaluatorId: 'user-1',
      csaId: 'csa-rec-1',
      controlId: 'ctrl-1',
      pilarObjective: 'Yes',
      pilarTiming: 'Yes',
      pilarAuthority: 'Yes',
      pilarReliability: 'Yes',
      pilarCoverage: 'Yes',
      pilarEvidence: 'Yes',
      kkReference: 'KK-TOD-01',
      conclusion: 'Effective',
      comment: 'Valid',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  it('renders both desktop table and mobile card stack views', () => {
    const handleControlClick = vi.fn();
    const { container } = render(
      <CSAReviewMatrix
        record={mockRecord}
        controls={mockControls}
        todEvaluations={mockEvaluations}
        onControlClick={handleControlClick}
      />
    );

    // Assert mobile container and desktop container exist
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();

    // Dual-render check: Control code CTL-PTP-01 is rendered in both desktop table cell and mobile card
    const controlCodes = screen.getAllByText('CTL-PTP-01');
    expect(controlCodes).toHaveLength(2);

    // Verify click triggers callback
    fireEvent.click(controlCodes[0]);
    expect(handleControlClick).toHaveBeenCalledWith(mockControls[0]);
  });

  it('adheres to anti-slop typography rules with no sub-12px classes', () => {
    const { container } = render(
      <CSAReviewMatrix
        record={mockRecord}
        controls={mockControls}
        todEvaluations={mockEvaluations}
        onControlClick={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');
  });
});
