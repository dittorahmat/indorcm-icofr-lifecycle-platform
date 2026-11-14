import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, Organization } from '@shared/types';
import { Check, Edit3 } from 'lucide-react';
import { FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { RCMTable, RCMColumnGroup } from '@/components/rcm/RCMTable';
import { RCMEditDialog } from '@/components/rcm/RCMEditDialog';
import { RCMImportWizardModal } from '@/components/rcm/import/RCMImportWizardModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { RolloverPrompt } from '@/components/layout/RolloverPrompt';
import { RolloverCard } from '@/components/layout/RolloverCard';
import { exportRCMToExcel, getDefaultRcmSignoffs } from '@/lib/rcm-excel-export';

const COSO_PRINCIPLES = Array.from({ length: 17 }, (_, i) => i + 1);

interface RCMELCPageProps {
  embedded?: boolean;
  workingYearOverride?: string;
  relevantFsli?: string;
}

export function RCMELCPage({ embedded = false, workingYearOverride, relevantFsli }: RCMELCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const { workingYear: globalYear } = useFiscalYearStore();
  const workingYear = workingYearOverride || globalYear;
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('all');
  const [editingItem, setEditingItem] = React.useState<any | null>(null);
  const [isRolloverOpen, setIsRolloverOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

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

  const { data: controlsData, isLoading: isLoadingControls } = useQuery({
    queryKey: ['controls-elc', workingYear, relevantFsli],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?level=ELC&year=${workingYear}`),
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
        { id: 'no', header: 'No', accessorKey: 'no', width: '50px', className: 'text-center font-mono text-xs text-slate-500 font-medium' },
        { id: 'code', header: t('matrix.control_ref'), accessorKey: 'code', width: '110px', className: 'font-mono text-xs font-semibold text-slate-700' },
        { id: 'name', header: t('matrix.control_name'), accessorKey: 'name', width: '250px', className: 'text-xs text-slate-900 font-medium leading-snug' },
        { id: 'description', header: t('matrix.control_description'), accessorKey: 'description', width: '350px', className: 'text-slate-700 text-xs font-normal leading-relaxed line-clamp-2' },
      ]
    },
    {
      title: t('matrix.groups.control'),
      columns: [
        { id: 'frequency', header: t('matrix.frequency'), accessorKey: 'frequency', width: '90px', className: 'text-center text-xs text-slate-800 font-medium' },
        { id: 'supportingDocs', header: t('matrix.supporting_docs'), accessorKey: 'supportingDocs', width: '150px', className: 'text-xs text-slate-700 font-normal' },
        { id: 'companyName', header: t('matrix.executing_function'), accessorKey: 'companyName', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { id: 'executorRole', header: t('matrix.executor_role'), accessorKey: 'executorRole', width: '150px', className: 'text-xs text-slate-800 font-normal' },
        { 
          id: 'effectivePeriod', 
          header: t('matrix.effective_period'), 
          width: '100px', 
          className: 'text-center text-xs font-semibold text-indigo-700',
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
        className: 'p-0 text-center',
        headerClassName: 'text-center',
        align: 'center',
        tooltip: `Prinsip ${p}: ${t(`matrix.coso_tooltips.p${p}`)}`,
        render: (row) => {
          const isMapped = row.cosoPrinciples?.includes(p);
          return (
            <div className="flex items-center justify-center h-full text-xs font-mono">
              <span className={isMapped ? "font-semibold text-emerald-700" : "text-slate-400 font-normal"}>
                {isMapped ? 'Y' : 'N'}
              </span>
            </div>
          );
        }
      }))
    }
  ];

  const content = (
    <div className="flex flex-col min-w-0 flex-1 min-h-0">
      {!embedded && (
        <RCMPageHeader 
          title={t('rcm:matrix.title_elc')}
          subtitle={t('rcm:matrix.subtitle_elc')}
          searchTerm=""
          onSearchChange={() => {}}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['controls-elc'] })}
          onExport={() => exportRCMToExcel(elcItems, {
            matrixType: 'ELC',
            filename: `RCM_ELC_Matrix_${workingYear}_${new Date().toISOString().split('T')[0]}.xlsx`,
            identityLines: [
              'BUMN Holding / Entitas Pelapor',
              `Tahun Fiskal: ${workingYear}`,
              `Tanggal Ekspor: ${new Date().toISOString().split('T')[0]}`,
            ],
            signoffs: getDefaultRcmSignoffs('ELC'),
          })}
          exportLabel={t('rcm:actions.export_excel', 'Export Excel')}
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
      {elcItems.length === 0 && !isLoadingControls && (
        <RolloverCard
          workingYear={workingYear}
          onOpen={() => setIsRolloverOpen(true)}
          className="mx-6 mt-6"
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
        initialFlavor="ELC"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['controls-elc'] });
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

