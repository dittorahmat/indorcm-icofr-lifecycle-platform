import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { strictT } from '@/test/mock-i18n';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import type { WorksheetControlLike } from '@shared/worksheet-control-scope';

/**
 * Adapter-level wiring for the worksheet control scope.
 *
 * The scope predicate itself is tested at its interface in
 * `shared/worksheet-control-scope.test.ts`; this file asserts only that each
 * view adapter (Execution Hub `BPMModal`, CSA workspace `CSAModal`) hands the
 * CSA tab the controls the shared seam produces — with the year guard, the
 * FSLI restriction, and the documented orphan fallback difference.
 *
 * It replaces the previous test that re-declared the filter and asserted
 * against its own copy (tautological: it could never disagree with production).
 */

interface Fixture extends WorksheetControlLike {
  id: string;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

vi.mock('@/lib/api-client', () => ({ api: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn() },
}));

/** Captures the `controls` prop each adapter passes to the CSA workspace. */
const captured = vi.hoisted(() => ({ controls: [] as Fixture[] }));

vi.mock('../CSATabContent', () => ({
  CSATabContent: (props: { controls?: Fixture[] }) => {
    captured.controls = props.controls ?? [];
    return null;
  },
}));

// Heavy children are irrelevant here and would drag react-flow / react-table
// into the harness; mocking them keeps the assertion on the adapter wiring.
vi.mock('../BPMWorksheet', () => ({ BPMWorksheet: () => null }));
vi.mock('../Lampiran6LogView', () => ({ Lampiran6LogView: () => null }));
vi.mock('../TransactionSamplingTab', () => ({ TransactionSamplingTab: () => null }));
vi.mock('../../workflow/WorkflowPanel', () => ({ WorkflowPanel: () => null }));
vi.mock('@/pages/rcm/RCMELCPage', () => ({ RCMELCPage: () => null }));
vi.mock('@/pages/rcm/RCMTLCPage', () => ({ RCMTLCPage: () => null }));
vi.mock('@/pages/rcm/RCMITGCPage', () => ({ RCMITGCPage: () => null }));
vi.mock('@/pages/rcm/VerificationDesignPage', () => ({ VerificationDesignPage: () => null }));

import { BPMModal } from '../BPMModal';
import { CSAModal } from '../CSAModal';
import { api } from '@/lib/api-client';

const REVENUE_SUB = 'Penerimaan Pendapatan';
const CASH_SUB = 'Rekonsiliasi Kas & Bank';

const controlsFixture: Fixture[] = [
  { id: 'revenue-2026', year: 2026, bpmProcessId: 'proc-revenue', subProcess: REVENUE_SUB, fsliCodes: ['4101'] },
  { id: 'treasury-2026', year: 2026, bpmProcessId: 'proc-treasury', subProcess: CASH_SUB, fsliCodes: ['1101'] },
  { id: 'treasury-2025', year: 2025, bpmProcessId: 'proc-treasury', subProcess: CASH_SUB, fsliCodes: ['1101'] },
  { id: 'treasury-other-gl', year: 2026, bpmProcessId: 'proc-treasury', subProcess: CASH_SUB, fsliCodes: ['9999'] },
  { id: 'petty-cash-2026', year: 2026, bpmProcessId: 'proc-petty-cash', subProcess: 'Pengelolaan Kas Kecil', fsliCodes: ['1101'] },
  { id: 'orphan-cash', year: 2026, fsliCodes: ['1101'] },
];

function renderWithProviders(element: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(UnsavedChangesProvider, null, element),
    ),
  );
}

beforeEach(() => {
  captured.controls = [];
  vi.clearAllMocks();
  useFiscalYearStore.setState({ workingYear: '2026' });
  vi.mocked(api).mockImplementation((path: string) => {
    if (path.startsWith('/api/controls')) return Promise.resolve({ items: controlsFixture });
    if (path.startsWith('/api/user/me')) return Promise.resolve({ id: 'user-1', role: 'Line 2' });
    return Promise.resolve({ items: [] });
  });
});

describe('Execution Hub (BPMModal) control scope', () => {
  it('hands the CSA tab only this process, GL and year, and reads the year-scoped endpoint', async () => {
    renderWithProviders(React.createElement(BPMModal, {
      isOpen: true,
      onOpenChange: () => {},
      noGL: '1101',
      glDesc: 'Kas dan Setara Kas',
      fsliName: 'Kas',
      bpmProcessId: 'proc-treasury',
      subProcessName: CASH_SUB,
      year: '2026',
      initialTab: 'csa',
    }));

    await waitFor(() => expect(captured.controls.map((c) => c.id)).toEqual(['treasury-2026']));
    expect(vi.mocked(api).mock.calls.some(([path]) => path === '/api/controls?year=2026')).toBe(true);
  });

  it('does not apply the CSA orphan fallback', async () => {
    renderWithProviders(React.createElement(BPMModal, {
      isOpen: true,
      onOpenChange: () => {},
      noGL: '1101',
      glDesc: 'Kas dan Setara Kas',
      fsliName: 'Kas',
      bpmProcessId: undefined,
      subProcessName: CASH_SUB,
      year: '2026',
      initialTab: 'csa',
    }));

    await waitFor(() => expect(captured.controls.map((c) => c.id)).toEqual(['treasury-2026']));
  });
});

describe('CSA workspace (CSAModal) control scope', () => {
  it('applies the year guard to the CSA scope — cross-year regression', async () => {
    renderWithProviders(React.createElement(CSAModal, {
      isOpen: true,
      onOpenChange: () => {},
      noGL: '1101',
      subProcessName: CASH_SUB,
      bpmProcessId: 'proc-treasury',
    }));

    await waitFor(() => expect(captured.controls.length).toBeGreaterThan(0));

    const ids = captured.controls.map((c) => c.id);
    // The pre-seam CSAModal filter had no year guard: `treasury-2025` and
    // `treasury-other-gl` reached the assessment.
    expect(ids).toEqual(['treasury-2026', 'orphan-cash']);
    expect(ids).not.toContain('treasury-2025');
    expect(ids).not.toContain('treasury-other-gl');
  });

  it('reads the fiscal-year-scoped controls endpoint', async () => {
    renderWithProviders(React.createElement(CSAModal, {
      isOpen: true,
      onOpenChange: () => {},
      noGL: '1101',
      subProcessName: CASH_SUB,
      bpmProcessId: 'proc-treasury',
    }));

    await waitFor(() =>
      expect(vi.mocked(api).mock.calls.some(([path]) => path === '/api/controls?year=2026')).toBe(true),
    );
  });

  it('renders RCM Matrix sub-tabs (5.B, 5.A, 5.C) with scroll-safe container and switches active sub-tab', async () => {
    const { getByText } = renderWithProviders(React.createElement(BPMModal, {
      isOpen: true,
      onOpenChange: () => {},
      noGL: '1101',
      glDesc: 'Kas dan Setara Kas',
      fsliName: 'Cash',
      bpmProcessId: 'proc-treasury',
      subProcessName: CASH_SUB,
      year: '2026',
      initialTab: 'rcm',
    }));

    // Check all 3 sub-tabs are rendered
    const tlcBtn = getByText('modal.rcmSubtabs.tlc');
    const elcBtn = getByText('modal.rcmSubtabs.elc');
    const itgcBtn = getByText('modal.rcmSubtabs.itgc');
    expect(tlcBtn).toBeInTheDocument();
    expect(elcBtn).toBeInTheDocument();
    expect(itgcBtn).toBeInTheDocument();

    // Verify sub-tab bar container has horizontal scroll safety classes
    const pillContainer = tlcBtn.closest('div');
    expect(pillContainer).toHaveClass('overflow-x-auto');
    expect(pillContainer).toHaveClass('max-w-full');
    expect(pillContainer).toHaveClass('touch-pan-x');

    // Verify buttons have shrink-0 whitespace-nowrap
    expect(tlcBtn.closest('button')).toHaveClass('shrink-0');
    expect(tlcBtn.closest('button')).toHaveClass('whitespace-nowrap');

    // Verify sub-tab click switches view without throwing
    itgcBtn.click();
    await waitFor(() => {
      expect(itgcBtn.closest('button')).toHaveClass('bg-indigo-600');
    });
  });
});
