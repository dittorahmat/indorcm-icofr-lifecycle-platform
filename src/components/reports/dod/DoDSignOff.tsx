import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DoDSignOff() {
  const { t } = useTranslation(['reports', 'common']);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 max-w-2xl mx-auto print:max-w-full print:pt-4">
      <div className="border border-border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:bg-transparent">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('dodReport.signatures.preparerTitle')}
        </span>
        <div className="flex flex-col items-center gap-1 my-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <span className="text-xs font-bold text-foreground">Ketua Tim Audit Internal</span>
          <span className="text-xs text-muted-foreground">{t('dodReport.signatures.preparerRole')}</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {t('dodReport.signatures.verifiedDigital')}
        </span>
      </div>

      <div className="border border-border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:bg-transparent">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('dodReport.signatures.approverTitle')}
        </span>
        <div className="flex flex-col items-center gap-1 my-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <span className="text-xs font-bold text-foreground">Ketua Komite Audit</span>
          <span className="text-xs text-muted-foreground">{t('dodReport.signatures.approverRole')}</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {t('dodReport.signatures.verifiedDigital')}
        </span>
      </div>
    </div>
  );
}
