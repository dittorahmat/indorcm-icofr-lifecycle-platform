import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, Organization } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Building2, Loader2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { RCMPageHeader } from '@/components/rcm/RCMPageHeader';
import { InlineEditRow } from '@/components/rcm/InlineEditRow';

const COSO_PRINCIPLES = Array.from({ length: 17 }, (_, i) => i + 1);

export function RCMELCPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('all');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: controlsData, isLoading: isLoadingControls, isFetching } = useQuery({
    queryKey: ['controls-elc'],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?level=ELC`),
    staleTime: 30000,
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api<{ organizations: Organization[] }>('/api/auth/organization/list'),
    staleTime: 300000,
  });

  const elcItems = React.useMemo(() => {
    const items = controlsData?.items || [];
    const orgs = orgsData?.organizations || [];
    const mapped = items.map(item => ({ ...item, companyName: orgs.find(o => o.id === item.organizationId)?.name || 'N/A' }));
    return selectedOrgId === 'all' ? mapped : mapped.filter(item => item.organizationId === selectedOrgId);
  }, [controlsData?.items, orgsData?.organizations, selectedOrgId]);

  const blocker = useUnsavedChanges(false);

  const content = (
    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {!embedded && (
        <RCMPageHeader 
          title={t('matrix.title_elc')}
          subtitle="Entity Level Control Matrix (17 COSO Principles) - SK-5 Lampiran 5 a."
          searchTerm=""
          onSearchChange={() => {}}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['controls-elc'] })}
        />
      )}
      <div className="flex-1 p-0">
        <div className="w-full border-t border-b bg-white border-slate-200 relative">
          <TooltipProvider>
            <Table className="min-w-[1800px] table-fixed border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-50 bg-slate-100">
                <TableRow className="divide-x divide-slate-200 h-10">
                  <TableHead className="w-[110px] font-black uppercase text-[10px] sticky left-0 z-[60] bg-slate-100 px-3">{t('matrix.control_ref')}</TableHead>
                  <TableHead className="w-[350px] font-black uppercase text-[10px] sticky left-[110px] z-[60] bg-slate-100 px-3">{t('matrix.control_description')}</TableHead>
                  <TableHead className="w-[90px] font-black uppercase text-[10px] text-center bg-slate-100">{t('matrix.frequency')}</TableHead>
                  <TableHead className="w-[140px] font-black uppercase text-[10px] bg-slate-100 px-3">{t('matrix.supporting_docs')}</TableHead>
                  <TableHead className="w-[140px] font-black uppercase text-[10px] bg-slate-100 px-3">{t('matrix.executing_function')}</TableHead>
                  <TableHead className="w-[140px] font-black uppercase text-[10px] bg-slate-100 px-3">{t('matrix.executor_role')}</TableHead>
                  <TableHead className="w-[90px] font-black uppercase text-[10px] text-center bg-slate-100">{t('matrix.effective_period')}</TableHead>
                  {COSO_PRINCIPLES.map(p => (
                    <TableHead key={p} className="w-[45px] p-0 font-black text-center group bg-slate-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help py-3 h-full flex items-center justify-center hover:bg-indigo-50 transition-colors">
                            <span className="text-[10px] text-indigo-600">{p}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] bg-indigo-900 text-white p-3 shadow-xl">
                          <p className="text-xs font-bold mb-1">Prinsip {p}</p>
                          <p className="text-[10px] leading-relaxed opacity-90">{t(`matrix.coso_tooltips.p${p}`)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px] font-black uppercase text-[10px] sticky right-0 z-[60] bg-slate-100">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elcItems.map((ctrl, index) => (
                  <TableRow key={ctrl.id} className="group transition-colors border-b border-slate-100 hover:bg-slate-50/50 h-11">
                    <TableCell className="sticky left-0 z-30 bg-white border-r border-slate-200">
                      <InlineEditRow 
                        isEditing={editingId === ctrl.id}
                        onEdit={() => setEditingId(ctrl.id)}
                        onSave={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                    </TableCell>
                    <TableCell className="align-top py-2 sticky left-[110px] z-30 border-r-2 border-slate-200 max-w-[350px] px-3 bg-white">
                      <div className="flex flex-col gap-0.5 leading-tight">
                        <span className="text-[10px] font-bold text-slate-800">{ctrl.name}</span>
                        <p className="text-[9px] text-slate-500 italic line-clamp-2">{ctrl.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-medium text-slate-600">{ctrl.frequency || '-'}</TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3 truncate">{ctrl.supportingDocs || '-'}</TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3">{ctrl.companyName || '-'}</TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3">{ctrl.executorRole || 'Control Owner'}</TableCell>
                    <TableCell className="text-center text-[10px] font-bold text-indigo-600">{ctrl.effectiveDate ? new Date(ctrl.effectiveDate).getFullYear() : '-'}</TableCell>
                    {COSO_PRINCIPLES.map(p => {
                      const isMapped = ctrl.cosoPrinciples?.includes(p as any);
                      return (
                        <TableCell key={p} className="text-center p-0">
                          <div className="flex items-center justify-center h-full min-h-[35px]">
                            {isMapped ? <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3px]" /> : <span className="text-slate-100 text-[9px]">—</span>}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout container={false} className="bg-slate-100/30">
      {content}
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
