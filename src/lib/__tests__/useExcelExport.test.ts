import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExcelExport } from '../useExcelExport';

describe('useExcelExport', () => {
  it('exports rows once and resets isExporting', async () => {
    const exportFn = vi.fn();
    const { result } = renderHook(() => useExcelExport<{ id: string }>());

    expect(result.current.isExporting).toBe(false);
    let ok = false;
    await act(async () => {
      ok = await result.current.exportNow({
        rows: [{ id: 'a' }],
        filename: 'test.xlsx',
        exportFn,
      });
    });
    expect(ok).toBe(true);
    expect(exportFn).toHaveBeenCalledTimes(1);
    expect(result.current.isExporting).toBe(false);
  });

  it('skips empty rows without calling exportFn', async () => {
    const exportFn = vi.fn();
    const { result } = renderHook(() => useExcelExport<{ id: string }>());
    let ok = true;
    await act(async () => {
      ok = await result.current.exportNow({ rows: [], filename: 'empty.xlsx', exportFn });
    });
    expect(ok).toBe(false);
    expect(exportFn).not.toHaveBeenCalled();
  });

  it('returns false and calls onError when exportFn throws', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useExcelExport<{ id: string }>());
    let ok = true;
    await act(async () => {
      ok = await result.current.exportNow({
        rows: [{ id: 'a' }],
        filename: 'fail.xlsx',
        exportFn: () => { throw new Error('boom'); },
        onError,
      });
    });
    expect(ok).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
