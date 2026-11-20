import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { Control, TestRecord, Deficiency, User } from '@shared/types';
import { ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { useExcelExport } from '@/lib/useExcelExport';
import {
  buildTestingRows,
  testingColumns,
  toTestingExportRecord,
  type TestingResultRow,
} from '@/pages/reports/testing-rows';
import { isCoolingOffViolation } from '@shared/cooling-off';
import { motion, Variants } from 'framer-motion';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { TestingHeaderBanner } from '@/components/testing/workbench/TestingHeaderBanner';
import { TestingSummaryMetrics } from '@/components/testing/workbench/TestingSummaryMetrics';
import { TestingToolbar } from '@/components/testing/workbench/TestingToolbar';
import { TestingControlRow } from '@/components/testing/workbench/TestingControlRow';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export function TestWorkbench() {
  const { t } = useTranslation(['testing', 'reports']);
  const { workingYear } = useFiscalYearStore();
  const [showOnlyValidated, setShowOnlyValidated] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { isExporting: isExportingExcel, exportNow } = useExcelExport<TestingResultRow>();

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls', workingYear],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?year=${workingYear}`),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies', workingYear],
    queryFn: () => api<{ items: Deficiency[] }>(`/api/deficiencies?year=${workingYear}`),
  });

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['tests', workingYear],
    queryFn: () => api<{ items: TestRecord[] }>(`/api/tests?year=${workingYear}`),
  });

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const hasCoolingOff = (control: Control) =>
    isCoolingOffViolation(userData?.processOwnershipHistory, control.rcmId, Date.now());

  const isLoading = controlsLoading || deficienciesLoading || testsLoading;

  const allControls = controlsData?.items || [];
  const allTests = testsData?.items || [];
  const allDeficiencies = deficienciesData?.items || [];

  const testedControlIds = new Set(allTests.map((t) => t.controlId));
  const effectiveTests = allTests.filter((t) => t.result === 'Effective');
  const deviationTests = allTests.filter((t) => t.result === 'Ineffective');
  const validatedL2Controls = allControls.filter((c) => c.line2Validation?.status === 'Validated');

  const filteredControls = allControls.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = showOnlyValidated ? c.line2Validation?.status === 'Validated' : true;
    return matchesSearch && matchesFilter;
  });

  const handleExportExcel = async () => {
    const visibleIds = new Set(filteredControls.map((c) => c.id));
    const rows = buildTestingRows(
      allTests.filter((test) => visibleIds.has(test.controlId)),
      { controls: allControls, rcms: [] },
      { dateFormat: (timestamp) => format(timestamp, 'yyyy-MM-dd') },
    );

    await exportNow({
      rows,
      filename: `TOD_TOE_Kertas_Kerja_${workingYear || new Date().getFullYear()}.xlsx`,
      sheetName: t('title', { defaultValue: 'TOD & TOE' }),
      exportFn: async (exportRows, opts) => {
        const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
        await exportRegulatoryTableToExcel(exportRows.map(toTestingExportRecord), {
          title: t('title', { defaultValue: 'KERTAS KERJA TOD & TOE' }),
          subtitle: t('description', { defaultValue: '' }),
          identityLines: [String(workingYear || new Date().getFullYear())],
          columns: testingColumns((key) => t(key)),
          filename: opts.filename,
          sheetName: opts.sheetName,
        });
      },
    });
  };

  return (
    <AppLayout container>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto space-y-4 pb-6 md:pb-8"
      >
        {/* 1. Header Banner */}
        <motion.div variants={itemVariants}>
          <TestingHeaderBanner
            workingYear={workingYear}
            totalControls={allControls.length}
            testedCount={testedControlIds.size}
          />
        </motion.div>

        {/* 2. Working Paper Summary Cards */}
        <motion.div variants={itemVariants}>
          <TestingSummaryMetrics
            totalControls={allControls.length}
            testedCount={testedControlIds.size}
            effectiveCount={effectiveTests.length}
            deviationCount={deviationTests.length}
            validatedL2Count={validatedL2Controls.length}
          />
        </motion.div>

        {/* 3. Toolbar: Search, Validated Switch, Export Excel */}
        <motion.div variants={itemVariants}>
          <TestingToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showOnlyValidated={showOnlyValidated}
            onToggleValidated={setShowOnlyValidated}
            isExportingExcel={isExportingExcel}
            onExportExcel={handleExportExcel}
          />
        </motion.div>
        
        {/* 4. Control Row List */}
        <div className="space-y-3.5 sm:space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : filteredControls.length > 0 ? (
            filteredControls.map((control) => {
              const latestOpenDeficiency = allDeficiencies
                .filter((d) => d.controlId === control.id && d.status === 'Open')
                .sort((a, b) => ((b.identifiedDate || 0) as number) - ((a.identifiedDate || 0) as number))[0];

              const violation = hasCoolingOff(control);
              const controlHistory = allTests.filter((t) => t.controlId === control.id);
              const isExpanded = expandedId === control.id;

              return (
                <TestingControlRow
                  key={control.id}
                  control={control}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setExpandedId(isExpanded ? null : control.id)}
                  latestOpenDeficiency={latestOpenDeficiency}
                  hasCoolingOffViolation={violation}
                  controlHistory={controlHistory}
                  itemVariants={itemVariants}
                />
              );
            })
          ) : (
            <motion.div 
              variants={itemVariants}
              className="text-center py-16 sm:py-24 bg-white rounded-xl border border-dashed border-slate-200 shadow-xs p-6"
            >
              <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ListFilter className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t('noControls')}</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1.5 font-normal leading-relaxed">
                {t('noControlsDetail')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowOnlyValidated(false)}
                className="mt-6 border-slate-200 text-primary hover:bg-slate-50 rounded-lg font-bold text-xs uppercase tracking-wider h-10 px-5 min-h-[40px]"
              >
                Clear Filter
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}
