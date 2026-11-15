import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  XCircle, Eye, Loader2, ShieldCheck, 
  MessageSquare, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MaterialitySimulation, GLSnapshot } from '@shared/types';
import { allowedRolesAt } from '@shared/workflow-transitions';
import { resolveSimulationStatus, simulationApprovalStages, simulationTimeline } from '@shared/scoping-simulation-status';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { formatIDR } from '@/components/reports/dod/dod-format';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTranslation } from 'react-i18next';
import { useCurrentRole } from '@/hooks/use-current-role';
import { apiErrorMessage } from './hooks/scoping-materiality-view';

export function ApprovalPage() {
  const { t } = useTranslation('scoping');
  const queryClient = useQueryClient();
  const [selectedSim, setSelectedSim] = React.useState<MaterialitySimulation | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const userRole = useCurrentRole();

  const { data: simulations, isLoading } = useQuery({
    queryKey: ['simulations-pending'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
  });

  const { data: snapshot } = useQuery({
    queryKey: ['gl-snapshot', selectedSim?.glSnapshotId],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${selectedSim?.glSnapshotId}`),
    enabled: !!selectedSim?.glSnapshotId && isReviewOpen
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}/approve`, { 
      method: 'POST', 
      body: JSON.stringify({ note }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setIsReviewOpen(false);
      setSelectedSim(null);
      setNote("");
      toast.success("Simulation approved and moved to next stage");
    },
    onError: (err: unknown) => {
      toast.error(t('approval.approveFailed'), { description: apiErrorMessage(err, t('approval.approveFailed')) });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}/reject`, { 
      method: 'POST', 
      body: JSON.stringify({ note }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setIsReviewOpen(false);
      setSelectedSim(null);
      setNote("");
      toast.info("Simulation rejected and returned to Line 2");
    },
    onError: (err: unknown) => {
      toast.error(t('approval.rejectFailed'), { description: apiErrorMessage(err, t('approval.rejectFailed')) });
    }
  });

  // The stages that need a decision and the roles allowed at each of them both
  // come from the canonical SCOPING table — no second role→status map here.
  const approvalStages = simulationApprovalStages();
  const pendingSims = simulations?.items.filter(s => {
    const status = resolveSimulationStatus(s);
    return approvalStages.includes(status) && allowedRolesAt('SCOPING', status).includes(userRole);
  }) || [];
  const queue = pendingSims.map(sim => ({ sim, status: resolveSimulationStatus(sim) }));
  const selectedStatus = selectedSim ? resolveSimulationStatus(selectedSim) : null;

  const selectedSimId = selectedSim?.id;

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{t('approval.title')}</h1>
            <p className="text-muted-foreground">{t('approval.description', { role: userRole })}</p>
          </div>
          <Badge variant="outline" className="h-6 px-3 bg-amber-50 text-amber-700 border-amber-200 gap-1.5 self-start sm:self-auto shrink-0">
            <Loader2 className="h-3 w-3 animate-spin" /> {pendingSims.length} Pending Actions
          </Badge>
        </div>

        {/* DESKTOP VIEW: Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>{t('approval.queueTitle')}</CardTitle>
            <CardDescription>{t('approval.queueDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead stickyLeft className="min-w-[180px]">{t('form.name', { defaultValue: 'Simulation Name' })}</TableHead>
                  <TableHead className="w-[140px]">{t('table.status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead className="min-w-[140px]">{t('form.benchmark', { defaultValue: 'Basis' })}</TableHead>
                  <TableHead className="w-[80px] text-right">{t('params.omLabel', { defaultValue: '% OM' })}</TableHead>
                  <TableHead className="w-[90px] text-right">{t('params.haircutLabel', { defaultValue: '% Haircut' })}</TableHead>
                  <TableHead className="min-w-[120px] text-right">{t('params.omValue', { defaultValue: 'OM Value' })}</TableHead>
                  <TableHead className="min-w-[120px] text-right">{t('params.pmValue', { defaultValue: 'PM Value' })}</TableHead>
                  <TableHead className="w-[100px] text-right">{t('common:actions.action', { defaultValue: 'Action' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : pendingSims.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{t('approval.noPending', { defaultValue: 'No simulations pending your review.' })}</TableCell></TableRow>
                ) : queue.map(({ sim, status }) => (
                  <TableRow key={sim.id}>
                    <TableCell stickyLeft className="font-medium truncate max-w-[220px]" title={sim.name}>{sim.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        status === 'Pending Deletion Approval' ? "bg-rose-100 text-rose-800 border-rose-200" :
                        status === 'Pending CFO' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {status === 'Pending Deletion Approval' ? (t('status.pendingDeletion', { defaultValue: 'Pending Deletion' })) :
                         status === 'Pending CFO' ? t('status.pendingCfo') : t('status.pendingKomut')}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[160px]" title={sim.basis}>{sim.basis}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{sim.omPercentage}%</TableCell>
                    <TableCell className="text-right text-xs font-medium">{sim.haircutPercentage}%</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatIDR(sim.omValue)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatIDR(sim.pmValue)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedSim(sim); setIsReviewOpen(true); }} className="gap-2">
                        <Eye className="h-4 w-4" /> {t('common:actions.review', { defaultValue: 'Review' })}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MOBILE VIEW: Approval Card Stack */}
        <div className="block md:hidden space-y-4">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center bg-card rounded-lg border p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('approval.queueTitle')}</span>
            </div>
          ) : pendingSims.length === 0 ? (
            <div className="h-48 flex items-center justify-center bg-card rounded-lg border p-6 text-center text-muted-foreground text-xs font-medium">
              {t('approval.queueDesc')}
            </div>
          ) : queue.map(({ sim, status }) => (
            <div key={sim.id} className="bg-card border rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="text-sm font-bold leading-tight">{sim.name}</p>
                <Badge variant="secondary" className={cn(
                  "shrink-0",
                  status === 'Pending Deletion Approval' ? "bg-rose-100 text-rose-800 border-rose-200" :
                  status === 'Pending CFO' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                  {status === 'Pending Deletion Approval' ? (t('status.pendingDeletion', { defaultValue: 'Pending Deletion' })) :
                   status === 'Pending CFO' ? t('status.pendingCfo') : t('status.pendingKomut')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-md p-2 col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('form.benchmark')}</p>
                  <p className="text-xs font-semibold mt-0.5">{sim.basis}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('params.omLabel')}</p>
                  <p className="text-xs font-semibold mt-0.5">{sim.omPercentage}%</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('params.haircutLabel')}</p>
                  <p className="text-xs font-semibold mt-0.5">{sim.haircutPercentage}%</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('params.omValue')}</p>
                  <p className="text-xs font-semibold font-mono mt-0.5">{formatIDR(sim.omValue)}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('params.pmValue')}</p>
                  <p className="text-xs font-semibold font-mono mt-0.5">{formatIDR(sim.pmValue)}</p>
                </div>
              </div>
              <Button className="w-full min-h-[44px] gap-2" onClick={() => { setSelectedSim(sim); setIsReviewOpen(true); }}>
                <Eye className="h-4 w-4" /> Review
              </Button>
            </div>
          ))}
        </div>

        {/* Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                {t('approval.dialogTitle', { name: selectedSim?.name })}
              </DialogTitle>
              <DialogDescription>
                {t('approval.dialogDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 flex flex-col py-4">
              <Tabs defaultValue="worksheet" className="flex flex-col flex-1 min-h-0 w-full">
                <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1 mb-4">
                <TabsList className="flex sm:grid w-max min-w-full sm:w-full sm:max-w-[400px] sm:grid-cols-2 gap-1 min-h-[44px]">
                  <TabsTrigger value="worksheet" className="min-h-[44px] px-4 text-xs font-semibold flex-1 sm:flex-none whitespace-nowrap min-w-[140px] sm:min-w-0">{t('approval.tabWorksheet')}</TabsTrigger>
                  <TabsTrigger value="history" className="min-h-[44px] px-4 text-xs font-semibold flex-1 sm:flex-none whitespace-nowrap min-w-[140px] sm:min-w-0">{t('approval.tabHistory')}</TabsTrigger>
                </TabsList>
                </div>
                
                <TabsContent value="worksheet" className="flex-grow min-h-0 min-w-0 flex flex-col space-y-4 mt-0">
                  {snapshot ? (
                    <GLDataGrid 
                      data={snapshot.rows} 
                      assessmentData={selectedSim?.assessmentData || {}} 
                      omValue={selectedSim?.omValue || 0}
                      pmValue={selectedSim?.pmValue || 0}
                      onAssessmentChange={() => {}}
                      isReadOnly={true}
                    />
                  ) : (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  <ApprovalHistoryTimeline history={simulationTimeline(selectedSim ?? {})} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4 border-t pt-4 sticky bottom-0 bg-background pb-1">
              <div className="space-y-2">
                <Label htmlFor="note" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> {t('approval.notesLabel')}
                </Label>
                <Textarea 
                  id="note" 
                  placeholder={t('approval.notesPlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">{t('approval.notesHint')}</p>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 w-full">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)} className="w-full sm:w-auto min-h-[44px]">Cancel</Button>
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="destructive" 
                    onClick={() => { if (selectedSimId) rejectMutation.mutate(selectedSimId); }}
                    disabled={rejectMutation.isPending || !note || !selectedSimId}
                    className="gap-2 w-full sm:w-auto min-h-[44px]"
                  >
                    <XCircle className="h-4 w-4" /> {selectedStatus === 'Pending Deletion Approval' ? t('workflow:rejectDeletion') : t('approval.rejectBtn')}
                  </Button>
                  <Button 
                    onClick={() => { if (selectedSimId) approveMutation.mutate(selectedSimId); }}
                    disabled={approveMutation.isPending || !selectedSimId}
                    className={cn(
                      "gap-2 w-full sm:w-auto min-h-[44px]",
                      selectedStatus === 'Pending Deletion Approval'
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <UserCheck className="h-4 w-4" /> {
                      selectedStatus === 'Pending Deletion Approval'
                        ? t('workflow:approveDeletion')
                        : selectedStatus === 'Pending CFO' ? t('approval.approveToKomutBtn') : t('approval.approveFinalBtn')
                    }
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
