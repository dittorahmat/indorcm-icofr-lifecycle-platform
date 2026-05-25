import { create } from 'zustand';

interface FiscalYearState {
  workingYear: string;
  setWorkingYear: (year: string) => void;
}

// Helper to get initial year from URL or default to current year
const getInitialYear = () => {
  if (typeof window === 'undefined') return new Date().getFullYear().toString();
  const params = new URLSearchParams(window.location.search);
  return params.get('year') || new Date().getFullYear().toString();
};

export const useFiscalYearStore = create<FiscalYearState>((set) => ({
  workingYear: getInitialYear(),
  setWorkingYear: (year: string) => {
    // Sync with URL when year is set
    const url = new URL(window.location.href);
    url.searchParams.set('year', year);
    window.history.replaceState({}, '', url.toString());
    set({ workingYear: year });
  },
}));
