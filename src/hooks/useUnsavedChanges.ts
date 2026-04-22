import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to warn users about unsaved changes before navigating away.
 * Handles both browser-level events (beforeunload) and internal routing (useBlocker).
 * 
 * @param isDirty - Boolean flag indicating if there are unsaved changes
 * @returns React Router blocker object for internal navigation management
 */
export function useUnsavedChanges(isDirty: boolean) {
  // 1. External navigation guard (Refresh, Tab Close, Back/Forward Browser)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Standard behavior for modern browsers is to ignore custom messages
        // but this returnValue is required to trigger the prompt.
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. Internal navigation guard (Sidebar, Links, Programmatic navigation)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && (
        currentLocation.pathname !== nextLocation.pathname || 
        currentLocation.search !== nextLocation.search
      )
  );

  return blocker;
}
