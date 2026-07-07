import { useEffect, useId } from 'react';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';

/**
 * Hook to warn users about unsaved changes before navigating away.
 * Syncs the local "dirty" state to the global UnsavedChangesContext.
 * Handles browser-level events (beforeunload).
 * 
 * @param isDirty - Boolean flag indicating if there are unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  const { setDirty, resetDirty } = useUnsavedChangesContext();
  const id = useId();

  // 1. External navigation guard (Refresh, Tab Close, Back/Forward Browser)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. Sync local dirty state to global context
  useEffect(() => {
    setDirty(id, isDirty);
    
    // Cleanup on unmount: mark as not dirty
    return () => {
      resetDirty(id);
    };
  }, [id, isDirty, setDirty, resetDirty]);
}
