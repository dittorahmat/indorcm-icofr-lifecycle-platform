import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CSAList } from '../CSAList';
import type { CSARecord } from '@shared/types';

// Mock i18n (returns defaultValue so assertions read naturally)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
  }),
}));

function makeRecord(id: string, period: string, result: 'Effective' | 'Ineffective'): CSARecord {
  return {
    id,
    period,
    result,
    bpmProcessId: 'proc-1',
    assessmentDate: new Date('2025-03-15T10:00:00').getTime(),
    samples: [],
  } as unknown as CSARecord;
}

const baseProps = {
  isLoading: false,
  onViewDetail: vi.fn(),
  onDelete: vi.fn(),
  onPrint: vi.fn(),
  onNewAssessment: vi.fn(),
  bpmCode: 'BPM-01',
  noGL: 'GL-100',
  bpmProcessId: 'proc-1',
  year: 2025,
};

describe('CSAList Responsive Rendering', () => {
  const items = [makeRecord('csa-1', '2025-Q1', 'Effective'), makeRecord('csa-2', '2025-Q2', 'Ineffective')];

  it('renders desktop table wrapper and mobile card container', () => {
    const { container } = render(<CSAList {...baseProps} items={items} />);

    expect(container.querySelector('.hidden.md\\:block')).not.toBeNull();
    const mobile = container.querySelector('[data-testid="csa-history-mobile-cards"]');
    expect(mobile).not.toBeNull();
    expect(mobile?.closest('.md\\:hidden')).not.toBeNull();
  });

  it('dual-renders each record in both views (locks the responsive contract)', () => {
    render(<CSAList {...baseProps} items={items} />);

    // Period appears once in the desktop row and once in the mobile card
    expect(screen.getAllByText('2025-Q1')).toHaveLength(2);
    expect(screen.getAllByText('2025-Q2')).toHaveLength(2);
  });

  it('opens detail from the mobile card action (44px touch target)', () => {
    const onViewDetail = vi.fn();
    const { container } = render(<CSAList {...baseProps} items={items} onViewDetail={onViewDetail} />);
    const mobile = within(container.querySelector('[data-testid="csa-history-mobile-cards"]') as HTMLElement);

    fireEvent.click(mobile.getAllByRole('button', { name: 'View detail' })[0]);
    expect(onViewDetail).toHaveBeenCalledTimes(1);
    expect(onViewDetail).toHaveBeenCalledWith('csa-1');
  });

  it('deletes from the mobile card action', () => {
    const onDelete = vi.fn();
    const { container } = render(<CSAList {...baseProps} items={items} onDelete={onDelete} />);
    const mobile = within(container.querySelector('[data-testid="csa-history-mobile-cards"]') as HTMLElement);

    fireEvent.click(mobile.getAllByRole('button', { name: 'Delete assessment' })[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('csa-1');
  });

  it('shows loading and empty states in the mobile view', () => {
    const { container, rerender } = render(<CSAList {...baseProps} items={[]} isLoading />);
    let mobile = within(container.querySelector('[data-testid="csa-history-mobile-cards"]') as HTMLElement);
    expect(mobile.getByText('Loading...')).toBeInTheDocument();

    rerender(<CSAList {...baseProps} items={[]} isLoading={false} />);
    mobile = within(container.querySelector('[data-testid="csa-history-mobile-cards"]') as HTMLElement);
    expect(mobile.getByText('No history found.')).toBeInTheDocument();
  });
});
