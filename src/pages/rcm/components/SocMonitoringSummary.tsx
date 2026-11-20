import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Network, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SummaryId = 'valid' | 'expired' | 'vendors';
/** Literal union so a key typo is a `tsc` error (CODING_STANDARDS §data-carried keys). */
type SummaryLabelKey =
  | 'rcm:soc.summary.valid_reports'
  | 'rcm:soc.summary.expired_reports'
  | 'rcm:soc.summary.total_vendors';

interface SummaryItem {
  id: SummaryId;
  icon: LucideIcon;
  labelKey: SummaryLabelKey;
  label: string;
  cardClassName: string;
  titleClassName: string;
  valueClassName: string;
}

/** The three KPI cards, config-driven because the block repeated three times. */
const SUMMARY_ITEMS: readonly SummaryItem[] = [
  {
    id: 'valid',
    icon: ShieldCheck,
    labelKey: 'rcm:soc.summary.valid_reports',
    label: 'Valid Reports',
    cardClassName: 'bg-green-50 border-green-200 shadow-sm',
    titleClassName: 'text-green-800',
    valueClassName: 'text-green-900',
  },
  {
    id: 'expired',
    icon: AlertCircle,
    labelKey: 'rcm:soc.summary.expired_reports',
    label: 'Expired / Missing',
    cardClassName: 'bg-red-50 border-red-200 shadow-sm',
    titleClassName: 'text-red-800',
    valueClassName: 'text-red-900',
  },
  {
    id: 'vendors',
    icon: Network,
    labelKey: 'rcm:soc.summary.total_vendors',
    label: 'Total Vendors',
    cardClassName: 'bg-blue-50 border-blue-200 shadow-sm',
    titleClassName: 'text-blue-800',
    valueClassName: 'text-blue-900',
  },
];

interface SocMonitoringSummaryProps {
  validReports: number;
  expiredReports: number;
  totalVendors: number;
}

/** The SOC tab KPI row: valid reports, expired/missing reports, vendor count. */
export function SocMonitoringSummary({
  validReports,
  expiredReports,
  totalVendors,
}: SocMonitoringSummaryProps) {
  const { t } = useTranslation('rcm');
  const counts: Record<SummaryId, number> = {
    valid: validReports,
    expired: expiredReports,
    vendors: totalVendors,
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.id} className={item.cardClassName}>
            <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-1.5">
              <CardTitle className={cn('text-xs font-bold uppercase flex items-center gap-1.5', item.titleClassName)}>
                <Icon className="h-3.5 w-3.5" />
                {t(item.labelKey, { defaultValue: item.label })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className={cn('text-xl sm:text-2xl font-bold', item.valueClassName)}>{counts[item.id]}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
