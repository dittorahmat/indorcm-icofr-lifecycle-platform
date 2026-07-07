import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface RolloverPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  year: string;
  prevYear: string;
  isLoading: boolean;
}

export function RolloverPrompt({
  isOpen,
  onClose,
  onConfirm,
  year,
  prevYear,
  isLoading,
}: RolloverPromptProps) {
  const { t } = useTranslation('scoping');

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="rounded-xl border border-slate-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold">
            {t('rollover.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-500 mt-2">
            {t('rollover.description', { year, prevYear })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={isLoading} className="rounded-lg">
            {t('rollover.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }} 
            disabled={isLoading}
            className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('rollover.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
