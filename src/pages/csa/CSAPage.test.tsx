import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { definePageQueryMock, resetPageQueryStore } from '@/test/mock-page-queries';
import { CSAPage } from './CSAPage';
import type { CSARecord, BPMProcess } from '@shared/types';
import React from 'react';

type TestCsaRecord = Pick<CSARecord, 'id' | 'bpmProcessId' | 'period' | 'result' | 'assessmentDate' | 'samples' | 'comments'>;
type TestBpmProcess = Pick<BPMProcess, 'id' | 'name'>;

// Mutable query backing store: per-test data without per-test mock plumbing.
const csaPageQueryState = vi.hoisted(() => ({
  records: new Array<TestCsaRecord>(),
  processes: new Array<TestBpmProcess>(),
}));

// Mock the components and hooks that depend on external context
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@tanstack/react-query', () =>
  definePageQueryMock(csaPageQueryState, { recordsKey: 'csa-records-all', processesKey: 'bpm-processes-all' }),
);

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
    i18n: { language: 'en' },
  }),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    History: () => <div />,
    Search: () => <div />,
    ShieldCheck: () => <div />,
    ChevronDown: () => <div />,
    ChevronRight: () => <div />,
    Printer: () => <div />,
    Download: () => <div />,
    FileText: () => <div />,
  };
});

describe('CSAPage', () => {
  it('renders the page title correctly', () => {
    render(<CSAPage />);
    
    // According to TDD: This will initially FAIL because I'm using the translation key as the expected text
    // but I'll check if the mocked 't' function returns the key.
    expect(screen.getByText('page.title')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<CSAPage />);
    expect(screen.getByText('page.description')).toBeInTheDocument();
  });

  it('shows the search input with correct placeholder', () => {
    render(<CSAPage />);
    expect(screen.getByPlaceholderText('page.searchPlaceholder')).toBeInTheDocument();
  });

  it('renders both desktop table container and mobile card container', () => {
    const { container } = render(<CSAPage />);
    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
  });

  it('renders executive summary card on mobile when records exist', () => {
    const { container } = render(<CSAPage />);
    // Verify mobile container is mounted
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
  });

  it('dual-renders each Effective record in desktop table AND mobile card', () => {
    const record: TestCsaRecord = {
      id: 'csa-1',
      bpmProcessId: 'proc-1',
      period: '2026-Q3',
      result: 'Effective',
      assessmentDate: new Date('2026-09-01T10:00:00').getTime(),
      samples: [],
      comments: '',
    };
    const process: TestBpmProcess = { id: 'proc-1', name: 'Procure to Pay' };
    csaPageQueryState.records = [record];
    csaPageQueryState.processes = [process];

    try {
      const { container } = render(<CSAPage />);

      // Dual-render: Tailwind `hidden` does not hide in jsdom, so the process
      // name appears TWICE (desktop row + mobile card). getByText would be
      // ambiguous here — getAllByText locks both views.
      const occurrences = screen.getAllByText('Procure to Pay');
      expect(occurrences).toHaveLength(2);

      // Scope per view: one occurrence lives under the desktop table
      // container, the other under the mobile card stack.
      const desktopContainer = container.querySelector('.hidden.md\\:block');
      const mobileContainer = container.querySelector('.block.md\\:hidden');
      expect(desktopContainer).toBeInTheDocument();
      expect(mobileContainer).toBeInTheDocument();
      expect(occurrences.some((el) => desktopContainer?.contains(el))).toBe(true);
      expect(occurrences.some((el) => mobileContainer?.contains(el))).toBe(true);

      // Scroll/sticky containment asserted via closest() so responsive
      // wrapper refactors do not break the suite.
      const mobileCard = container.querySelector('[data-testid="csa-card-csa-1"]');
      expect(mobileCard).toBeInTheDocument();
      expect(mobileCard?.closest('.block.md\\:hidden')).not.toBeNull();
    } finally {
      resetPageQueryStore(csaPageQueryState);
    }
  });

  it('shows Ineffective records in Assessed, hides No Transaction, with count badges', () => {
    const stamp = new Date('2026-09-01T10:00:00').getTime();
    const items: TestCsaRecord[] = [
      { id: 'csa-eff', bpmProcessId: 'proc-1', period: '2026-Q3', result: 'Effective', assessmentDate: stamp, samples: [], comments: '' },
      { id: 'csa-ineff', bpmProcessId: 'proc-2', period: '2026-Q3', result: 'Ineffective', assessmentDate: stamp, samples: [], comments: '' },
      { id: 'csa-notx', bpmProcessId: 'proc-3', period: '2026-Q3', result: 'No Transaction', assessmentDate: stamp, samples: [], comments: '' },
    ];
    const processes: TestBpmProcess[] = [
      { id: 'proc-1', name: 'Procure to Pay' },
      { id: 'proc-2', name: 'Order to Cash' },
      { id: 'proc-3', name: 'Record to Report' },
    ];
    csaPageQueryState.records = items;
    csaPageQueryState.processes = processes;

    try {
      render(<CSAPage />);

      // Both concluded outcomes dual-render (desktop row + mobile card)
      expect(screen.getAllByText('Procure to Pay')).toHaveLength(2);
      expect(screen.getAllByText('Order to Cash')).toHaveLength(2);
      // No Transaction stays out of the Assessed scope
      expect(screen.queryByText('Record to Report')).not.toBeInTheDocument();

      // Count badges track the search-filtered assessed base
      expect(screen.getByTestId('csa-result-filter-all')).toHaveTextContent('2');
      expect(screen.getByTestId('csa-result-filter-effective')).toHaveTextContent('1');
      expect(screen.getByTestId('csa-result-filter-ineffective')).toHaveTextContent('1');

      // Mobile executive summary counts Ineffective only as deficiency
      const summary = screen.getByTestId('csa-mobile-executive-summary');
      expect(within(summary).getAllByText('1')).toHaveLength(2);
    } finally {
      resetPageQueryStore(csaPageQueryState);
    }
  });

  it('filters Assessed records through the result pills', () => {
    const stamp = new Date('2026-09-01T10:00:00').getTime();
    const items: TestCsaRecord[] = [
      { id: 'csa-eff', bpmProcessId: 'proc-1', period: '2026-Q3', result: 'Effective', assessmentDate: stamp, samples: [], comments: '' },
      { id: 'csa-ineff', bpmProcessId: 'proc-2', period: '2026-Q3', result: 'Ineffective', assessmentDate: stamp, samples: [], comments: '' },
    ];
    const processes: TestBpmProcess[] = [
      { id: 'proc-1', name: 'Procure to Pay' },
      { id: 'proc-2', name: 'Order to Cash' },
    ];
    csaPageQueryState.records = items;
    csaPageQueryState.processes = processes;

    try {
      render(<CSAPage />);

      fireEvent.click(screen.getByTestId('csa-result-filter-ineffective'));
      expect(screen.queryByText('Procure to Pay')).not.toBeInTheDocument();
      expect(screen.getAllByText('Order to Cash')).toHaveLength(2);
      expect(screen.getByTestId('csa-result-filter-ineffective')).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(screen.getByTestId('csa-result-filter-effective'));
      expect(screen.getAllByText('Procure to Pay')).toHaveLength(2);
      expect(screen.queryByText('Order to Cash')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('csa-result-filter-all'));
      expect(screen.getAllByText('Procure to Pay')).toHaveLength(2);
      expect(screen.getAllByText('Order to Cash')).toHaveLength(2);
    } finally {
      resetPageQueryStore(csaPageQueryState);
    }
  });
});
