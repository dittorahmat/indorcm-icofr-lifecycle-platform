import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useFiscalYearStore = create<FiscalYearState>()(
  persist(
    (set) => ({
      workingYear: getInitialYear(),
      setWorkingYear: (year: string) => {
        set({ workingYear: year });
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('year', year);
          window.history.replaceState({}, '', url.toString());
        }
      },
    }),
    {
      name: 'fiscal-year-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        if (typeof window === 'undefined') return currentState;
        
        const params = new URLSearchParams(window.location.search);
        const urlYear = params.get('year');
        
        // If URL has a year, it ALWAYS wins
        if (urlYear) {
          return {
            ...currentState,
            ...(persistedState as any),
            workingYear: urlYear
          };
        }
        
        // Otherwise use persisted state if it exists
        return {
          ...currentState,
          ...(persistedState as any)
        };
      }
    }
  )
);
