import { useContext } from 'react';
import { ConfirmContext, ConfirmFunction } from '@/components/providers/ConfirmProvider';

export function useConfirm(): ConfirmFunction {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
