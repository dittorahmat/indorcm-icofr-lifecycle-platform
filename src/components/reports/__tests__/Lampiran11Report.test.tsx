import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Lampiran11Report } from '../RegulatoryReportComponents';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';

vi.mock('@/lib/rcm-excel-export', () => ({
  exportRegulatoryTableToExcel: vi.fn(),
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((opts: any) => {
    if (opts?.queryKey?.[0] === 'report-settings-lamp11') {
      return { data: { isPeriodLocked: false }, isLoading: false };
    }
    if (opts?.queryKey?.[0] === 'regulatory-change-logs') return { data: [], isLoading: false };
    if (opts?.queryKey?.[0] === 'users') return { data: { items: [] } };
    return { data: undefined, isLoading: false };
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockResolvedValue({ items: [] }),
}));

const deficiencies = [
  { id: 'DEF-001', description: 'Kelemahan material kas', severity: 'Material Weakness', status: 'Open', exposureValue: 9000000 },
  { id: 'DEF-002', description: 'Defisiensi minor', severity: 'Control Deficiency', status: 'Remediated', exposureValue: 1000 },
];

describe('Lampiran11Report (Appendix 11)', () => {
  it('renders conclusion, aggregate counts, and significant findings only', () => {
    render(<Lampiran11Report deficiencies={deficiencies as any} controls={[]} />);
    expect(screen.getByText('Kesimpulan: Tidak Efektif')).toBeInTheDocument();
    expect(screen.getByText('CD: 1 | SD: 0 | MW: 1 | Total: 2')).toBeInTheDocument();
    // Dual-render: mobile cards + desktop table both render in jsdom.
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.queryByText('DEF-002')).not.toBeInTheDocument();
  });

  it('exports significant findings with sign-off context to Excel', async () => {
    const mockedExport = vi.mocked(exportRegulatoryTableToExcel);
    mockedExport.mockClear();
    render(<Lampiran11Report deficiencies={deficiencies as any} controls={[]} />);

    fireEvent.click(screen.getByText('Ekspor Excel'));
    await waitFor(() => expect(mockedExport).toHaveBeenCalledTimes(1));
    const [rows, options] = mockedExport.mock.calls[0] as unknown as [any[], any];
    expect(rows).toHaveLength(1);
    expect(options.columns).toHaveLength(6);
    expect(options.filename).toMatch(/^Lampiran_11_Asesmen_Manajemen_\d+\.xlsx$/);
    expect(options.identityLines).toHaveLength(5);
  });
});
