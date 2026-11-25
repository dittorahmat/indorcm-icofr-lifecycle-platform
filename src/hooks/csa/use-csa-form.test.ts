import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCSAForm } from './use-csa-form';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCSAForm Zero Tolerance evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default Effective status and does NOT fire warning toast on pristine form', () => {
    const { result } = renderHook(() => useCSAForm());

    expect(result.current.form.getValues('result')).toBe('Effective');
    expect(result.current.anyPointFailed).toBe(false);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('does NOT fire toast or flip status when samples with implemented: true are added in pristine state', () => {
    const { result } = renderHook(() => useCSAForm());

    act(() => {
      result.current.replaceSamples([
        {
          sampleRef: 'TX-01',
          controlResults: {
            'ctrl-1': { implemented: true },
          },
        },
      ]);
    });

    expect(result.current.anyPointFailed).toBe(false);
    expect(result.current.form.getValues('result')).toBe('Effective');
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('fires Zero Tolerance toast and switches result to Ineffective when a control fails on a dirty form', () => {
    const { result } = renderHook(() => useCSAForm());

    // 1. Initial sample added
    act(() => {
      result.current.replaceSamples([
        {
          sampleRef: 'TX-01',
          controlResults: {
            'ctrl-1': { implemented: true },
          },
        },
      ]);
    });

    expect(toast.warning).not.toHaveBeenCalled();

    // 2. User marks a control as failed (form becomes dirty)
    act(() => {
      result.current.form.setValue(
        'samples.0.controlResults.ctrl-1.implemented',
        false,
        { shouldDirty: true }
      );
    });

    expect(result.current.anyPointFailed).toBe(true);
    expect(result.current.form.getValues('result')).toBe('Ineffective');
    expect(toast.warning).toHaveBeenCalledWith(
      'Zero Tolerance: Status diset ke Ineffective karena ada kontrol yang gagal.'
    );
  });
});
