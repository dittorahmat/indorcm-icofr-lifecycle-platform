import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { DoDReportHeader } from './dod/DoDReportHeader';
import { DoDSummaryCards } from './dod/DoDSummaryCards';
import { DoDFilterBar } from './dod/DoDFilterBar';
import { DoDMobileCards } from './dod/DoDMobileCards';
import { DoDTable } from './dod/DoDTable';
import { DoDSignOff } from './dod/DoDSignOff';
import { useDoDReport } from './dod/useDoDReport';
import type { DoDLampiran10ReportProps } from './dod/dod-types';

export type { DoDLampiran10ReportProps };

export function DoDLampiran10Report({
  deficiencies = [],
  controls = [],
  fiscalYear = new Date().getFullYear(),
}: DoDLampiran10ReportProps) {
  const { t } = useTranslation(['reports', 'common']);
  const {
    filteredRows,
    counters,
    severityFilter,
    remediationFilter,
    searchQuery,
    showFullTable,
    isExporting,
    setSeverityFilter,
    setRemediationFilter,
    setSearchQuery,
    setShowFullTable,
    handlePrint,
    handleExportExcel,
  } = useDoDReport({ deficiencies, controls, fiscalYear, t });

  return (
    <Card className="border border-border shadow-sm rounded-lg bg-card">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <DoDReportHeader
          isExporting={isExporting}
          onExport={() => void handleExportExcel()}
          onPrint={handlePrint}
        />

        <DoDSummaryCards
          counters={counters}
          severityFilter={severityFilter}
          remediationFilter={remediationFilter}
          onSelectSeverity={setSeverityFilter}
          onSelectRemediation={setRemediationFilter}
          onResetAll={() => {
            setSeverityFilter('ALL');
            setRemediationFilter('ALL');
          }}
        />

        <DoDFilterBar
          searchQuery={searchQuery}
          severityFilter={severityFilter}
          remediationFilter={remediationFilter}
          onSearchChange={setSearchQuery}
          onSeverityChange={setSeverityFilter}
          onRemediationChange={setRemediationFilter}
        />

        <DoDMobileCards
          rows={filteredRows}
          showFullTable={showFullTable}
          onToggle={() => setShowFullTable((v) => !v)}
        />

        <DoDTable rows={filteredRows} showFullTable={showFullTable} />

        <DoDSignOff />
      </CardContent>
    </Card>
  );
}
