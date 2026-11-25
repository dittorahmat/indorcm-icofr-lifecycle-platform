import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RCMControlMapping } from '@shared/types';
import { Edit3, ExternalLink, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMEditDialog } from '@/components/rcm/RCMEditDialog';
import { RCMImportWizardModal } from '@/components/rcm/import/RCMImportWizardModal';
import { RCM_NARRATIVE_WIDTHS } from '@/components/rcm/rcm-column-widths';
import { buildBpmDeepLinkUrl, formatBpmStepLabel } from '@/utils/bpm-link';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { RolloverPrompt } from '@/components/layout/RolloverPrompt';
import { RolloverCard } from '@/components/layout/RolloverCard';
import { exportRCMToExcel, getDefaultRcmSignoffs } from '@/lib/rcm-excel-export';
import {
  ASSERTION_CODE,
  ASSERTION_FIELDS,
  ASSERTION_TIP,
  IPO_CODE,
  IPO_FIELDS,
  IPO_TIP,
} from '@shared/assertion-fields';
import { BooleanIndicator } from '@/components/rcm/BooleanIndicator';
import { useRcmMatrixLifecycle } from './hooks/useRcmMatrixLifecycle';

interface RCMMatrixItem extends RCMControlMapping {
  mappingId: string;
  processName: string;
  bpmCode?: string;
  parentProcessName?: string;
  parentBpmCode?: string;
  fsliName: string;
  noGL: string;
  subProcessName: string;
  riskDescription: string;
  isFraudRelated: boolean;
  riskRating: string;
  controlCode: string;
  baseControlName: string;
  baseControlDescription: string;
  mappedControlName?: string;
  mappedControlDescription?: string;
  companyName: string;
  locationCode: string;
  automatedSubNature?: string | null;
}

interface RCMTLCPageProps {
  embedded?: boolean;
  filterBpmId?: string;
  workingYearOverride?: string;
  noGLFilter?: string;
}

export function RCMTLCPage({ embedded = false, filterBpmId, workingYearOverride, noGLFilter }: RCMTLCPageProps) {
  const { t } = useTranslation(['rcm', 'common', 'bpm']);
  const { workingYear: globalWorkingYear } = useFiscalYearStore();
  const workingYear = workingYearOverride || globalWorkingYear;
  
  const {
    searchTerm,
    setSearchTerm,
    editingItem,
    setEditingItem,
    isRolloverOpen,
    setIsRolloverOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    data: matrixData,
    isLoading,
    refresh,
    saveMutation,
    rolloverMutation,
  } = useRcmMatrixLifecycle<RCMMatrixItem>({
    tier: 'TLC',
    workingYear,
    filterBpmId,
    noGLFilter,
  });

  const items = matrixData?.items || [];
  const filteredItems = items.filter(item => 
    item.processName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.riskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.mappedControlName || item.baseControlName)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columnGroups: RCMColumnGroup[] = [
    {
      title: t('matrix.groups.process'),
      columns: [
        {
          id: 'action',
          header: 'Action',
          width: '60px',
          render: (row) => (
            <Button 
              variant="ghost" 
              size="xs" 
              className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => setEditingItem(row)}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )
        },
        { id: 'no', header: 'No', width: '50px', className: 'text-center font-mono text-xs text-slate-500 font-medium', render: (_, idx) => idx + 1 },
        { 
          id: 'process_info', 
          header: t('matrix.process_info', 'Proses Bisnis (Parent)'), 
          width: RCM_NARRATIVE_WIDTHS.processInfo, 
          className: 'text-xs text-slate-900',
          render: (row) => {
            const displayName = row.parentProcessName || row.processName;
            const code = row.parentBpmCode || row.bpmCode;
            return (
              <div className="flex flex-col gap-0.5 leading-snug">
                <span className="font-semibold text-xs text-slate-900 line-clamp-2">
                  {displayName}
                </span>
                {code && (
                  <span className="font-mono text-xs font-semibold text-indigo-700">
                    [{code}]
                  </span>
                )}
              </div>
            );
          }
        },
        { 
          id: 'sub_process', 
          header: t('matrix.sub_process', 'Sub-Proses (Child)'), 
          width: RCM_NARRATIVE_WIDTHS.subProcess, 
          className: 'text-xs text-slate-800 font-medium',
          render: (row) => (
            <span className="line-clamp-2 text-xs text-slate-800 font-medium leading-snug">
              {row.subProcessName || '-'}
            </span>
          )
        },
        {
          id: 'ref_bpm',
          header: t('matrix.ref_bpm', 'Ref Langkah BPM'),
          width: '130px',
          className: 'text-xs text-slate-800',
          render: (row) => {
            const hasLink = row.diagramId || row.nodeId;
            if (!hasLink) {
              return <span className="text-slate-400 font-mono text-xs">-</span>;
            }
            const displayLabel = formatBpmStepLabel(row.nodeId, 'BPM', 15);
            const targetUrl = buildBpmDeepLinkUrl(row.diagramId, row.nodeId);
            return (
              <Link
                to={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-900 px-2 py-0.5 rounded transition-colors"
                title={t('matrix.open_bpm_step', { defaultValue: 'Buka Simpul BPM di Tab Baru' })}
              >
                <span>{displayLabel}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            );
          }
        },
      ]
    },
    {
      title: t('matrix.groups.risk'),
      columns: [
        { id: 'company', header: t('matrix.company'), accessorKey: 'companyName', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'location', header: t('matrix.location'), accessorKey: 'locationCode', width: '110px', className: 'text-xs text-slate-700 font-mono text-center font-medium' },
        { id: 'risk_desc', header: t('matrix.risk_description'), accessorKey: 'riskDescription', width: RCM_NARRATIVE_WIDTHS.riskDesc, className: 'text-xs text-slate-800 font-normal leading-relaxed' },
        { 
          id: 'fraud', 
          header: 'Fraud', 
          width: '70px', 
          align: 'center',
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <BooleanIndicator value={row.isFraudRelated} tone="danger" />
          )
        },
        { 
          id: 'risk_rating', 
          header: t('matrix.risk_rating'), 
          width: '110px', 
          className: 'text-center text-xs font-medium text-slate-800',
          accessorKey: 'riskRating'
        },
      ]
    },
    {
      title: t('matrix.groups.control'),
      columns: [
        { id: 'control_ref', header: t('matrix.control_ref'), accessorKey: 'controlCode', width: '130px', className: 'font-mono text-xs font-semibold text-slate-700' },
        { id: 'control_name', header: t('matrix.control_name'), accessorKey: 'mappedControlName', width: RCM_NARRATIVE_WIDTHS.controlName, className: 'text-xs text-slate-900 font-medium leading-snug' },
        { id: 'control_desc', header: t('matrix.control_description'), accessorKey: 'mappedControlDescription', width: RCM_NARRATIVE_WIDTHS.controlDesc, className: 'text-xs text-slate-700 font-normal leading-relaxed' },
        { id: 'docs', header: t('matrix.supporting_docs'), accessorKey: 'supportingDocs', width: RCM_NARRATIVE_WIDTHS.supportingDocs, className: 'text-xs text-slate-700 font-normal' },
        { 
          id: 'is_key', 
          header: t('matrix.is_key_control'), 
          width: '90px', 
          align: 'center',
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <BooleanIndicator value={row.isKeyControl} tone="primary" />
          )
        },
      ]
    },
    {
      title: 'IPO',
      columns: IPO_FIELDS.map((field) => ({
        id: field,
        header: IPO_CODE[field],
        tooltip: t(`bpm:ipo.tooltip.${IPO_TIP[field]}.desc`),
        width: '50px',
        align: 'center' as const,
        className: 'text-center text-xs font-mono text-slate-700',
        render: (row) => (
          <BooleanIndicator value={row[field]} />
        ),
      }))
    },
    {
      title: t('matrix.assertions'),
      columns: ASSERTION_FIELDS.map((field) => ({
        id: field,
        header: ASSERTION_CODE[field],
        tooltip: t(`bpm:assertions.tooltip.${ASSERTION_TIP[field]}.desc`),
        width: '50px',
        align: 'center' as const,
        className: 'text-center text-xs font-mono text-slate-700',
        render: (row) => (
          <BooleanIndicator value={row[field]} />
        ),
      }))
    },
    {
      title: t('matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('matrix.type'), accessorKey: 'controlType', width: '160px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'nature', header: t('matrix.nature'), accessorKey: 'controlNature', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'auto_type', header: t('matrix.automated_type'), accessorKey: 'automatedSubNature', width: '200px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '130px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'app', header: t('matrix.supporting_app'), accessorKey: 'supportingApp', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'function', header: t('matrix.executing_function'), accessorKey: 'executingFunction', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'role', header: t('matrix.executor_role'), accessorKey: 'executorRole', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'fsli', header: t('matrix.affected_fsli_item'), accessorKey: 'affectedFsliItem', width: '220px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'period', header: t('matrix.effective_period'), accessorKey: 'effectivePeriod', width: '130px', className: 'text-center text-xs font-semibold text-indigo-700' },
      ]
    }
  ];


  const content = (
    <div className="flex flex-col min-w-0 max-w-full w-full flex-1 min-h-0 overflow-hidden">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:matrix.title_tlc')}
          subtitle={t('rcm:matrix.subtitle_tlc')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={refresh}
          onExport={() => exportRCMToExcel(filteredItems, {
            matrixType: 'TLC',
            filename: `RCM_TLC_Matrix_${workingYear}_${new Date().toISOString().split('T')[0]}.xlsx`,
            identityLines: [
              items[0]?.companyName || 'BUMN Holding',
              `Tahun Fiskal: ${workingYear}`,
              `Tanggal Ekspor: ${new Date().toISOString().split('T')[0]}`,
            ],
            signoffs: getDefaultRcmSignoffs('TLC'),
          })}
          exportLabel={t('rcm:actions.export_excel', 'Export Excel')}
          metadata={[
            { label: t('matrix.company'), value: items[0]?.companyName || "N/A" },
            { label: t('matrix.location'), value: items[0]?.locationCode || "N/A" }
          ]}
        >
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 border-indigo-300 h-9 sm:h-7 min-h-[44px] sm:min-h-0 text-xs font-bold shadow-sm"
          >
            <FileUp className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1.5 text-indigo-600" />
            {t('rcm:actions.import_rcm', { defaultValue: 'Import RCM' })}
          </Button>
        </RCMPageHeader>
      )}

      {items.length === 0 && !isLoading && (
        <RolloverCard
          workingYear={workingYear}
          onOpen={() => setIsRolloverOpen(true)}
          className="mx-6 mt-6"
        />
      )}

      <RCMTable 
        groups={columnGroups}
        data={filteredItems}
        isLoading={isLoading}
        minWidth="4920px"
      />

      <RCMEditDialog 
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        data={editingItem}
        onSave={(values) => saveMutation.mutate(values)}
        isSaving={saveMutation.isPending}
      />

      <RolloverPrompt 
        isOpen={isRolloverOpen}
        onClose={() => setIsRolloverOpen(false)}
        onConfirm={() => {
          rolloverMutation.mutate({
            sourceYear: (parseInt(workingYear) - 1).toString(),
            targetYear: workingYear
          });
        }}
        year={workingYear}
        prevYear={(parseInt(workingYear) - 1).toString()}
        isLoading={rolloverMutation.isPending}
      />

      <RCMImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workingYear={workingYear}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );

  if (embedded) return content;

  return (
    <AppLayout container={false} noScroll className="bg-slate-100/30">
      {content}
    </AppLayout>
  );
}

