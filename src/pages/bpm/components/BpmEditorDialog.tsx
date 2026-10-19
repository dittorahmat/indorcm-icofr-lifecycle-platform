import { Workflow as WorkflowIcon, X as XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BPMEditor } from '@/components/rcm/BPMEditor';

interface BpmEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subProcess: string;
  diagramId: string | null;
  viewYear: string;
  currentGL?: string;
  bpmProcessId?: string;
}

/** Full-screen shell around the BPM canvas editor. */
export function BpmEditorDialog({
  isOpen,
  onClose,
  subProcess,
  diagramId,
  viewYear,
  currentGL,
  bpmProcessId,
}: BpmEditorDialogProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-[98vw] h-[92dvh] sm:h-[95dvh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-lg">
        <DialogTitle className="sr-only">{t('editor.dialogTitle', { name: subProcess })}</DialogTitle>
        <DialogDescription className="sr-only">{t('editor.dialogDescription')}</DialogDescription>
        <div className="bg-mancity-pattern p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-primary-foreground">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <div className="h-9 w-9 rounded-md bg-white/20 flex items-center justify-center text-primary-foreground border border-white/30 shrink-0">
                <WorkflowIcon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-primary-foreground truncate">
                {t('editor.dialogTitle', { name: subProcess })}
              </h2>
            </div>
            <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider ml-0 sm:ml-[48px]">
              {t('editor.dialogSubtitle')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t('common:actions.close')}
            className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 rounded-md h-11 w-11 min-h-[44px] min-w-[44px] self-end sm:self-auto shrink-0"
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 bg-slate-50">
          {diagramId && (
            <BPMEditor
              diagramId={diagramId}
              subProcess={subProcess}
              workingYear={viewYear}
              currentGL={currentGL}
              bpmProcessId={bpmProcessId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
