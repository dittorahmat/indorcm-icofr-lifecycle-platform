import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CSAWorklistTab } from './CSAWorklistTab';

vi.mock('../utils/use-csa-worklist', () => ({
  useCsaWorklist: vi.fn(),
}));

vi.mock('@/components/bpm/CSAModal', () => ({
  CSAModal: (props: { isOpen: boolean; bpmProcessId?: string }) =>
    props.isOpen ? <div data-testid="csa-modal" data-bpm={props.bpmProcessId ?? ''} /> : null,
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { role: sessionRole.role } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

const sessionRole = vi.hoisted(() => ({ role: 'Line 1' as string | undefined }));

import { useCsaWorklist } from '../utils/use-csa-worklist';

const GROUPS = [
  {
    key: 'p1',
    title: 'Pengajuan Fasilitas KUR',
    items: [
      { id: 'c1', controlId: 'c1', code: 'C-KUR-001', name: 'Wawancara Lapangan', level: 'TLC', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', noGL: '12071', riskDescription: 'Data beda' },
      { id: 'c2', controlId: 'c2', code: 'C-KUR-002', name: 'Validasi Dukcapil', level: 'TLC', bpmProcessId: 'p1', bpmProcessName: 'Pengajuan Fasilitas KUR', noGL: '12071', riskDescription: 'Data beda' },
    ],
  },
  {
    key: 'p2',
    title: 'Pelunasan Dipercepat',
    items: [
      { id: 'c3', controlId: 'c3', code: 'C-12071', name: 'Verifikasi Identitas', level: 'TLC', bpmProcessId: 'p2', bpmProcessName: 'Pelunasan Dipercepat', noGL: '12071', riskDescription: 'Tanpa wewenang' },
    ],
  },
];

const BASE = { total: 3, emptyKind: null, isLoading: false, isError: false, refetch: vi.fn() };

describe('CSAWorklistTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionRole.role = 'Line 1';
  });

  it('dual-renders each item in the desktop table AND the mobile cards', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    const { container } = render(<CSAWorklistTab />);

    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
    expect(screen.getAllByText('Wawancara Lapangan')).toHaveLength(2);
    expect(screen.getByTestId('worklist-group-p1')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="worklist-card"]')).toHaveLength(3);
  });

  it('opens the CSA workspace modal for the chosen control', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    render(<CSAWorklistTab />);

    expect(screen.queryByTestId('csa-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByText('page.worklist.cta')[0]);
    expect(screen.getByTestId('csa-modal')).toHaveAttribute('data-bpm', 'p1');
  });

  it('distinguishes the two empty states', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: [], emptyKind: 'no-controls' });
    const { unmount } = render(<CSAWorklistTab />);
    expect(screen.getByText('page.worklist.emptyNoControls')).toBeInTheDocument();
    unmount();

    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: [], emptyKind: 'all-assessed' });
    render(<CSAWorklistTab />);
    expect(screen.getByText('page.worklist.emptyAllAssessed')).toBeInTheDocument();
  });

  it('shows loading and error states with a retry action', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: [], isLoading: true });
    const { unmount } = render(<CSAWorklistTab />);
    expect(screen.getByText('page.worklist.loading')).toBeInTheDocument();
    unmount();

    const refetch = vi.fn();
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: [], isError: true, refetch });
    render(<CSAWorklistTab />);
    fireEvent.click(screen.getByText('page.worklist.retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('filters groups and items by the search query', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    render(<CSAWorklistTab />);

    fireEvent.change(screen.getByPlaceholderText('page.worklist.searchPlaceholder'), {
      target: { value: 'dukcapil' },
    });
    expect(screen.getAllByText('Validasi Dukcapil')).toHaveLength(2);
    expect(screen.queryByText('Wawancara Lapangan')).not.toBeInTheDocument();
    expect(screen.queryByText('Pelunasan Dipercepat')).not.toBeInTheDocument();
  });

  it('disables the CTA for the Line 2 read-only role', () => {
    sessionRole.role = 'Line 2';
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    render(<CSAWorklistTab />);

    const buttons = screen.getAllByText('page.worklist.cta').map((el) => el.closest('button'));
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it('keeps the CTA enabled for Line 1 executors', () => {
    sessionRole.role = 'Line 1';
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    render(<CSAWorklistTab />);

    const buttons = screen.getAllByText('page.worklist.cta').map((el) => el.closest('button'));
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).not.toBeDisabled();
    }
  });

  it('applies shared column sizing classes to desktop TableHead and TableCell', () => {
    vi.mocked(useCsaWorklist).mockReturnValue({ ...BASE, groups: GROUPS });
    const { container } = render(<CSAWorklistTab />);

    const ths = container.querySelectorAll('thead th');
    expect(ths[0]).toHaveClass('w-[140px]', 'min-w-[140px]');
    expect(ths[1]).toHaveClass('min-w-[320px]');
    expect(ths[2]).toHaveClass('min-w-[420px]');
    expect(ths[3]).toHaveClass('w-[120px]', 'min-w-[120px]');

    const rowTds = container.querySelectorAll('tbody tr:nth-child(2) td');
    expect(rowTds[0]).toHaveClass('w-[140px]', 'min-w-[140px]');
    expect(rowTds[1]).toHaveClass('min-w-[320px]');
    expect(rowTds[2]).toHaveClass('min-w-[420px]');
    expect(rowTds[3]).toHaveClass('w-[120px]', 'min-w-[120px]');
  });

});
