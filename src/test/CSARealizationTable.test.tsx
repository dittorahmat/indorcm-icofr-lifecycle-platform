import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CSARealizationTable } from '../components/dashboard/CSARealizationTable';
import type { Control } from '@shared/types';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockControls: Control[] = [
  {
    id: 'c1',
    name: 'Control Annual 1',
    code: 'CTRL-01',
    description: 'Desc 1',
    frequency: 'Annual',
    riskRating: 'Low',
    nature: 'Manual',
    cosoPrinciples: [1],
    relatedControlIds: [],
    assertions: ['Completeness'],
    ipos: ['Completeness'],
    effectiveDate: null,
    lastCsaDate: 1714500000000, // Completed
    line2Validation: { status: 'Validated' }
  } as unknown as Control,
  {
    id: 'c2',
    name: 'Control Monthly 1',
    code: 'CTRL-02',
    description: 'Desc 2',
    frequency: 'Monthly',
    riskRating: 'High',
    nature: 'Manual',
    cosoPrinciples: [2],
    relatedControlIds: [],
    assertions: ['Accuracy'],
    ipos: ['Accuracy'],
    effectiveDate: null,
    lastCsaDate: null, // Pending
    line2Validation: { status: 'Pending' } // Counted as completed progress for UI
  } as unknown as Control,
  {
    id: 'c3',
    name: 'Control Monthly 2',
    code: 'CTRL-03',
    description: 'Desc 3',
    frequency: 'Monthly',
    riskRating: 'High',
    nature: 'Manual',
    cosoPrinciples: [3],
    relatedControlIds: [],
    assertions: ['Validity'],
    ipos: ['Validity'],
    effectiveDate: null,
    lastCsaDate: null, // Incomplete
    line2Validation: { status: 'Rejected' }
  } as unknown as Control
];

describe('CSARealizationTable Component', () => {
  it('renders realization table summary with correct population and realization counts', () => {
    render(<CSARealizationTable controls={mockControls} isLoading={false} />);

    // Table title and headers are present
    expect(screen.getByText('realizationTable.title')).toBeInTheDocument();
    expect(screen.getByText('realizationTable.columns.frequency')).toBeInTheDocument();

    // Check Annual Group
    // Populasi is 1 control, target is 1, completed is 1/1
    expect(screen.getByText('realizationTable.frequencies.Annual')).toBeInTheDocument();
    expect(screen.getByText('1 realizationTable.controlsCount')).toBeInTheDocument();
    expect(screen.getByText('1 / 1 (100%)')).toBeInTheDocument();

    // Check Monthly Group
    // Populasi is 2 controls, target is 2 - 5, completed is 1/2 (c2 is pending = completed progress, c3 is rejected = incomplete)
    expect(screen.getByText('realizationTable.frequencies.Monthly')).toBeInTheDocument();
    expect(screen.getByText('2 realizationTable.controlsCount')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 (50%)')).toBeInTheDocument();
  });
});
