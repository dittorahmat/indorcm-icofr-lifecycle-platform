import { Download, Printer, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MOCK_COMPANY } from '../mock-regulatory-data';

interface DoDReportHeaderProps {
  isExporting: boolean;
  onExport: () => void;
  onPrint: () => void;
}

export function DoDReportHeader({ isExporting, onExport, onPrint }: DoDReportHeaderProps) {
  const { t } = useTranslation(['reports', 'common']);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary">
            {t('dodReport.title')}
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground">SK-5/DKU.MBU/11/2024</span>
        </div>
        <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
          {t('dodReport.subtitle')}
        </h2>
        <p className="text-xs text-muted-foreground font-medium">
          {MOCK_COMPANY} — {t('dodReport.regulationReference')}
        </p>
      </div>

      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 w-full md:w-auto shrink-0 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="text-xs font-semibold rounded-md h-11 min-[420px]:h-9 min-h-[44px] min-[420px]:min-h-0 w-full min-[420px]:w-auto justify-center gap-1.5"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('dodReport.exportExcel')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrint}
          className="text-xs font-semibold rounded-md h-11 min-[420px]:h-9 min-h-[44px] min-[420px]:min-h-0 w-full min-[420px]:w-auto justify-center gap-1.5"
        >
          <Printer className="h-4 w-4" />
          {t('dodReport.printA4')}
        </Button>
      </div>
    </div>
  );
}
