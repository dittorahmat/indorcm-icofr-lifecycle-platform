import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowRight, Layers, Replace } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { OcrAppendDirection, OcrImportMode } from './ocr-types';

interface OcrImportModeSelectorProps {
  importMode: OcrImportMode;
  appendDirection: OcrAppendDirection;
  onImportModeChange: (mode: OcrImportMode) => void;
  onAppendDirectionChange: (dir: OcrAppendDirection) => void;
  hasExistingNodes: boolean;
}

export function OcrImportModeSelector({
  importMode,
  appendDirection,
  onImportModeChange,
  onAppendDirectionChange,
  hasExistingNodes,
}: OcrImportModeSelectorProps) {
  const { t } = useTranslation(['bpm', 'common']);

  if (!hasExistingNodes) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-slate-50/70 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-800">
          {t('bpm:ocr.importMode.title')}
        </Label>
      </div>

      {/* Main Mode Selection (Overwrite vs Append) */}
      <RadioGroup
        value={importMode}
        onValueChange={(val) => onImportModeChange(val as OcrImportMode)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        <Label
          htmlFor="mode-overwrite"
          className={cn(
            'flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-all',
            importMode === 'overwrite'
              ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 text-slate-900'
              : 'border-border bg-white hover:bg-slate-50 text-slate-700'
          )}
        >
          <RadioGroupItem value="overwrite" id="mode-overwrite" className="mt-0.5 shrink-0" />
          <div className="space-y-1 select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Replace className="h-4 w-4 text-amber-600" />
              <span>{t('bpm:ocr.importMode.overwrite')}</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">
              {t('bpm:ocr.importMode.overwriteDesc')}
            </p>
          </div>
        </Label>

        <Label
          htmlFor="mode-append"
          className={cn(
            'flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-all',
            importMode === 'append'
              ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 text-slate-900'
              : 'border-border bg-white hover:bg-slate-50 text-slate-700'
          )}
        >
          <RadioGroupItem value="append" id="mode-append" className="mt-0.5 shrink-0" />
          <div className="space-y-1 select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>{t('bpm:ocr.importMode.append')}</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">
              {t('bpm:ocr.importMode.appendDesc')}
            </p>
          </div>
        </Label>

        <Label
          htmlFor="mode-new-sheet"
          className={cn(
            'flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-all sm:col-span-2',
            importMode === 'new_sheet'
              ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600 text-slate-900'
              : 'border-border bg-white hover:bg-slate-50 text-slate-700'
          )}
        >
          <RadioGroupItem value="new_sheet" id="mode-new-sheet" className="mt-0.5 shrink-0" />
          <div className="space-y-1 select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              <span>Multi-Sheet Baru (Lembar Terpisah)</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed">
              Buat sheet/halaman baru untuk hasil impor ini tanpa mengubah atau menimpa sheet yang sudah ada.
            </p>
          </div>
        </Label>
      </RadioGroup>


      {/* Sub-direction selection if Append is chosen */}
      {importMode === 'append' && (
        <div className="pt-2 border-t border-border/60 space-y-2">
          <Label className="text-xs font-medium text-slate-700">
            {t('bpm:ocr.importMode.directionTitle')}
          </Label>
          <RadioGroup
            value={appendDirection}
            onValueChange={(val) => onAppendDirectionChange(val as OcrAppendDirection)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            <Label
              htmlFor="dir-below"
              className={cn(
                'flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer transition-all',
                appendDirection === 'below'
                  ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600 text-slate-900'
                  : 'border-border bg-white hover:bg-slate-50 text-slate-700'
              )}
            >
              <RadioGroupItem value="below" id="dir-below" className="mt-0.5 shrink-0" />
              <div className="space-y-0.5 select-none">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t('bpm:ocr.importMode.directionBelow')}</span>
                </div>
                <p className="text-xs text-muted-foreground font-normal">
                  {t('bpm:ocr.importMode.directionBelowDesc')}
                </p>
              </div>
            </Label>

            <Label
              htmlFor="dir-right"
              className={cn(
                'flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer transition-all',
                appendDirection === 'right'
                  ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600 text-slate-900'
                  : 'border-border bg-white hover:bg-slate-50 text-slate-700'
              )}
            >
              <RadioGroupItem value="right" id="dir-right" className="mt-0.5 shrink-0" />
              <div className="space-y-0.5 select-none">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t('bpm:ocr.importMode.directionRight')}</span>
                </div>
                <p className="text-xs text-muted-foreground font-normal">
                  {t('bpm:ocr.importMode.directionRightDesc')}
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
