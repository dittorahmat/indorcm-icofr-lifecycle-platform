import { ChevronDown, ChevronUp, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Control } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BPMWorksheetMobileCardsProps {
  controls: readonly Control[];
  isLoading: boolean;
  showFullTable: boolean;
  onToggleFullTable: () => void;
}

/**
 * Mobile summary cards for the worksheet (desktop keeps the react-table view).
 * Presentational only: the rows arrive already scoped by
 * `filterWorksheetControls` in the worksheet query.
 */
export function BPMWorksheetMobileCards({
  controls,
  isLoading,
  showFullTable,
  onToggleFullTable,
}: BPMWorksheetMobileCardsProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="md:hidden px-3 pt-3 space-y-3 max-h-[45vh] overflow-y-auto shrink-0" data-testid="bpm-worksheet-mobile-cards">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {t('bpm:mobile.worksheetSummary', { defaultValue: 'Ringkasan Worksheet' })}
      </p>
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-slate-400 font-medium">{t('bpm:mobile.loading')}</p>
        </div>
      ) : controls.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Info className="h-6 w-6 text-slate-300" />
          <p className="text-xs text-slate-400 font-medium">{t('bpm:mobile.empty')}</p>
        </div>
      ) : (
        <>
          {controls.map((control) => {
            const assertions = Array.isArray(control.assertions) ? control.assertions : [];
            return (
              <div key={control.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                    {control.code || '-'}
                  </span>
                  {control.isKeyControl && (
                    <Badge className="bg-indigo-600 text-white font-semibold text-xs shrink-0">
                      {t('bpm:mobile.keyControl', { defaultValue: 'Kontrol Utama' })}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{control.name || '-'}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {control.type && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{control.type}</span>
                  )}
                  {control.nature && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{control.nature}</span>
                  )}
                  {assertions.length > 0 && (
                    <span className="text-xs text-slate-500 font-medium">
                      {t('bpm:mobile.assertionsCount', { count: assertions.length, defaultValue: `${assertions.length} asersi` })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={onToggleFullTable}
            aria-expanded={showFullTable}
            className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
          >
            {showFullTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showFullTable
              ? t('bpm:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' })
              : t('bpm:mobile.fullTable', { defaultValue: 'Lihat Tabel Penuh' })}
          </Button>
        </>
      )}
    </div>
  );
}
