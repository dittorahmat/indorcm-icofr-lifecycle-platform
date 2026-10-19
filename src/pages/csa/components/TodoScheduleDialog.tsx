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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/use-confirm';

export interface TodoScheduleFormData {
  bpmProcessId: string;
  description: string;
  type: string;
  plannedDate: string;
  reminderConfig: { value: number; unit: string };
}

interface TodoScheduleDialogProps {
  isOpen: boolean;
  isEditMode: boolean;
  isDirty: boolean;
  formData: TodoScheduleFormData;
  onOpenChange: (open: boolean) => void;
  onUpdateFormData: (updates: Partial<TodoScheduleFormData>) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function TodoScheduleDialog({
  isOpen,
  isEditMode,
  isDirty,
  formData,
  onOpenChange,
  onUpdateFormData,
  onSubmit,
  onReset,
}: TodoScheduleDialogProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  const confirm = useConfirm();

  const handleOpenChange = async (open: boolean) => {
    if (!open && isDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('common:unsavedChanges.description'),
        confirmText: t('common:unsavedChanges.discard'),
        cancelText: t('common:unsavedChanges.stay'),
        variant: 'destructive',
      });
      if (ok) {
        onOpenChange(false);
        onReset();
      }
    } else {
      onOpenChange(open);
      if (!open) onReset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('csa_hub:actions.execute') : t('csa_hub:scheduling.newEvent')}
          </DialogTitle>
          <DialogDescription>{t('csa_hub:scheduling.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t('csa_hub:scheduling.activityType')}</Label>
            <Select value={formData.type} onValueChange={(v) => onUpdateFormData({ type: v })}>
              <SelectTrigger className="h-11 sm:h-10 min-h-[44px] sm:min-h-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSA">{t('csa_hub:scheduling.types.csa')}</SelectItem>
                <SelectItem value="TOD">{t('csa_hub:scheduling.types.tod')}</SelectItem>
                <SelectItem value="TOE">{t('csa_hub:scheduling.types.toe')}</SelectItem>
                <SelectItem value="REMEDIATION">{t('csa_hub:scheduling.types.remediation')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t('csa_hub:scheduling.detailActivity', { defaultValue: 'Activity Detail' })}</Label>
            <Input
              placeholder={t('csa_hub:scheduling.detailPlaceholder', { defaultValue: 'e.g. Weekly Review, Monthly Closing' })}
              value={formData.description}
              onChange={(e) => onUpdateFormData({ description: e.target.value })}
              className="text-base sm:text-sm h-11 sm:h-10 min-h-[44px] sm:min-h-0"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('csa_hub:scheduling.targetDate')}</Label>
            <Input
              type="date"
              value={formData.plannedDate}
              onChange={(e) => onUpdateFormData({ plannedDate: e.target.value })}
              className="text-base sm:text-sm h-11 sm:h-10 min-h-[44px] sm:min-h-0"
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
            onClick={onSubmit}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0 justify-center"
          >
            {t('csa_hub:scheduling.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
