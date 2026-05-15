import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, Organization } from '@shared/types';
import { Check, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMEditDialog } from '@/components/rcm/RCMEditDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COSO_PRINCIPLES = Array.from({ length: 17 }, (_, i) => i + 1);

export function RCMELCPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('all');
  const [editingItem, setEditingItem] = React.useState<any | null>(null);

  const { data: controlsData, isLoading: isLoadingControls } = useQuery({
    queryKey: ['controls-elc'],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?level=ELC`),
    staleTime: 30000,
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api<{ organizations: Organization[] }>('/api/auth/organization/list'),
    staleTime: 300000,
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => {
      // Reverse mapping: standardized UI names -> backend DB names
      const dbValues = {
        ...values,
        name: values.mappedControlName,
        description: values.mappedControlDescription,
      };
      
      const targetId = values.mappingId || values.id;
      
      return api(`/api/controls/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(dbValues)
      });
    },
    onSuccess: () => {
      toast.success(t('rcm:matrix.save_success'));
      queryClient.invalidateQueries({ queryKey: ['controls-elc'] });
      setEditingItem(null);
    }
  });

  const elcItems = React.useMemo(() => {
    const items = controlsData?.items || [];
    const orgs = orgsData?.organizations || [];
    const mapped = items.map((item, idx) => ({ 
      ...item, 
      no: idx + 1,
      mappingId: item.id, // For RCMTable key
      companyName: orgs.find(o => o.id === item.organizationId)?.name || 'N/A',
      mappedControlName: item.name,
      mappedControlDescription: item.description
    }));
    return selectedOrgId === 'all' ? mapped : mapped.filter(item => item.organizationId === selectedOrgId);
  }, [controlsData?.items, orgsData?.organizations, selectedOrgId]);

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
        { id: 'no', header: 'No', accessorKey: 'no', width: '50px', sticky: 'left', stickyOffset: '50px', className: 'text-center font-mono text-xs text-slate-400' },
        { id: 'code', header: t('matrix.control_ref'), accessorKey: 'code', width: '110px', sticky: 'left', stickyOffset: '100px', className: 'font-mono font-bold text-indigo-700' },
        { id: 'name', header: t('matrix.control_name'), accessorKey: 'name', width: '250px', className: 'font-bold text-slate-800' },
        { id: 'description', header: t('matrix.control_description'), accessorKey: 'description', width: '350px', className: 'italic text-slate-500 text-xs leading-tight line-clamp-2' },
      ]
    },
    {
      title: t('matrix.groups.control'),
      columns: [
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '90px', className: 'text-center font-medium' },
        { id: 'supportingDocs', header: t('matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '150px' },
        { id: 'companyName', header: t('matrix.executing_function'), accessorKey: 'companyName', width: '150px' },
        { id: 'executorRole', header: t('matrix.executor_role'), accessorKey: 'executorRole', width: '150px' },
        { 
          id: 'effectivePeriod', 
          header: t('matrix.effective_period'), 
          width: '100px', 
          className: 'text-center font-bold text-indigo-600',
          render: (row) => row.effectiveDate ? new Date(row.effectiveDate).getFullYear() : '-'
        },
      ]
    },
    {
      title: t('matrix.groups.compliance'),
      columns: COSO_PRINCIPLES.map(p => ({
        id: `coso-${p}`,
        header: `${p}`,
        width: '45px',
        className: 'p-0',
        headerClassName: 'text-center',
        tooltip: `Prinsip ${p}: ${t(`matrix.coso_tooltips.p${p}`)}`,
        render: (row) => {
          const isMapped = row.cosoPrinciples?.includes(p);
          return (
            <div className="flex items-center justify-center h-full">
              {isMapped ? <Check className="h-4 w-4 text-emerald-600 stroke-[3px]" /> : <span className="text-slate-200 text-xs">—</span>}
            </div>
          );
        }
      }))
    }
  ];

  const content = (
    <div className="flex flex-col min-w-0 flex-1">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:matrix.title_elc')}
          subtitle={t('rcm:matrix.subtitle_elc')}
          searchTerm=""
          onSearchChange={() => {}}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['controls-elc'] })}
        />
      )}
      <RCMTable 
        groups={columnGroups}
        data={elcItems}
        isLoading={isLoadingControls}
        minWidth="2200px"
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

