import { ChevronDown, ChevronUp, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorksheetRow } from './worksheet-row';

interface BPMWorksheetMobileCardsProps {
  rows: readonly WorksheetRow[];
  isLoading: boolean;
  showFullTable: boolean;
  onToggleFullTable: () => void;
}

/**
 * Mobile summary cards for the worksheet (desktop keeps the react-table view).
 * Presentational only: rows arrive through `toWorksheetRow`, the same row shape
 * the desktop columns read, and are already scoped by `filterWorksheetControls`
 * in the worksheet query.
 */
export function BPMWorksheetMobileCards({
  rows,
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
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Info className="h-6 w-6 text-slate-300" />
          <p className="text-xs text-slate-400 font-medium">{t('bpm:mobile.empty')}</p>
        </div>
      ) : (
        <>
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                  {row.code || '-'}
                </span>
                {row.isKeyControl && (
                  <Badge className="bg-indigo-600 text-white font-semibold text-xs shrink-0">
                    {t('bpm:mobile.keyControl', { defaultValue: 'Kontrol Utama' })}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{row.name || '-'}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {row.type && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{row.type}</span>
                )}
                {row.nature && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{row.nature}</span>
                )}
                {row.assertions.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {t('bpm:mobile.assertionsCount', { count: row.assertions.length, defaultValue: `${row.assertions.length} asersi` })}
                  </span>
                )}
              </div>
            </div>
          ))}
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
