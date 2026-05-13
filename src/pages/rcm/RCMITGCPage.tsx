import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { RCMControlMapping } from '@shared/types';
import { Edit3, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface RCMITGCPageProps {
  embedded?: boolean;
  filterBpmId?: string;
}

export function RCMITGCPage({ embedded = false, filterBpmId }: RCMITGCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingItem, setEditingItem] = React.useState<RCMMatrixItem | null>(null);

  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['rcm-matrix-itgc', filterBpmId],
    queryFn: async () => {
      const url = filterBpmId ? `/api/rcm-matrix/itgc?bpmProcessId=${filterBpmId}` : '/api/rcm-matrix/itgc';
      const res = await api<{ items: RCMMatrixItem[] }>(url);
      return res;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => 
      api('/api/rcm-matrix/itgc/batch-update', { 
        method: 'POST', 
        body: JSON.stringify({ items: [values] }) 
      }),
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
          sticky: 'left',
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
        { id: 'no', header: 'No', width: '50px', sticky: 'left', stickyOffset: '50px', className: 'text-center font-mono text-[11px] text-slate-400', render: (_, idx) => idx + 1 },
        { 
          id: 'process_info', 
          header: t('matrix.process_info'), 
          width: '260px', 
          sticky: 'left', 
          stickyOffset: '100px',
          className: 'font-bold text-slate-800',
          render: (row) => (
            <div className="flex flex-col gap-0 leading-tight">
              <span className="uppercase tracking-tighter text-indigo-600 text-[9px] font-black">
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
      columns: [
        { id: 'company', header: t('matrix.company'), accessorKey: 'companyName', width: '180px', className: 'text-xs text-slate-600' },
        { id: 'location', header: t('matrix.location'), accessorKey: 'locationCode', width: '90px', className: 'text-xs text-slate-600 text-center' },
        { id: 'risk_desc', header: t('matrix.risk_description'), accessorKey: 'riskDescription', width: '380px', className: 'text-xs text-slate-700' },
      ]
    },
    {
      title: t('matrix.groups.control'),
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
      title: t('matrix.groups.metadata'),
      columns: [
        { id: 'type', header: 'Prev/Det', accessorKey: 'controlType', width: '120px', className: 'text-center' },
        { id: 'nature', header: 'Sifat', accessorKey: 'controlNature', width: '120px', className: 'text-center' },
        { id: 'auto_type', header: t('matrix.automated_type'), accessorKey: 'automatedSubNature', width: '180px', className: 'text-center' },
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '130px', className: 'text-center' },
        { id: 'app', header: 'Aplikasi', accessorKey: 'supportingApp', width: '160px', className: 'text-center' },
        { id: 'function', header: t('matrix.executing_function'), accessorKey: 'executingFunction', width: '180px' },
        { id: 'role', header: 'Pelaku', accessorKey: 'executorRole', width: '160px' },
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
          colSpan={20} 
        />
      );
    }
    return null;
  };

  const content = (
    <div className="flex flex-col min-w-0 h-screen">
      {!embedded && (
        <RCMPageHeader 
          title="RCM ITGC Matrix"
          subtitle={t('rcm:matrix.subtitle_itgc')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rcm-matrix-itgc'] })}
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
        minWidth="3800px"
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

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      {content}
    </AppLayout>
  );
}
