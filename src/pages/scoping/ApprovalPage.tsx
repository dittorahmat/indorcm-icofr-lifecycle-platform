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
  CheckCircle2, XCircle, Eye, Loader2, ShieldCheck, 
  AlertCircle, History, MessageSquare, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MaterialitySimulation, GLSnapshot, UserRole } from '@shared/types';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTranslation } from 'react-i18next';

export function ApprovalPage() {
  const { t } = useTranslation('scoping');
  const queryClient = useQueryClient();
  const [selectedSim, setSelectedSim] = React.useState<MaterialitySimulation | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ role: UserRole }>('/api/user/me'),
  });

  const userRole = me?.role;

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
    }
  });

  // Filter logic based on role
  const pendingSims = simulations?.items.filter(s => {
    if (userRole === 'CFO') return s.status === 'Pending CFO';
    if (userRole === 'Commissioner') return s.status === 'Pending Komut';
    if (userRole === 'Admin') return s.status === 'Pending CFO' || s.status === 'Pending Komut';
    return false;
  }) || [];

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('approval.title')}</h1>
            <p className="text-muted-foreground">{t('approval.description', { role: userRole })}</p>
          </div>
          <Badge variant="outline" className="h-6 px-3 bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
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
              <TableHeader>
                <TableRow>
                  <TableHead>Simulation Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Basis</TableHead>
                  <TableHead className="text-right">% OM</TableHead>
                  <TableHead className="text-right">% Haircut</TableHead>
                  <TableHead className="text-right">OM Value</TableHead>
                  <TableHead className="text-right">PM Value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : pendingSims.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No simulations pending your review.</TableCell></TableRow>
                ) : pendingSims.map(sim => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-medium">{sim.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        sim.status === 'Pending CFO' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {sim.status === 'Pending CFO' ? t('status.pendingCfo') : t('status.pendingKomut')}
                      </Badge>
                    </TableCell>
                    <TableCell>{sim.basis}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{sim.omPercentage}%</TableCell>
                    <TableCell className="text-right text-xs font-medium">{sim.haircutPercentage}%</TableCell>
                    <TableCell className="text-right font-mono text-xs">Rp {sim.omValue.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-mono text-xs">Rp {sim.pmValue.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedSim(sim); setIsReviewOpen(true); }} className="gap-2">
                        <Eye className="h-4 w-4" /> Review
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
          ) : pendingSims.map(sim => (
            <div key={sim.id} className="bg-card border rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold leading-tight">{sim.name}</p>
                <Badge variant="secondary" className={cn(
                  "shrink-0",
                  sim.status === 'Pending CFO' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                )}>
                  {sim.status === 'Pending CFO' ? t('status.pendingCfo') : t('status.pendingKomut')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                  <p className="text-xs font-semibold font-mono mt-0.5">Rp {sim.omValue.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('params.pmValue')}</p>
                  <p className="text-xs font-semibold font-mono mt-0.5">Rp {sim.pmValue.toLocaleString('id-ID')}</p>
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
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                  <TabsTrigger value="worksheet">{t('approval.tabWorksheet')}</TabsTrigger>
                  <TabsTrigger value="history">{t('approval.tabHistory')}</TabsTrigger>
                </TabsList>
                
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
                  <ApprovalHistoryTimeline history={selectedSim?.history || []} />
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
                <p className="text-xs text-muted-foreground italic">Note: Rejection requires a reason to be provided.</p>
              </div>
              <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => rejectMutation.mutate(selectedSim!.id)}
                    disabled={rejectMutation.isPending || !note}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" /> {t('approval.rejectBtn')}
                  </Button>
                  <Button 
                    onClick={() => approveMutation.mutate(selectedSim!.id)}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <UserCheck className="h-4 w-4" /> {userRole === 'CFO' ? t('approval.approveToKomutBtn') : t('approval.approveFinalBtn')}
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
