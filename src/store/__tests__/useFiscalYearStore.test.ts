import { describe, it, expect, beforeEach } from 'vitest';
import { useFiscalYearStore } from '../useFiscalYearStore';

describe('useFiscalYearStore', () => {
  beforeEach(() => {
    useFiscalYearStore.setState({ workingYear: new Date().getFullYear().toString() });
  });

  it('should initialize with current year', () => {
    const { workingYear } = useFiscalYearStore.getState();
    expect(workingYear).toBe(new Date().getFullYear().toString());
  });

  it('should update working year', () => {
    const { setWorkingYear } = useFiscalYearStore.getState();
    setWorkingYear('2023');
    expect(useFiscalYearStore.getState().workingYear).toBe('2023');
  });

  it('should sync with URL search params', () => {
    const { setWorkingYear } = useFiscalYearStore.getState();
    setWorkingYear('2024');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('year')).toBe('2024');
  });

  it('should preserve setWorkingYear after merging with URL year', () => {
    const merge = useFiscalYearStore.persist.getOptions().merge;
    if (!merge) throw new Error('Merge function not found');

    const currentState = useFiscalYearStore.getState();
    const persistedState = { workingYear: '2023' };
    
    // Simulate URL with year
    const originalSearch = window.location.search;
    const url = new URL(window.location.href);
    url.searchParams.set('year', '2025');
    window.history.replaceState({}, '', url.toString());

    const mergedState = merge(persistedState, currentState) as any;
    
    expect(mergedState.workingYear).toBe('2025');
    expect(typeof mergedState.setWorkingYear).toBe('function');

    // Cleanup
    window.history.replaceState({}, '', originalSearch || '?');
  });
});
