/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface UnsavedChangesContextType {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  resetDirty: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

/**
 * Provider to track "dirty" state (unsaved changes) globally.
 * Allows components to signal that they have unsaved data.
 */
export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDirty, setIsDirty] = useState(false);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty, resetDirty }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};

/**
 * Hook to access the global unsaved changes state.
 * Use this to set isDirty to true when a form is modified.
 */
export const useUnsavedChangesContext = () => {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChangesContext must be used within an UnsavedChangesProvider');
  }
  return context;
};
