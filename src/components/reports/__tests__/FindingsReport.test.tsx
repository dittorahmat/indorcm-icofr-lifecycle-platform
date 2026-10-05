import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FindingsReport } from '../RegulatoryReportComponents';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';

vi.mock('@/lib/rcm-excel-export', () => ({
  exportRegulatoryTableToExcel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((opts: any) => {
    if (opts?.queryKey?.[0] === 'regulatory-change-logs') return { data: [], isLoading: false };
    if (opts?.queryKey?.[0] === 'users') return { data: { items: [] } };
    if (opts?.queryKey?.[0] === 'deficiencies') return { data: { items: [] } };
    return { data: undefined, isLoading: false };
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockResolvedValue({ items: [] }),
}));

const deficiencies = [
  {
    id: 'DEF-001',
    controlId: 'CTRL-001',
    description: 'Temuan uji satu',
    severity: 'Material Weakness',
    status: 'Open',
    source: 'Lini 3 - Audit',
    exposureValue: 1000000,
    identifiedBy: 'SPI',
    identifiedDate: Date.now(),
  },
];
const controls = [{ id: 'CTRL-001', code: 'PRC-001', name: 'Kontrol Uji' }];

describe('FindingsReport (Lampiran 9)', () => {
  it('renders deficiency rows resolved against controls', () => {
    render(<FindingsReport deficiencies={deficiencies} controls={controls} />);
    // Dual-render: mobile cards (block md:hidden) + desktop table (hidden md:block)
    // both render in jsdom, so shared values appear twice.
    expect(screen.getAllByText('DEF-001')).toHaveLength(2);
    expect(screen.getAllByText('Temuan uji satu')).toHaveLength(2);
    expect(screen.getByText('PRC-001 - Kontrol Uji')).toBeInTheDocument();
  });

  it('shows empty state when there are no deficiencies', () => {
    render(<FindingsReport deficiencies={[]} controls={[]} />);
    expect(screen.getAllByText('Belum ada data temuan.')).toHaveLength(2);
  });

  it('exports visible rows to a single-sheet Excel file', async () => {
    const mockedExport = vi.mocked(exportRegulatoryTableToExcel);
    mockedExport.mockClear();
    render(<FindingsReport deficiencies={deficiencies} controls={controls} />);

    fireEvent.click(screen.getByText('Ekspor Excel'));
    await waitFor(() => expect(mockedExport).toHaveBeenCalledTimes(1));
    const [rows, options] = mockedExport.mock.calls[0] as unknown as [any[], any];
    expect(rows).toHaveLength(1);
    expect(options.columns).toHaveLength(10);
    expect(options.filename).toMatch(/^Lampiran_9_Daftar_Temuan_\d+\.xlsx$/);
  });
});
