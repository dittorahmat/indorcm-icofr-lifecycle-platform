import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollapsibleFilterCard } from '@/components/layout/CollapsibleFilterCard';

interface DoDFilterBarProps {
  searchQuery: string;
  severityFilter: string;
  remediationFilter: string;
  onSearchChange: (v: string) => void;
  onSeverityChange: (v: string) => void;
  onRemediationChange: (v: string) => void;
}

export function DoDFilterBar({
  searchQuery,
  severityFilter,
  remediationFilter,
  onSearchChange,
  onSeverityChange,
  onRemediationChange,
}: DoDFilterBarProps) {
  const { t } = useTranslation(['reports', 'common']);

  return (
    <CollapsibleFilterCard
      title={t('dodReport.filters.title')}
      layout="section"
      testId="dod-filters"
      className="print:hidden"
    >
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 print:hidden bg-muted/40 p-3 rounded-md border border-border">
        <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dodReport.filters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs font-medium rounded-md bg-background"
          />
        </div>

        <Select value={severityFilter} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs font-medium rounded-md bg-background">
            <SelectValue placeholder={t('dodReport.filters.allSeverities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">{t('dodReport.filters.allSeverities')}</SelectItem>
            <SelectItem value="Material Weakness" className="text-xs">{t('dodReport.filters.materialWeakness')}</SelectItem>
            <SelectItem value="Significant Deficiency" className="text-xs">{t('dodReport.filters.significantDeficiency')}</SelectItem>
            <SelectItem value="Control Deficiency" className="text-xs">{t('dodReport.filters.controlDeficiency')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={remediationFilter} onValueChange={onRemediationChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs font-medium rounded-md bg-background">
            <SelectValue placeholder={t('dodReport.filters.allRemediation')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">{t('dodReport.filters.allRemediation')}</SelectItem>
            <SelectItem value="REMEDIATED" className="text-xs">{t('dodReport.filters.remediated')}</SelectItem>
            <SelectItem value="NOT_REMEDIATED" className="text-xs">{t('dodReport.filters.notRemediated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CollapsibleFilterCard>
  );
}
