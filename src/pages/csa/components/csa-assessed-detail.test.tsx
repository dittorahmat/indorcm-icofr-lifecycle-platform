import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCsaAssessedDetail,
  resolveWorkflowStatus,
  findTodEvaluation,
  isValidAssessmentDate,
  type MatrixControl,
  type TodFormValues,
} from './csa-assessed-detail';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { exportCsaRecordToExcel } from '@/lib/csa-excel-export';

vi.mock('@/lib/api-client', () => ({ api: vi.fn() }));
vi.mock('@/store/useFiscalYearStore', () => ({ useFiscalYearStore: vi.fn() }));
vi.mock('@/lib/csa-excel-export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/csa-excel-export')>();
  return { ...actual, exportCsaRecordToExcel: vi.fn() };
});

const apiMock = vi.mocked(api);

const VALUES: TodFormValues = {
  riskDescription: 'r',
  isFraudRelated: false,
  riskRating: 'H',
  mappedControlName: 'Kontrol A',
  mappedControlDescription: 'd',
  supportingDocs: null,
  isKeyControl: true,
  controlType: 'Preventif',
  controlNature: 'Manual',
  automatedSubNature: null,
  frequency: 'Harian',
  supportingApp: null,
  executingFunction: 'Teller',
  executorRole: 'Staff',
  affectedFsliItem: null,
  effectivePeriod: null,
  ipoC: true,
  ipoA: true,
  ipoV: true,
  ipoRa: false,
  assertionE: true,
  assertionC: true,
  assertionA: true,
  assertionCo: true,
  assertionVa: true,
  assertionRo: true,
  assertionPd: true,
  pilarObjective: 'o',
  pilarTiming: 't',
  pilarAuthority: 'a',
  pilarReliability: 'r',
  pilarCoverage: 'c',
  pilarEvidence: 'e',
  kkReference: 'KK-1',
  conclusion: 'Effective',
  comment: 'ok',
};

const CONTROL = { id: 'c1', controlId: 'c1', mappingId: 'm1' } as MatrixControl;

const RECORD = { id: 'rec-1', workflowStatus: 'In Review', workflowHistory: [], samples: [] };
const MATRIX = {
  items: [
    { id: 'a', controlId: 'c1', mappingId: 'm1' },
    { id: 'b', controlId: 'c1', mappingId: 'm2' },
    { id: 'c2', mappingId: 'm3' },
  ],
};

const rcmBodies: unknown[] = [];
const todBodies: unknown[] = [];
const failures = { rcm: null as Error | null, tod: null as Error | null };

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { invalidateSpy, wrapper };
}

function keyOf(call: unknown): string {
  return JSON.stringify((call as { queryKey: unknown }).queryKey);
}

function ownedInvalidations(spy: ReturnType<typeof vi.spyOn>, key: unknown[]): number {
  const want = JSON.stringify(key);
  return spy.mock.calls.filter((call) => keyOf(call[0]) === want).length;
}

const XLS_INPUT = {
  processName: 'Procure to Pay',
  bpmProcessId: 'proc-1',
  period: '2026-Q3',
  assessmentDate: new Date('2026-09-01T10:00:00').getTime(),
  result: 'Effective',
  comments: '',
  samples: [],
};

describe('csa-assessed-detail deep interface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rcmBodies.length = 0;
    todBodies.length = 0;
    failures.rcm = null;
    failures.tod = null;
    vi.mocked(useFiscalYearStore).mockReturnValue({ workingYear: '2026' } as ReturnType<typeof useFiscalYearStore>);
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/csa/rec-1') return Promise.resolve(RECORD);
      if (path.startsWith('/api/rcm-matrix/tlc?')) return Promise.resolve(MATRIX);
      if (path.startsWith('/api/tod-evaluations?')) return Promise.resolve({ items: [{ controlId: 'c1' }] });
      if (path === '/api/rcm-matrix/tlc/batch-update') {
        if (failures.rcm) return Promise.reject(failures.rcm);
        rcmBodies.push(init?.body);
        return Promise.resolve({});
      }
      if (path === '/api/tod-evaluations') {
        if (failures.tod) return Promise.reject(failures.tod);
        todBodies.push(init?.body);
        return Promise.resolve({});
      }
      return Promise.reject(new Error(`unexpected ${path}`));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the record and dedupes matrix controls on controlId||id', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.fullRecord).toBeDefined());
    expect(result.current.isRecordLoading).toBe(false);
    expect(result.current.controls).toHaveLength(2);
    expect(result.current.evaluations).toHaveLength(1);
  });

  it('does not fetch while collapsed', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: false }),
      { wrapper },
    );
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(result.current.fullRecord).toBeUndefined();
    expect(apiMock.mock.calls.some(([path]) => path === '/api/csa/rec-1')).toBe(false);
    expect(apiMock.mock.calls.some(([path]) => String(path).startsWith('/api/rcm-matrix/tlc?'))).toBe(false);
  });

  it('saveDual posts RCM then TOD and invalidates each owned key exact-once', async () => {
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.fullRecord).toBeDefined());

    await act(async () => {
      await result.current.saveDual(CONTROL, VALUES);
    });

    expect(rcmBodies).toHaveLength(1);
    expect(todBodies).toHaveLength(1);
    expect(JSON.parse(String(rcmBodies[0]))).toMatchObject({
      items: [{ mappingId: 'm1', controlName: 'Kontrol A' }],
    });
    expect(JSON.parse(String(todBodies[0]))).toMatchObject({ controlId: 'c1', conclusion: 'Effective' });
    const order = apiMock.mock.invocationCallOrder;
    const rcmAt = apiMock.mock.calls.findIndex(([path]) => path === '/api/rcm-matrix/tlc/batch-update');
    const todAt = apiMock.mock.calls.findIndex(([path]) => path === '/api/tod-evaluations');
    expect(order[rcmAt]).toBeLessThan(order[todAt]);
    expect(ownedInvalidations(invalidateSpy, ['csa-record-detail', 'rec-1'])).toBe(1);
    expect(ownedInvalidations(invalidateSpy, ['csa-worklist', '2026'])).toBe(1);
  });

  it('surfaces a second-write failure after the first write succeeded', async () => {
    failures.tod = new Error('tod down');
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.fullRecord).toBeDefined());

    await expect(act(async () => {
      await result.current.saveDual(CONTROL, VALUES);
    })).rejects.toThrow('tod down');

    expect(rcmBodies).toHaveLength(1);
    expect(ownedInvalidations(invalidateSpy, ['csa-record-detail', 'rec-1'])).toBe(1);
    expect(ownedInvalidations(invalidateSpy, ['csa-worklist', '2026'])).toBe(1);
  });

  it('skips the second write when the first write fails', async () => {
    failures.rcm = new Error('rcm down');
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.fullRecord).toBeDefined());

    await expect(act(async () => {
      await result.current.saveDual(CONTROL, VALUES);
    })).rejects.toThrow('rcm down');

    expect(todBodies).toHaveLength(0);
    expect(ownedInvalidations(invalidateSpy, ['csa-record-detail', 'rec-1'])).toBe(1);
    expect(ownedInvalidations(invalidateSpy, ['csa-worklist', '2026'])).toBe(1);
  });

  it('exportPdf downloads the blob with the record filename', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) });
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), configurable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      const { wrapper } = setup();
      const { result } = renderHook(
        () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: false }),
        { wrapper },
      );
      await act(async () => {
        await result.current.exportPdf({ processName: 'Proc', period: '2026-Q3', failureMessage: 'PDF gagal' });
      });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/csa/rec-1/export-pdf',
        expect.objectContaining({ headers: expect.objectContaining({ 'X-Mock-Role': expect.any(String) }) }),
      );
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(result.current.isExportingPdf).toBe(false);
      expect(document.body.querySelector('a')).toBeNull();
    } finally {
      clickSpy.mockRestore();
    }
  });

  it('exportPdf surfaces the failure message when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: false }),
      { wrapper },
    );
    await expect(act(async () => {
      await result.current.exportPdf({ processName: 'Proc', period: '2026-Q3', failureMessage: 'PDF gagal' });
    })).rejects.toThrow('PDF gagal');
    expect(result.current.isExportingPdf).toBe(false);
  });

  it('exportXls writes the workbook with the record filename', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useCsaAssessedDetail({ recordId: 'rec-1', bpmProcessId: 'proc-1', isExpanded: false }),
      { wrapper },
    );
    let exported = false;
    await act(async () => {
      exported = await result.current.exportXls(XLS_INPUT, () => {});
    });
    expect(exported).toBe(true);
    expect(exportCsaRecordToExcel).toHaveBeenCalledTimes(1);
    expect(vi.mocked(exportCsaRecordToExcel).mock.calls[0][0]).toMatchObject({
      filename: 'CSA_Report_Procure to Pay_2026-Q3.xlsx',
      processName: 'Procure to Pay',
    });
  });

  it('resolves workflow fallback Draft/In Review/Validated', () => {
    expect(resolveWorkflowStatus({ workflowStatus: 'X' })).toBe('X');
    expect(resolveWorkflowStatus({ line2Status: 'Validated' })).toBe('Validated');
    expect(resolveWorkflowStatus({ isDraft: true })).toBe('Draft');
    expect(resolveWorkflowStatus({})).toBe('In Review');
  });

  it('finds TOD evaluation by canonical controlId', () => {
    const list = [{ controlId: 'c1' }, { controlId: 'c2' }];
    expect(findTodEvaluation(list, { controlId: 'c2' })).toEqual({ controlId: 'c2' });
  });

  it('validates assessment dates', () => {
    expect(isValidAssessmentDate(new Date('2026-09-01T10:00:00'))).toBe(true);
    expect(isValidAssessmentDate('2026-09-01')).toBe(true);
    expect(isValidAssessmentDate('not-a-date')).toBe(false);
    expect(isValidAssessmentDate(undefined)).toBe(false);
  });
});
