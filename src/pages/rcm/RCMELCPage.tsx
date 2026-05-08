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

interface RCMELCPageProps {
  embedded?: boolean;
}

export function RCMELCPage({ embedded = false }: RCMELCPageProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('all');
  const [localMeta, setLocalMeta] = React.useState<Record<string, any>>({}); 

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

  const content = (
    <div className="flex flex-col h-full overflow-hidden max-w-full">
      {!embedded && (
        <div className="p-4 pb-2 space-y-3 shrink-0 bg-white/80 backdrop-blur-md border-b z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">{t('matrix.title_elc')}</h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Entity Level Control Matrix (17 COSO Principles) - SK-5 Lampiran 5 a.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1 shadow-sm">
                 <Building2 className="h-3 w-3 text-slate-400" />
                 {isLoadingOrgs ? (
                   <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                 ) : (
                   <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                      <SelectTrigger className="w-[180px] border-none focus:ring-0 h-6 text-[10px] font-bold">
                        <SelectValue placeholder={t('matrix.filter_subsidiary')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-[10px]">{t('matrix.filter_all')}</SelectItem>
                        {orgsData?.organizations.map(org => (
                          <SelectItem key={org.id} value={org.id} className="text-[10px]">{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 )}
              </div>
              <Button variant="outline" size="xs" onClick={handleRefresh} disabled={isFetching} className="h-7 text-[10px] font-bold">
                 {isFetching ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                 Refresh
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-7 text-[10px] font-bold px-4" disabled={!isDirty}>
                <Save className="h-3 w-3 mr-1.5" /> {t('common:save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-0">
        <div className="w-full border-t border-b bg-white border-slate-200 relative">
          <TooltipProvider>
            <Table className="min-w-[1800px] table-fixed border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-50">
                <TableRow className="divide-x divide-slate-200 bg-slate-100 h-10">
                  <TableHead className="w-[110px] font-black uppercase text-[10px] sticky left-0 z-[60] bg-slate-100 border-r-2 border-slate-300 px-3">{t('matrix.control_ref')}</TableHead>
                  <TableHead className="w-[350px] font-black uppercase text-[10px] sticky left-[110px] z-[60] bg-slate-100 border-r-2 border-slate-300 px-3">{t('matrix.control_description')}</TableHead>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingControls ? (
                  <TableRow><TableCell colSpan={COSO_PRINCIPLES.length + 7} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loading ELC data...</span>
                    </div>
                  </TableCell></TableRow>
                ) : elcItems.length === 0 ? (
                  <TableRow><TableCell colSpan={COSO_PRINCIPLES.length + 7} className="h-64 text-center text-slate-400 italic text-[10px]">Belum ada data Entity Level Control (ELC).</TableCell></TableRow>
                ) : elcItems.map((ctrl) => (
                  <TableRow key={ctrl.id} className="group hover:bg-indigo-50/5 transition-colors divide-x divide-slate-100 border-b h-10">
                    <TableCell className="font-mono text-[10px] font-bold text-slate-500 sticky left-0 z-30 bg-white border-r-2 border-slate-200 px-3">
                      {ctrl.code}
                    </TableCell>
                    <TableCell className="align-top py-2 sticky left-[110px] z-30 bg-white border-r-2 border-slate-200 max-w-[350px] px-3">
                      <div className="flex flex-col gap-0.5 leading-tight">
                        <span className="text-[10px] font-bold text-slate-800">{ctrl.name}</span>
                        <p className="text-[9px] text-slate-500 italic line-clamp-2">{ctrl.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-medium text-slate-600 bg-slate-50/30">
                      {ctrl.frequency || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3 truncate">
                      {ctrl.supportingDocs || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3 bg-slate-50/30">
                      {(ctrl as any).companyName || '-'}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 px-3">
                      {ctrl.executorRole || 'Control Owner'}
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-bold text-indigo-600 bg-slate-50/30">
                      {ctrl.effectiveDate ? new Date(ctrl.effectiveDate).getFullYear() : '-'}
                    </TableCell>
                    
                    {COSO_PRINCIPLES.map(p => {
                      const isMapped = ctrl.cosoPrinciples?.includes(p as any);
                      return (
                        <TableCell key={p} className={cn(
                          "text-center p-0",
                          isMapped ? "bg-emerald-50/40" : ""
                        )}>
                          <div className="flex items-center justify-center h-full min-h-[35px]">
                            {isMapped ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3px]" />
                            ) : (
                              <span className="text-slate-100 text-[9px]">—</span>
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
    </div>
  );

  if (embedded) return content;

  return (
    <AppLayout container>
      {content}
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}
