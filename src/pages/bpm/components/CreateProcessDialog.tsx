import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateProcessDialogProps {
  isOpen: boolean;
  noGL: string;
  name: string;
  onNameChange: (value: string) => void;
  code: string;
  onCodeChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

/** Create a top-level BPM process under the selected GL account. */
export function CreateProcessDialog({
  isOpen,
  noGL,
  name,
  onNameChange,
  code,
  onCodeChange,
  onCancel,
  onSubmit,
  isPending,
}: CreateProcessDialogProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px] w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto border-none shadow-2xl rounded-lg overflow-hidden p-0">
        <div className="bg-mancity-pattern p-4 sm:p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight text-primary-foreground">
              {t('createModalTitle')}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/60 text-xs uppercase tracking-wider mt-1">
              {t('createModalHint', { noGL })}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 px-1">
              {t('processNameLabel')}
            </Label>
            <Input
              placeholder={t('processNamePlaceholder')}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 px-1">
              {t('processCodeLabel')}
            </Label>
            <Input
              placeholder={t('processCodePlaceholder')}
              value={code}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold uppercase"
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              disabled={!name || !code || isPending}
              onClick={onSubmit}
              className="h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center px-6 bg-mancity-pattern hover:opacity-90 shadow-sm rounded-lg font-bold text-xs uppercase tracking-widest text-primary-foreground"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              {t('createProcessButton')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
