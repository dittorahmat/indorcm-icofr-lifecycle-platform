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
    ({ currentLocation, nextLocation }: any) =>
      isDirty && (
        currentLocation.pathname !== nextLocation.pathname || 
        currentLocation.search !== nextLocation.search
      ),
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
