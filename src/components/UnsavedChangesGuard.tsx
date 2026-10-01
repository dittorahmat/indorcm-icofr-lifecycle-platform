import React, { useEffect, useCallback } from 'react';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useLocation, useBlocker } from 'react-router-dom';

/**
 * Global guard component that intercepts navigation if there are unsaved changes.
 * Uses the global context to determine if the state is "dirty".
 */
export const UnsavedChangesGuard: React.FC = () => {
  const { isDirty, resetDirty } = useUnsavedChangesContext();
  const location = useLocation();
  
  // Define blocker callback based on global dirty state
  const blockerCallback = useCallback(
    ({ currentLocation, nextLocation }: any) => {
      if (!isDirty) return false;
      // If path is identical and only 'year' query parameter is being synchronized, do not block
      if (currentLocation.pathname === nextLocation.pathname) {
        const currentParams = new URLSearchParams(currentLocation.search);
        const nextParams = new URLSearchParams(nextLocation.search);
        // If the only difference is the 'year' param being added or synced
        const keys = new Set([...Array.from(currentParams.keys()), ...Array.from(nextParams.keys())]);
        const otherParamChanged = Array.from(keys).some(k => k !== 'year' && currentParams.get(k) !== nextParams.get(k));
        if (!otherParamChanged) {
          return false;
        }
      }
      return (
        currentLocation.pathname !== nextLocation.pathname || 
        currentLocation.search !== nextLocation.search
      );
    },
    [isDirty]
  );

  const blocker = useBlocker(blockerCallback);

  // Reset dirty state when we successfully navigate to a new location
  useEffect(() => {
    if (!isDirty) return;
    
    if (blocker.state === 'unblocked') {
       resetDirty();
    }
  }, [location.pathname, location.search, isDirty, blocker.state, resetDirty]);

  return <UnsavedChangesDialog blocker={blocker} />;
};
