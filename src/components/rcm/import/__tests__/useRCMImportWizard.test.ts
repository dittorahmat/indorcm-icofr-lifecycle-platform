import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { strictT } from '@/test/mock-i18n';
import { useRCMImportWizard } from '../useRCMImportWizard';

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
const mockApi = vi.fn();

vi.mock('@/lib/api-client', () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseParams = {
  workingYear: '2025',
  onClose: () => {},
} as const;

describe('useRCMImportWizard initialFlavor preset', () => {
  it('defaults to TLC when no preset is given', () => {
    const { result } = renderHook(() => useRCMImportWizard({ ...baseParams }));
    expect(result.current.flavor).toBe('TLC');
  });

  it('starts with the ELC preset from the ELC matrix page', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ELC' }),
    );
    expect(result.current.flavor).toBe('ELC');
  });

  it('starts with the ITGC preset from the ITGC matrix page', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ITGC' }),
    );
    expect(result.current.flavor).toBe('ITGC');
  });

  it('still allows switching flavor inside the wizard', () => {
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, initialFlavor: 'ELC' }),
    );
    act(() => {
      result.current.setFlavor('ITGC');
    });
    expect(result.current.flavor).toBe('ITGC');
  });

  it('resyncs when the preset changes', () => {
    const { result, rerender } = renderHook(
      ({ preset }: { preset: 'ELC' | 'ITGC' }) =>
        useRCMImportWizard({ ...baseParams, initialFlavor: preset }),
      { initialProps: { preset: 'ELC' as const } },
    );
    expect(result.current.flavor).toBe('ELC');
    rerender({ preset: 'ITGC' });
    expect(result.current.flavor).toBe('ITGC');
  });

  it('resets to the page preset every time the dialog reopens', () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) =>
        useRCMImportWizard({ ...baseParams, initialFlavor: 'ELC', isOpen: open }),
      { initialProps: { open: false } },
    );
    rerender({ open: true });
    act(() => {
      result.current.setFlavor('TLC');
    });
    expect(result.current.flavor).toBe('TLC');
    rerender({ open: false });
    rerender({ open: true });
    expect(result.current.flavor).toBe('ELC');
  });

  it('invalidates bpm and rcm query keys on successful import submission', async () => {
    mockApi.mockResolvedValueOnce({
      success: true,
      summary: { createdControls: 4, createdNodeLinks: 2 },
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useRCMImportWizard({ ...baseParams, onClose, onSuccess })
    );

    const testFile = new File(
      [
        'No;Informasi_Proses_Bisnis;Informasi_Sub_proses_Bisnis;Risiko_Aktivitas_Pengendalian;Referensi_Pengendalian;Nama_Aktivitas_Pengendalian;Deskripsi_Aktivitas_Pengendalian;Frekuensi_Pengendalian;Dokumen_Pendukung;Fungsi_Pelaksana;Pelaku_Pengendalian;Periode_Efektif\n' +
        '1;Procurement;Vendor;Risk 1;CTRL-001;Control 1;Desc 1;Harian;Doc 1;Proc;Staff;2025'
      ],
      'test_rcm.csv',
      { type: 'text/csv' }
    );

    await act(async () => {
      await result.current.handleFileSelect(testFile);
    });

    expect(result.current.parsedRows.length).toBe(1);

    await act(async () => {
      await result.current.handleCommit();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['bpm-processes'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['bpm-diagrams'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['rcm'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['controls'] });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
