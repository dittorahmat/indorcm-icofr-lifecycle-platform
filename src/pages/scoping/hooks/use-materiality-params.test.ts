import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMaterialityParams } from './use-materiality-params';
import type { MaterialitySimulation } from '@shared/types';

const SIM = {
  id: 's1', basis: 'Kas dan Setara Kas', omPercentage: 5, haircutPercentage: 50,
} as MaterialitySimulation;

describe('use-materiality-params seam (draft vs active parameters)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const setSimState = vi.fn();
    const utils = renderHook(() => useMaterialityParams(SIM, setSimState));
    return { ...utils, setSimState };
  }

  it('starts clean with draft matching active', () => {
    const { result } = setup();
    expect(result.current.isStale).toBe(false);
    expect(result.current.isRecalculating).toBe(false);
  });

  it('flags stale on draft drift and applies recalculation', () => {
    const { result, setSimState } = setup();
    act(() => {
      result.current.setDraftOmPercentage(7);
    });
    expect(result.current.isStale).toBe(true);

    act(() => {
      result.current.handleRecalculate();
    });
    expect(result.current.isRecalculating).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isRecalculating).toBe(false);
    expect(result.current.isStale).toBe(false);
    expect(setSimState).toHaveBeenCalledTimes(1);
  });

  it('syncs every parameter back to a fresh simulation', () => {
    const { result } = setup();
    act(() => {
      result.current.setDraftBasis('Aset Tetap');
      result.current.syncTo({ ...SIM, basis: 'Persediaan', omPercentage: 3, haircutPercentage: 25 });
    });
    expect(result.current.draftBasis).toBe('Persediaan');
    expect(result.current.draftOmPercentage).toBe(3);
    expect(result.current.isStale).toBe(false);
  });
});
