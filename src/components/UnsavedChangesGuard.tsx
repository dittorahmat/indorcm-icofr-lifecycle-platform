import React, { useEffect } from 'react';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useLocation } from 'react-router-dom';

/**
 * Global guard component that intercepts navigation if there are unsaved changes.
 * Uses the global context to determine if the state is "dirty".
 */
export const UnsavedChangesGuard: React.FC = () => {
  const { isDirty, resetDirty } = useUnsavedChangesContext();
  const location = useLocation();
  
  // Use the React Router blocker hook
  const blocker = useUnsavedChanges(isDirty);

  // Reset dirty state when we successfully navigate to a new location
  useEffect(() => {
    if (!isDirty) return;
    
    // If the blocker was active and we've moved (meaning proceed() was called),
    // or if we just want to be safe and reset on any successful navigation.
    // However, we only reset if we are NOT currently blocked.
    if (blocker.state === 'unblocked') {
       resetDirty();
    }
  }, [location.pathname, location.search, isDirty, blocker.state, resetDirty]);

  return <UnsavedChangesDialog blocker={blocker} />;
};
