/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

interface UnsavedChangesContextType {
  isDirty: boolean;
  setDirty: (idOrDirty: string | boolean, dirty?: boolean) => void;
  resetDirty: (id?: string) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

/**
 * Provider to track "dirty" state (unsaved changes) globally.
 * Tracks dirty states per component/hook using keys to prevent conflicts.
 */
export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});

  const setDirty = useCallback((idOrDirty: string | boolean, dirty?: boolean) => {
    setDirtyKeys(prev => {
      let key = 'global';
      let value = false;

      if (typeof idOrDirty === 'boolean') {
        value = idOrDirty;
      } else {
        key = idOrDirty;
        value = !!dirty;
      }

      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const resetDirty = useCallback((id?: string) => {
    setDirtyKeys(prev => {
      const key = id || 'global';
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const isDirty = Object.values(dirtyKeys).some(Boolean);

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
