import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control, Organization } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, Check, Building2, Loader2, RefreshCw
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';

const COSO_PRINCIPLES = Array.from({ length: 17 }, (_, i) => i + 1);

export function RCMELCPage() {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('all');
  const [localMeta, setLocalMeta] = React.useState<Record<string, any>>({}); 

  // BACK TO BASICS: Use the single-table endpoint that is proven to be fast
  const { data: controlsData, isLoading: isLoadingControls, isFetching } = useQuery({
    queryKey: ['controls-elc'],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?level=ELC`),
    staleTime: 30000,
  });

  const { data: orgsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => api<{ organizations: Organization[] }>('/api/auth/organization/list'),
    staleTime: 300000,
  });

  const isDirty = React.useMemo(() => Object.keys(localMeta).length > 0, [localMeta]);
  const blocker = useUnsavedChanges(isDirty);

  // Map organization names locally (Bulletproof loading)
  const elcItems = React.useMemo(() => {
    const items = controlsData?.items || [];
    const orgs = orgsData?.organizations || [];
    
    const mapped = items.map(item => ({
      ...item,
      companyName: orgs.find(o => o.id === item.organizationId)?.name || 'N/A'
    }));

    if (selectedOrgId === 'all') return mapped;
    return mapped.filter(item => item.organizationId === selectedOrgId);
  }, [controlsData?.items, orgsData?.organizations, selectedOrgId]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['controls-elc'] });
  };

  return (
    <AppLayout container>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('matrix.title_elc')}</h1>
            <p className="text-muted-foreground italic text-sm">Entity Level Control Matrix (17 COSO Principles) according to SK-5 Lampiran 5 a.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
               <Building2 className="h-4 w-4 text-slate-400" />
               {isLoadingOrgs ? (
                 <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
               ) : (
                 <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger className="w-[200px] border-none focus:ring-0 h-7 text-xs font-bold">
                      <SelectValue placeholder={t('matrix.filter_subsidiary')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('matrix.filter_all')}</SelectItem>
                      {orgsData?.organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
               {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
               Refresh
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg" disabled={!isDirty}>
              <Save className="h-4 w-4 mr-2" /> {t('common:save')}
            </Button>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-x-auto relative min-h-[400px]">
          <TooltipProvider>
            <Table className="min-w-[1800px]">
              <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
                <TableRow className="divide-x border-b">
                  <TableHead className="w-[120px] font-black uppercase text-[10px] sticky left-0 z-30 bg-slate-50 border-r-2">{t('matrix.control_ref')}</TableHead>
                  <TableHead className="w-[350px] font-black uppercase text-[10px] sticky left-[120px] z-30 bg-slate-50 border-r-2">{t('matrix.control_description')}</TableHead>
                  <TableHead className="w-[100px] font-black uppercase text-[10px] text-center">{t('matrix.frequency')}</TableHead>
                  <TableHead className="w-[150px] font-black uppercase text-[10px]">{t('matrix.supporting_docs')}</TableHead>
                  <TableHead className="w-[150px] font-black uppercase text-[10px]">{t('matrix.executing_function')}</TableHead>
                  <TableHead className="w-[150px] font-black uppercase text-[10px]">{t('matrix.executor_role')}</TableHead>
                  <TableHead className="w-[100px] font-black uppercase text-[10px] text-center">{t('matrix.effective_period')}</TableHead>
                  
                  {COSO_PRINCIPLES.map(p => (
                    <TableHead key={p} className="w-[50px] p-0 font-black text-center group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help py-4 h-full flex items-center justify-center hover:bg-indigo-50 transition-colors">
                            <span className="text-[11px] text-indigo-600">{p}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] bg-indigo-900 text-white p-3 shadow-xl">
                          <p className="text-xs font-bold mb-1">Prinsip {p}</p>
                          <p className="text-[10px] leading-relaxed opacity-90">{t(`matrix.coso_tooltips.p${p}`)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingControls ? (
                  <TableRow><TableCell colSpan={24} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                       <span className="text-sm font-medium text-slate-500">Loading ELC data...</span>
                    </div>
                  </TableCell></TableRow>
                ) : elcItems.length === 0 ? (
                  <TableRow><TableCell colSpan={24} className="h-64 text-center text-slate-400 italic">Belum ada data Entity Level Control (ELC) untuk entitas ini.</TableCell></TableRow>
                ) : elcItems.map((ctrl) => (
                  <TableRow key={ctrl.id} className="group hover:bg-slate-50/50 transition-colors divide-x divide-slate-100 border-b">
                    <TableCell className="font-mono text-[10px] font-bold text-slate-500 sticky left-0 z-10 bg-white border-r-2">
                      {ctrl.code}
                    </TableCell>
                    <TableCell className="align-top py-4 sticky left-[120px] z-10 bg-white border-r-2 max-w-[350px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-800 leading-tight">{ctrl.name}</span>
                        <p className="text-[10px] text-slate-500 italic line-clamp-2">{ctrl.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-medium text-slate-600">
                      {ctrl.frequency || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 max-w-[150px] truncate">
                      {ctrl.supportingDocs || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500">
                      {(ctrl as any).companyName || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500">
                      {ctrl.executorRole || 'Control Owner'}
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-bold text-indigo-600">
                      {ctrl.effectiveDate ? new Date(ctrl.effectiveDate).getFullYear() : '-'}
                    </TableCell>
                    
                    {COSO_PRINCIPLES.map(p => {
                      const isMapped = ctrl.cosoPrinciples?.includes(p as any);
                      return (
                        <TableCell key={p} className={cn(
                          "text-center p-0",
                          isMapped ? "bg-emerald-50/30" : ""
                        )}>
                          <div className="flex items-center justify-center h-full min-h-[45px]">
                            {isMapped ? (
                              <Check className="h-4 w-4 text-emerald-600 stroke-[3px]" />
                            ) : (
                              <span className="text-slate-100">—</span>
                            )}
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
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
