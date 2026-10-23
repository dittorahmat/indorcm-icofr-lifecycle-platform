import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Control, TestRecord } from '@shared/types';
import { definePageQueryMock, resetPageQueryStore } from '@/test/mock-page-queries';

type TestControl = Pick<
  Control,
  'id' | 'code' | 'name' | 'rcmId' | 'frequency' | 'nature' | 'line2Validation' | 'businessProcess' | 'subProcess'
>;
type TestTestRecord = Pick<
  TestRecord,
  'id' | 'controlId' | 'testType' | 'method' | 'result' | 'testDate' | 'sampleSize' | 'comments'
>;

// Mutable query backing store: per-test data without per-test mock plumbing.
const pageState = vi.hoisted(() => ({
  records: new Array<TestControl>(),
  processes: new Array<TestTestRecord>(),
  user: undefined as unknown,
}));

vi.mock('@tanstack/react-query', () =>
  definePageQueryMock(pageState, { recordsKey: 'controls', processesKey: 'tests' }),
);

vi.mock('@/lib/api-client', () => ({ api: vi.fn() }));

vi.mock('@/lib/rcm-excel-export', () => ({ exportRegulatoryTableToExcel: vi.fn() }));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, description, children }: { title: React.ReactNode; description?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/components/testing/ControlTestCard', () => ({
  ControlTestCard: () => <div data-testid="control-test-card" />,
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import { testingColumns } from '@/pages/reports/testing-rows';
import { TestWorkbench } from '../TestWorkbench';

const validatedControl: TestControl = {
  id: 'CTRL-1',
  code: 'PRC-01',
  name: 'Persetujuan Vendor',
  rcmId: 'RCM-1',
  frequency: 'Monthly',
  nature: 'Manual',
  line2Validation: { status: 'Validated' },
  businessProcess: 'Pengadaan',
  subProcess: 'Vendor',
};

const pendingControl: TestControl = {
  ...validatedControl,
  id: 'CTRL-2',
  code: 'PRC-02',
  name: 'Rekonsiliasi Bank',
  line2Validation: { status: 'Pending' },
};

const testRecordFixture: TestTestRecord = {
  id: 'TEST-1',
  controlId: 'CTRL-1',
  testType: 'TOD',
  method: 'Inquiry',
  result: 'Effective',
  testDate: 1700000000000,
  sampleSize: null,
  comments: null,
};

describe('TestWorkbench', () => {
  beforeEach(() => {
    resetPageQueryStore(pageState);
    vi.mocked(exportRegulatoryTableToExcel).mockClear();
  });

  it('renders one entry per Line-2 validated control', () => {
    pageState.records = [validatedControl, pendingControl];
    pageState.processes = [testRecordFixture];

    render(<TestWorkbench />);

    expect(screen.getByText('Persetujuan Vendor')).toBeInTheDocument();
    expect(screen.getByText('PRC-01')).toBeInTheDocument();
    expect(screen.queryByText('Rekonsiliasi Bank')).not.toBeInTheDocument();
  });

  it('reveals non-validated controls when the validated-only filter is switched off', () => {
    pageState.records = [validatedControl, pendingControl];

    render(<TestWorkbench />);
    expect(screen.queryByText('Rekonsiliasi Bank')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByText('Rekonsiliasi Bank')).toBeInTheDocument();
  });

  it('reads the search placeholder from the bundle instead of a dead fallback', () => {
    pageState.records = [validatedControl];
    render(<TestWorkbench />);

    // This was `t('searchPlaceholder') || "Search controls..."`: the `||` could
    // never fire, because a missing key makes i18next return the key itself — a
    // truthy string — so the raw key is what reached the user. strictT validates
    // the key against the en bundle, so a regression fails here.
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument();
  });

  it('blocks a process the signed-in user owned inside the Bab II window', () => {
    pageState.records = [validatedControl];
    pageState.user = {
      processOwnershipHistory: [
        { processId: 'RCM-1', role: 'Line 1', endDate: Date.now() - 24 * 60 * 60 * 1000 },
      ],
    };

    render(<TestWorkbench />);

    expect(screen.getByText('coolingOff.violation')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Persetujuan Vendor'));

    expect(screen.getByText('coolingOff.restricted')).toBeInTheDocument();
    expect(screen.getByText('coolingOff.contactAdmin')).toBeInTheDocument();
  });

  it('exports the ONE shared column set for the visible controls', async () => {
    pageState.records = [validatedControl, pendingControl];
    pageState.processes = [testRecordFixture];

    render(<TestWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: 'exportExcel' }));

    await waitFor(() => expect(vi.mocked(exportRegulatoryTableToExcel)).toHaveBeenCalledTimes(1));
    const [rows, options] = vi.mocked(exportRegulatoryTableToExcel).mock.calls[0];

    // Only the CTRL-1 test is exported (CTRL-2 is not Line-2 validated),
    // and the row comes from the shared builder (process from the control fallback).
    expect(rows).toHaveLength(1);
    expect(rows[0].control).toBe('PRC-01 - Persetujuan Vendor');
    expect(rows[0].process).toBe('Pengadaan / Vendor');

    // Parity: the page consumes the shared owner, not a private 7-column list.
    expect(options.columns).toEqual(testingColumns(strictT));
    expect(options.columns.map((c) => c.key)).toEqual([
      'no',
      'process',
      'control',
      'assertion',
      'type',
      'method',
      'criteria',
      'sample',
      'result',
      'notes',
      'date',
    ]);
    expect(options.filename).toBe(`TOD_TOE_Kertas_Kerja_${new Date().getFullYear()}.xlsx`);
  });
});
