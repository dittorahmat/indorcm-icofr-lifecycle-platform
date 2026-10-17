import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';

interface BPMWorksheetProcedurePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bpmCode: string;
  onBpmCodeChange: (value: string) => void;
  standardProcedure: string;
  onStandardProcedureChange: (value: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

/**
 * Standard test procedure + BPM code editor for the worksheet. Presentational:
 * the worksheet owns the draft state (and its unsaved-changes guard) and the
 * save mutation.
 */
export function BPMWorksheetProcedurePanel({
  isOpen,
  onOpenChange,
  bpmCode,
  onBpmCodeChange,
  standardProcedure,
  onStandardProcedureChange,
  isSaving,
  onSave,
}: BPMWorksheetProcedurePanelProps) {
  const { t } = useTranslation(['bpm']);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="bg-slate-50 border-b">
      <CollapsibleContent>
        <div className="p-4 space-y-3 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">{t('bpm:worksheet.bpmCodeLabel')}:</Label>
              <Input
                className="h-8 text-xs font-mono font-bold uppercase w-32 bg-white"
                placeholder={t('bpm:worksheet.bpmCodePlaceholder')}
                value={bpmCode}
                onChange={e => onBpmCodeChange(e.target.value)}
              />
              <div className="h-4 w-[1px] bg-slate-300 mx-2" />
              <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">{t('bpm:worksheet.standardLabel')}</Label>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-mancity-pattern hover:opacity-90 text-primary-foreground"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {t('bpm:worksheet.saveMetadata')}
            </Button>
          </div>
          <Textarea
            className="min-h-[120px] text-xs font-medium shadow-inner bg-white"
            placeholder={t('bpm:worksheet.procedurePlaceholder')}
            value={standardProcedure}
            onChange={e => onStandardProcedureChange(e.target.value)}
          />
          <p className="text-xs text-slate-400">{t('bpm:worksheet.procedureFootnote')}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
