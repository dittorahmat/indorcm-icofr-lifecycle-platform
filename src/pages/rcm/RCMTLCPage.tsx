import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { 
  Search, RefreshCw, Edit3, AlertTriangle, Check, Shield, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMGroupRow } from '@/components/rcm/RCMGroupRow';
import { RCMEditDialog } from '@/components/rcm/RCMEditDialog';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { RolloverPrompt } from '@/components/layout/RolloverPrompt';
import { Card, CardContent } from '@/components/ui/card';
import { exportRCMToExcel } from '@/lib/rcm-excel-export';

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
  const queryClient = useQueryClient();
  const { workingYear: globalWorkingYear } = useFiscalYearStore();
  const workingYear = workingYearOverride || globalWorkingYear;
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<RCMMatrixItem | null>(null);
  const [isRolloverOpen, setIsRolloverOpen] = React.useState(false);

  const rolloverMutation = useMutation({
    mutationFn: (data: { sourceYear: string, targetYear: string, force?: boolean }) => 
      api('/api/migration/rollover', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(t('scoping:rollover.success'));
      setIsRolloverOpen(false);
    },
    onError: (err: any) => {
      toast.error(t('scoping:rollover.error', { error: err.message }));
    }
  });

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-tlc', filterBpmId, workingYear, noGLFilter],
    queryFn: async () => {
      let url = `/api/rcm-matrix/tlc?year=${workingYear}`;
      if (filterBpmId) url += `&bpmProcessId=${filterBpmId}`;
      if (noGLFilter) url += `&noGL=${noGLFilter}`;
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
      const booleanFields = [
        'ipoC', 'ipoA', 'ipoV', 'ipoRa',
        'assertionE', 'assertionC', 'assertionA', 'assertionCo', 'assertionVa', 'assertionRo', 'assertionPd'
      ];

      booleanFields.forEach(field => {
        if (typeof values[field] === 'boolean') {
          dbValues[field] = values[field] ? 'Y' : 'N';
        }
      });

      return api('/api/rcm-matrix/tlc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items: [dbValues] }) 
      });
    },
    onSuccess: () => {
      toast.success(t('rcm:matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] });
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
      className: 'bg-slate-200/50',
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
          header: t('matrix.process_info', 'Proses Bisnis (Parent)'), 
          width: '260px', 
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
          width: '220px', 
          className: 'text-xs text-slate-800 font-medium',
          render: (row) => (
            <span className="line-clamp-2 text-xs text-slate-800 font-medium leading-snug">
              {row.subProcessName || '-'}
            </span>
          )
        },
      ]
    },
    {
      title: t('matrix.groups.risk'),
      className: 'bg-rose-50/50',
      columns: [
        { id: 'company', header: t('matrix.company'), accessorKey: 'companyName', width: '180px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'location', header: t('matrix.location'), accessorKey: 'locationCode', width: '90px', className: 'text-xs text-slate-700 font-mono text-center font-medium' },
        { id: 'risk_desc', header: t('matrix.risk_description'), accessorKey: 'riskDescription', width: '380px', className: 'text-xs text-slate-800 font-normal leading-relaxed' },
        { 
          id: 'fraud', 
          header: 'Fraud', 
          width: '70px', 
          className: 'text-center text-xs font-mono',
          render: (row) => (
            <span className={cn(row.isFraudRelated ? "font-semibold text-rose-700" : "text-slate-400 font-normal")}>
              {row.isFraudRelated ? 'Y' : 'N'}
            </span>
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
      className: 'bg-indigo-50/50',
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
      title: 'IPO',
      className: 'bg-blue-600 text-white',
      columns: [
        { id: 'ipoC', header: 'C', tooltip: t('bpm:ipo.tooltip.c.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoC === 'Y' ? 'Y' : 'N' },
        { id: 'ipoA', header: 'A', tooltip: t('bpm:ipo.tooltip.a.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoA === 'Y' ? 'Y' : 'N' },
        { id: 'ipoV', header: 'V', tooltip: t('bpm:ipo.tooltip.v.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoV === 'Y' ? 'Y' : 'N' },
        { id: 'ipoRa', header: 'RA', tooltip: t('bpm:ipo.tooltip.ra.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.ipoRa === 'Y' ? 'Y' : 'N' },
      ]
    },
    {
      title: t('matrix.assertions'),
      className: 'bg-indigo-600 text-white',
      columns: [
        { id: 'ae', header: 'E/O', tooltip: t('bpm:assertions.tooltip.eo.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionE === 'Y' ? 'Y' : 'N' },
        { id: 'ac', header: 'C', tooltip: t('bpm:assertions.tooltip.c.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionC === 'Y' ? 'Y' : 'N' },
        { id: 'aa', header: 'A', tooltip: t('bpm:assertions.tooltip.a.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionA === 'Y' ? 'Y' : 'N' },
        { id: 'aco', header: 'CO', tooltip: t('bpm:assertions.tooltip.co.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionCo === 'Y' ? 'Y' : 'N' },
        { id: 'aro', header: 'R&O', tooltip: t('bpm:assertions.tooltip.ro.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionRo === 'Y' ? 'Y' : 'N' },
        { id: 'ava', header: 'V/A', tooltip: t('bpm:assertions.tooltip.va.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionVa === 'Y' ? 'Y' : 'N' },
        { id: 'apd', header: 'PD', tooltip: t('bpm:assertions.tooltip.pd.desc'), width: '50px', className: 'text-center text-xs font-mono text-slate-700', render: (row) => row.assertionPd === 'Y' ? 'Y' : 'N' },
      ]
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
        { id: 'fsli', header: t('matrix.affected_fsli_item'), accessorKey: 'affectedFsliItem', width: '220px', className: 'text-xs font-mono text-slate-600' },
        { id: 'period', header: t('matrix.effective_period'), accessorKey: 'effectivePeriod', width: '130px', className: 'text-center text-xs font-semibold text-indigo-700' },
      ]
    }
  ];


  const content = (
    <div className="flex flex-col min-w-0 flex-1 min-h-0">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:matrix.title_tlc')}
          subtitle={t('rcm:matrix.subtitle_tlc')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })}
          onExport={() => exportRCMToExcel(filteredItems, { matrixType: 'TLC', filename: `RCM_TLC_Matrix_${workingYear}_${new Date().toISOString().split('T')[0]}.xlsx` })}
          exportLabel={t('rcm:actions.export_excel', 'Export Excel')}
          metadata={[
            { label: t('matrix.company'), value: items[0]?.companyName || "N/A" },
            { label: t('matrix.location'), value: items[0]?.locationCode || "N/A" }
          ]}
        />
      )}

      {items.length === 0 && !isLoading && (
        <div className="p-6 pb-2">
          <Card className="bg-teal-50/50 border-teal-200/60 shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="bg-teal-500/10 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center text-teal-600 shrink-0">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-teal-900 text-sm">{t('scoping:rollover.title')}</h3>
                  <p className="text-xs text-teal-700/80 mt-1 max-w-2xl leading-relaxed">
                    {t('scoping:rollover.description', { year: workingYear, prevYear: (parseInt(workingYear) - 1).toString() })}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIsRolloverOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 h-9 rounded-xl shrink-0"
              >
                {t('scoping:rollover.confirm')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <RCMTable 
        groups={columnGroups}
        data={filteredItems}
        isLoading={isLoading}
        minWidth="4800px"
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
    </div>
  );

  if (embedded) return content;

  return (
    <AppLayout container={false} noScroll className="bg-slate-100/30">
      {content}
    </AppLayout>
  );
}

