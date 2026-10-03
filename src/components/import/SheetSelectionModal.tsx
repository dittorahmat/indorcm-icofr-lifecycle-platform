import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { SheetCandidate } from '@/pages/scoping/services/gl-parser';
import { cn } from '@/lib/utils';

interface SheetSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  sheets: SheetCandidate[];
  onSelectSheet: (sheetName: string) => void;
}

export function SheetSelectionModal({
  isOpen,
  onOpenChange,
  fileName,
  sheets,
  onSelectSheet
}: SheetSelectionModalProps) {
  const { t } = useTranslation(['scoping', 'common']);
  const [selected, setSelected] = React.useState<string>(() => {
    const validOne = sheets.find(s => s.isValid);
    return validOne ? validOne.name : (sheets[0]?.name || '');
  });

  React.useEffect(() => {
    if (isOpen) {
      const validOne = sheets.find(s => s.isValid);
      setSelected(validOne ? validOne.name : (sheets[0]?.name || ''));
    }
  }, [isOpen, sheets]);

  const handleConfirm = () => {
    if (selected) {
      onSelectSheet(selected);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-lg border border-border bg-background p-4 sm:p-6 shadow-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t('scoping:sheetSelection.title', 'Pilih Lembar Kerja (Worksheet)')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('scoping:sheetSelection.description', 'File "{{file}}" memiliki beberapa lembar kerja. Pilih lembar kerja yang memuat data Trial Balance / General Ledger.', { file: fileName })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {sheets.map((sheet) => {
            const isChosen = selected === sheet.name;
            return (
              <div
                key={sheet.name}
                onClick={() => setSelected(sheet.name)}
                className={cn(
                  "cursor-pointer rounded-md border p-3.5 transition-all text-left flex items-start justify-between gap-3 flex-wrap min-w-0",
                  isChosen
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-slate-300 hover:bg-slate-50/60"
                )}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                    sheet.isValid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{sheet.name}</span>
                      {sheet.isValid ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t('scoping:sheetSelection.compliant', 'Sesuai Template')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {t('scoping:sheetSelection.incomplete', 'Kolom Tidak Lengkap')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sheet.rowCount} {t('scoping:sheetSelection.rows', 'baris terdeteksi')}
                      {!sheet.isValid && sheet.missingColumns.length > 0 && (
                        <span> • {t('scoping:sheetSelection.missing', 'Kurang: ')}{sheet.missingColumns.join(', ')}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-1">
                  <div className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center transition-all",
                    isChosen ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                  )}>
                    {isChosen && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs font-semibold rounded-md h-11 sm:h-9 min-h-[44px] sm:min-h-0"
          >
            {t('common:actions.cancel', 'Batal')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
            className="w-full sm:w-auto text-xs font-semibold rounded-md h-11 sm:h-9 min-h-[44px] sm:min-h-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t('scoping:sheetSelection.proceed', 'Lanjutkan dengan Lembar Ini')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
