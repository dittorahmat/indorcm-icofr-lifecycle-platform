import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/use-confirm';

export interface TodoRescheduleData {
  newDate: string;
  justification: string;
}

interface TodoRescheduleDialogProps {
  isOpen: boolean;
  isRescheduleDirty: boolean;
  rescheduleData: TodoRescheduleData;
  onOpenChange: (open: boolean) => void;
  onUpdateRescheduleData: (updates: Partial<TodoRescheduleData>) => void;
  onSubmit: () => void;
}

export function TodoRescheduleDialog({
  isOpen,
  isRescheduleDirty,
  rescheduleData,
  onOpenChange,
  onUpdateRescheduleData,
  onSubmit,
}: TodoRescheduleDialogProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  const confirm = useConfirm();

  const handleOpenChange = async (open: boolean) => {
    if (!open && isRescheduleDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('common:unsavedChanges.description'),
        confirmText: t('common:unsavedChanges.discard'),
        cancelText: t('common:unsavedChanges.stay'),
        variant: 'destructive',
      });
      if (ok) {
        onOpenChange(false);
      }
      return;
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t('csa_hub:scheduling.reschedule.title')}</DialogTitle>
          <DialogDescription>{t('csa_hub:scheduling.reschedule.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('csa_hub:scheduling.reschedule.newDate')}</Label>
            <Input
              type="date"
              value={rescheduleData.newDate}
              onChange={(e) => onUpdateRescheduleData({ newDate: e.target.value })}
              className="text-base sm:text-sm h-11 sm:h-10 min-h-[44px] sm:min-h-0"
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t('csa_hub:scheduling.reschedule.justification')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              className="min-h-[100px] text-base sm:text-sm"
              placeholder={t('csa_hub:scheduling.reschedule.placeholder')}
              value={rescheduleData.justification}
              onChange={(e) => onUpdateRescheduleData({ justification: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0 justify-center"
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={!rescheduleData.justification.trim() || !rescheduleData.newDate}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0 justify-center"
            onClick={onSubmit}
          >
            {t('csa_hub:scheduling.reschedule.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
