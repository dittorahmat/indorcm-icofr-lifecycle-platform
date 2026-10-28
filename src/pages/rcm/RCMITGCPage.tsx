import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { Edit3, Check, Shield } from 'lucide-react';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMEditDialog } from '@/components/rcm/RCMEditDialog';
import { RCMImportWizardModal } from '@/components/rcm/import/RCMImportWizardModal';
import { exportRCMToExcel, getDefaultRcmSignoffs } from '@/lib/rcm-excel-export';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { ASSERTION_FIELDS, IPO_FIELDS } from '@shared/assertion-fields';

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

interface RCMITGCPageProps {
  embedded?: boolean;
  filterBpmId?: string;
  workingYearOverride?: string;
}

export function RCMITGCPage({ embedded = false, filterBpmId, workingYearOverride }: RCMITGCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const { workingYear: globalWorkingYear } = useFiscalYearStore();
  const workingYear = workingYearOverride || globalWorkingYear;
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<RCMMatrixItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-itgc', filterBpmId, workingYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterBpmId) params.append('bpmProcessId', filterBpmId);
      if (workingYear) params.append('year', workingYear);
      const queryStr = params.toString();
      const url = queryStr ? `/api/rcm-matrix/itgc?${queryStr}` : '/api/rcm-matrix/itgc';
      const res = await api<{ items: RCMMatrixItem[] }>(url);
      return res;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      // 1. Reverse mapping: standardized UI names -> backend DB names
      const dbValues: any = {
        ...values,
        controlName: values.mappedControlName,
        controlDescription: values.mappedControlDescription,
      };

      // 2. Boolean normalization for IPO & Assertions (text columns in DB)
      const booleanFields = [...IPO_FIELDS, ...ASSERTION_FIELDS];

      booleanFields.forEach(field => {
        if (typeof values[field] === 'boolean') {
          dbValues[field] = values[field] ? 'Y' : 'N';
        }
      });

      return api('/api/rcm-matrix/itgc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items: [dbValues] }) 
      });
    },
    onSuccess: () => {
      toast.success(t('rcm:matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] });
      setEditingItem(null);
    }
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
          width: '50px',
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
          header: t('matrix.process_info'), 
          width: '260px', 
          className: 'text-xs text-slate-900',
          render: (row) => (
            <div className="flex flex-col gap-0.5 leading-snug">
              <span className="font-mono text-xs font-semibold text-slate-600">
                {row.fsliName} {row.bpmCode && `[${row.bpmCode}]`}
              </span>
              <span className="line-clamp-2 text-xs text-slate-900 font-medium">{row.noGL} - {row.processName}</span>
            </div>
          )
        },
        { id: 'sub_process', header: t('matrix.sub_process'), accessorKey: 'subProcessName', width: '200px', className: 'text-xs text-slate-800 font-medium' },
      ]
    },
    {
      title: t('matrix.groups.risk'),
      columns: [
        { id: 'company', header: t('matrix.company'), accessorKey: 'companyName', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'location', header: t('matrix.location'), accessorKey: 'locationCode', width: '90px', className: 'text-xs text-slate-700 font-mono text-center font-medium' },
        { id: 'risk_desc', header: t('matrix.risk_description'), accessorKey: 'riskDescription', width: '380px', className: 'text-xs text-slate-800 font-normal leading-relaxed' },
      ]
    },
    {
      title: t('matrix.groups.control'),
      columns: [
        { id: 'control_ref', header: t('matrix.control_ref'), accessorKey: 'controlCode', width: '130px', className: 'font-mono text-xs font-semibold text-slate-700' },
        { id: 'control_name', header: t('matrix.control_name'), accessorKey: 'mappedControlName', width: '320px', className: 'text-xs text-slate-900 font-medium leading-snug' },
        { id: 'control_desc', header: t('matrix.control_description'), accessorKey: 'mappedControlDescription', width: '450px', className: 'text-xs text-slate-700 font-normal leading-relaxed' },
        { id: 'docs', header: t('matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '220px', className: 'text-xs text-slate-700 font-normal' },
        { 
          id: 'is_key', 
          header: t('matrix.is_key_control'), 
          width: '90px', 
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <span className={cn(row.isKeyControl ? "font-semibold text-indigo-700" : "text-slate-400 font-normal")}>
              {row.isKeyControl ? 'Y' : 'N'}
            </span>
          )
        },
      ]
    },
    {
      title: t('matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('matrix.type'), accessorKey: 'controlType', width: '120px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'nature', header: t('matrix.nature'), accessorKey: 'controlNature', width: '120px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'auto_type', header: t('matrix.automated_type'), accessorKey: 'automatedSubNature', width: '180px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '130px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'app', header: t('matrix.supporting_app'), accessorKey: 'supportingApp', width: '160px', className: 'text-xs text-slate-800 font-normal text-center' },
        { id: 'function', header: t('matrix.executing_function'), accessorKey: 'executingFunction', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'role', header: t('matrix.executor_role'), accessorKey: 'executorRole', width: '160px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'period', header: t('matrix.effective_period'), accessorKey: 'effectivePeriod', width: '130px', className: 'text-center text-xs font-semibold text-indigo-700' },
      ]
    }
  ];

  const content = (
    <div className="flex flex-col min-w-0 flex-1 min-h-0">
      {!embedded && (
        <RCMPageHeader 
          title="RCM ITGC Matrix"
          subtitle={t('rcm:matrix.subtitle_itgc')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] })}
          onExport={() => exportRCMToExcel(filteredItems, {
            matrixType: 'ITGC',
            filename: `RCM_ITGC_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`,
            identityLines: [
              items[0]?.companyName || 'BUMN Holding',
              `Tahun Fiskal: ${new Date().getFullYear()}`,
              `Tanggal Ekspor: ${new Date().toISOString().split('T')[0]}`,
            ],
            signoffs: getDefaultRcmSignoffs('ITGC'),
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

      <RCMTable 
        groups={columnGroups}
        data={filteredItems}
        isLoading={isLoading}
        minWidth="3800px"
      />

      <RCMEditDialog 
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        data={editingItem}
        onSave={(values) => saveMutation.mutate(values)}
        isSaving={saveMutation.isPending}
      />

      <RCMImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workingYear={workingYear}
        initialFlavor="ITGC"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] });
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
