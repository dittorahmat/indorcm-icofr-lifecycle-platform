import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BPMDiagramList } from '../BPMDiagramList';
import type { BPMProcessWithChildren, BPMDiagram } from '@shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
  }),
}));

const parentA = {
  id: 'p1',
  name: 'Proc A',
  bpmCode: 'BPM-001',
  workflowStatus: 'Draft',
  riskCount: 2,
  controlCount: 3,
  children: [
    {
      id: 'c1',
      name: 'Sub A1',
      workflowStatus: 'Draft',
      riskCount: 1,
      controlCount: 1,
    },
  ],
} as unknown as BPMProcessWithChildren;

const parentB = {
  id: 'p2',
  name: 'Proc B',
  workflowStatus: 'Approved',
  riskCount: 0,
  controlCount: 0,
} as unknown as BPMProcessWithChildren;

const diagrams = {
  items: [{ id: 'd1', subProcess: 'Proc A', name: 'Proc A' } as unknown as BPMDiagram],
};

const noop = vi.fn();

const baseProps = {
  bpmLoading: false,
  diagrams,
  settings: undefined,
  selectedGLRow: null,
  selectedProcessId: null,
  onSelectProcess: noop,
  onOpenDiagram: noop,
  onCreateDiagram: noop,
  onOpenWorksheet: noop,
  onDeleteProcess: noop,
  searchTerm: '',
  selectedProcessIds: [],
  onToggleSelect: noop,
  onToggleSelectAll: noop,
  onToggleExpand: noop,
  onExpandAll: noop,
  onCollapseAll: noop,
  onOpenMigrationModal: noop,
};

describe('BPMDiagramList Mobile Cards', () => {
  it('renders desktop table wrapper and mobile card container', () => {
    const { container } = render(
      <BPMDiagramList {...baseProps} hierarchicalProcesses={[parentA]} expandedProcessIds={new Set(['p1'])} />
    );
    expect(container.querySelector('.hidden.md\\:block')).not.toBeNull();
    const mobile = container.querySelector('[data-testid="bpm-diagram-mobile-cards"]');
    expect(mobile).not.toBeNull();
    expect(mobile?.closest('.md\\:hidden')).not.toBeNull();
  });

  it('opens the correct viewer when tapping the mobile diagram button', () => {
    const onOpenDiagram = vi.fn();
    const { container } = render(
      <BPMDiagramList {...baseProps} onOpenDiagram={onOpenDiagram} hierarchicalProcesses={[parentA]} expandedProcessIds={new Set(['p1'])} />
    );
    const mobile = within(container.querySelector('[data-testid="bpm-diagram-mobile-cards"]') as HTMLElement);

    fireEvent.click(mobile.getAllByRole('button', { name: 'Lihat Diagram' })[0]);
    expect(onOpenDiagram).toHaveBeenCalledTimes(1);
    expect(onOpenDiagram).toHaveBeenCalledWith('d1', 'Proc A', 'p1');
  });

  it('expands collapsed children inside the mobile card', () => {
    const onToggleExpand = vi.fn();
    const { container, rerender } = render(
      <BPMDiagramList {...baseProps} onToggleExpand={onToggleExpand} hierarchicalProcesses={[parentA, parentB]} expandedProcessIds={new Set()} />
    );
    const mobile = () => within(container.querySelector('[data-testid="bpm-diagram-mobile-cards"]') as HTMLElement);

    expect(mobile().queryByText('Sub A1')).toBeNull();
    fireEvent.click(mobile().getByRole('button', { name: 'Tampilkan sub-proses' }));
    expect(onToggleExpand).toHaveBeenCalledWith('p1');

    rerender(
      <BPMDiagramList {...baseProps} onToggleExpand={onToggleExpand} hierarchicalProcesses={[parentA, parentB]} expandedProcessIds={new Set(['p1'])} />
    );
    expect(mobile().getByText('Sub A1')).toBeInTheDocument();
  });

  it('selects the process when tapping the mobile card', () => {
    const onSelectProcess = vi.fn();
    const { container } = render(
      <BPMDiagramList {...baseProps} onSelectProcess={onSelectProcess} hierarchicalProcesses={[parentB]} expandedProcessIds={new Set()} />
    );
    const mobile = within(container.querySelector('[data-testid="bpm-diagram-mobile-cards"]') as HTMLElement);
    fireEvent.click(mobile.getByText('Proc B'));
    expect(onSelectProcess).toHaveBeenCalledTimes(1);
  });
});
