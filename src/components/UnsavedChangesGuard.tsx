import React, { useEffect } from 'react';
import { useUnsavedChanges } from '@/context/UnsavedChangesContext';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const UnsavedChangesGuard: React.FC = () => {
  const { isDirty } = useUnsavedChanges();
  const { t } = useTranslation('common');

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(t('unsavedChanges.description'));
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, t]);

  return null;
};
