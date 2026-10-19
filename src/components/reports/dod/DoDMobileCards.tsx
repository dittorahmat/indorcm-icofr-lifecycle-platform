import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { formatIDR, getSeverityMeta } from './dod-format';
import type { FormattedDoDRow } from './dod-types';

interface DoDMobileCardsProps {
  rows: FormattedDoDRow[];
  showFullTable: boolean;
  onToggle: () => void;
}

export function DoDMobileCards({ rows, showFullTable, onToggle }: DoDMobileCardsProps) {
  const { t } = useTranslation(['reports', 'common']);

  return (
    <>
      <div className="md:hidden">
        <MobileDesktopBanner recordCount={rows.length} />
      </div>
      <div className="md:hidden space-y-3" data-testid="dod-mobile-cards">
        {rows.slice(0, 10).map((row) => {
          const sev = getSeverityMeta(row.severity);
          return (
            <div key={row.ref} className="rounded-lg border border-border bg-white p-4 space-y-2 shadow-sm">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900">{row.ref}</span>
                <Badge className={sev.className}>{t(sev.labelKey)}</Badge>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-snug line-clamp-2">{row.description}</p>
              <p className="text-xs font-mono font-bold text-primary">{formatIDR(row.exposureValue)}</p>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={onToggle}
          aria-expanded={showFullTable}
          className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
        >
          {showFullTable
            ? t('common:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' })
            : t('common:mobile.showFullTable', { defaultValue: 'Lihat Tabel Penuh' })}
        </Button>
      </div>
    </>
  );
}
