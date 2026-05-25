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
});
