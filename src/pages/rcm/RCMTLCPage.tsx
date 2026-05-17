import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { 
  Search, RefreshCw, Edit3, AlertTriangle, Check, Shield
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

interface RCMMatrixItem extends RCMControlMapping {
  mappingId: string;
  processName: string;
  bpmCode?: string;
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
}

export function RCMTLCPage({ embedded = false, filterBpmId }: RCMTLCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<RCMMatrixItem | null>(null);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-tlc', filterBpmId],
    queryFn: async () => {
      const url = filterBpmId ? `/api/rcm-matrix/tlc?bpmProcessId=${filterBpmId}` : '/api/rcm-matrix/tlc';
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
        { id: 'no', header: 'No', width: '50px', className: 'text-center font-mono text-xs text-slate-400', render: (_, idx) => idx + 1 },
        { 
          id: 'process_info', 
          header: t('matrix.process_info'), 
          width: '260px', 
          className: 'font-bold text-slate-800',
          render: (row) => (
            <div className="flex flex-col gap-0 leading-tight">
              <span className="uppercase tracking-widest text-slate-900 text-xs font-black">
                {row.fsliName} {row.bpmCode && `[${row.bpmCode}]`}
              </span>
              <span className="line-clamp-2 text-xs">{row.noGL} - {row.processName}</span>
            </div>
          )
        },
        { id: 'sub_process', header: t('matrix.sub_process'), accessorKey: 'subProcessName', width: '200px', className: 'font-bold text-slate-600 text-xs' },
      ]
    },
    {
      title: t('matrix.groups.risk'),
      className: 'bg-rose-50/50',
      columns: [
        { id: 'company', header: t('matrix.company'), accessorKey: 'companyName', width: '180px', className: 'text-xs text-slate-600' },
        { id: 'location', header: t('matrix.location'), accessorKey: 'locationCode', width: '90px', className: 'text-xs text-slate-600 font-mono text-center' },
        { id: 'risk_desc', header: t('matrix.risk_description'), accessorKey: 'riskDescription', width: '380px', className: 'text-xs text-slate-700 leading-tight' },
        { 
          id: 'fraud', 
          header: 'Fraud', 
          width: '70px', 
          className: 'text-center',
          render: (row) => row.isFraudRelated && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 mx-auto" />
        },
        { 
          id: 'risk_rating', 
          header: t('matrix.risk_rating'), 
          width: '110px', 
          className: 'text-center',
          render: (row) => (
            <Badge className={cn("text-xs font-black px-2 h-5 leading-none uppercase", 
              row.riskRating === 'High' ? "bg-rose-50 text-rose-700 border-rose-200" : 
              row.riskRating === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" : 
              "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>{row.riskRating}</Badge>
          )
        },
      ]
    },
    {
      title: t('matrix.groups.control'),
      className: 'bg-indigo-50/50',
      columns: [
        { id: 'control_ref', header: t('matrix.control_ref'), accessorKey: 'controlCode', width: '130px', className: 'font-mono text-xs font-bold text-indigo-700' },
        { id: 'control_name', header: t('matrix.control_name'), accessorKey: 'mappedControlName', width: '320px', className: 'text-xs text-slate-800 font-bold' },
        { id: 'control_desc', header: t('matrix.control_description'), accessorKey: 'mappedControlDescription', width: '450px', className: 'text-xs text-slate-600 italic' },
        { id: 'docs', header: t('matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '220px', className: 'text-xs text-slate-500' },
        { 
          id: 'is_key', 
          header: t('matrix.is_key_control'), 
          width: '90px', 
          className: 'text-center',
          render: (row) => row.isKeyControl ? <Shield className="h-4 w-4 mx-auto text-indigo-600 fill-indigo-50" /> : <span className="text-slate-200">—</span>
        },
      ]
    },
    {
      title: 'IPO',
      className: 'bg-blue-600 text-white',
      columns: [
        { id: 'ipoC', header: 'C', width: '50px', className: 'text-center', render: (row) => row.ipoC ? '✓' : '—' },
        { id: 'ipoA', header: 'A', width: '50px', className: 'text-center', render: (row) => row.ipoA ? '✓' : '—' },
        { id: 'ipoV', header: 'V', width: '50px', className: 'text-center', render: (row) => row.ipoV ? '✓' : '—' },
        { id: 'ipoRa', header: 'RA', width: '50px', className: 'text-center', render: (row) => row.ipoRa ? '✓' : '—' },
      ]
    },
    {
      title: t('matrix.assertions'),
      className: 'bg-indigo-600 text-white',
      columns: [
        { id: 'ae', header: 'E/O', width: '50px', className: 'text-center', render: (row) => row.assertionE ? '✓' : '—' },
        { id: 'ac', header: 'C', width: '50px', className: 'text-center', render: (row) => row.assertionC ? '✓' : '—' },
        { id: 'aa', header: 'A', width: '50px', className: 'text-center', render: (row) => row.assertionA ? '✓' : '—' },
        { id: 'aco', header: 'CO', width: '50px', className: 'text-center', render: (row) => row.assertionCo ? '✓' : '—' },
        { id: 'aro', header: 'R&O', width: '50px', className: 'text-center', render: (row) => row.assertionRo ? '✓' : '—' },
        { id: 'ava', header: 'V/A', width: '50px', className: 'text-center', render: (row) => row.assertionVa ? '✓' : '—' },
        { id: 'apd', header: 'PD', width: '50px', className: 'text-center', render: (row) => row.assertionPd ? '✓' : '—' },
      ]
    },
    {
      title: t('matrix.groups.metadata'),
      columns: [
        { id: 'type', header: t('matrix.type'), accessorKey: 'controlType', width: '160px' },
        { id: 'nature', header: t('matrix.nature'), accessorKey: 'controlNature', width: '180px' },
        { id: 'auto_type', header: t('matrix.automated_type'), accessorKey: 'automatedSubNature', width: '200px' },
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '130px', className: 'text-center' },
        { id: 'app', header: t('matrix.supporting_app'), accessorKey: 'supportingApp', width: '180px' },
        { id: 'function', header: t('matrix.executing_function'), accessorKey: 'executingFunction', width: '180px' },
        { id: 'role', header: t('matrix.executor_role'), accessorKey: 'executorRole', width: '180px' },
        { id: 'fsli', header: t('matrix.affected_fsli_item'), accessorKey: 'affectedFsliItem', width: '220px', className: 'font-mono' },
        { id: 'period', header: t('matrix.effective_period'), accessorKey: 'effectivePeriod', width: '130px', className: 'text-center font-bold text-indigo-600' },
      ]
    }
  ];

  const renderGroupRow = (row: RCMMatrixItem, index: number, prevRow?: RCMMatrixItem) => {
    if (!prevRow || prevRow.processName !== row.processName) {
      return (
        <RCMGroupRow 
          key={`group-${row.processName}`} 
          title={`${row.noGL} - ${row.processName}`} 
          colSpan={35} 
        />
      );
    }
    return null;
  };

  const content = (
    <div className="flex flex-col min-w-0 flex-1 min-h-0">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:matrix.title_tlc')}
          subtitle={t('rcm:matrix.subtitle_tlc')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] })}
          metadata={[
            { label: t('matrix.company'), value: items[0]?.companyName || "N/A" },
            { label: t('matrix.location'), value: items[0]?.locationCode || "N/A" }
          ]}
        />
      )}

      <RCMTable 
        groups={columnGroups}
        data={filteredItems}
        isLoading={isLoading}
        renderGroupRow={renderGroupRow}
        minWidth="4800px"
      />

      <RCMEditDialog 
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        data={editingItem}
        onSave={(values) => saveMutation.mutate(values)}
        isSaving={saveMutation.isPending}
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

