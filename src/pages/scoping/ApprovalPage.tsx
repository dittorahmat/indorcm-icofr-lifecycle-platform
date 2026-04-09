import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, XCircle, Eye, Loader2, ShieldCheck, 
  AlertCircle, History, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import { MaterialitySimulation, GLSnapshot } from '@shared/types';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';

export function ApprovalPage() {
  const queryClient = useQueryClient();
  const [selectedSim, setSelectedSim] = React.useState<MaterialitySimulation | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [note, setNote] = React.useState("");

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
    mutationFn: (id: string) => api(`/api/simulations/${id}/approve`, { method: 'POST', body: JSON.stringify({ approvalNote: note }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setIsReviewOpen(false);
      setSelectedSim(null);
      setNote("");
      toast.success("Simulation approved and set as baseline");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Rejected', approvalNote: note }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setIsReviewOpen(false);
      setSelectedSim(null);
      setNote("");
      toast.info("Simulation rejected and returned to Line 2");
    }
  });

  const pendingSims = simulations?.items.filter(s => s.status === 'Submitted') || [];

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Materiality Approval</h1>
            <p className="text-muted-foreground">Review and approve materiality baselines submitted by Line 2.</p>
          </div>
          <Badge variant="outline" className="h-6 px-3 bg-amber-50 text-amber-700 border-amber-200">
            {pendingSims.length} Pending Actions
          </Badge>
        </div>

        <Card className="border-amber-100 bg-amber-50/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Approval Authority
            </CardTitle>
            <CardDescription className="text-[11px]">
              As Komisaris Utama (Komut), your approval locks the materiality parameters for the current audit cycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulation Name</TableHead>
                  <TableHead>Basis</TableHead>
                  <TableHead className="text-right">OM Value</TableHead>
                  <TableHead className="text-right">PM Value</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSims.map(sim => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-bold">{sim.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sim.basis} ({sim.omPercentage}%)</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">Rp {sim.omValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-blue-600">Rp {sim.pmValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sim.createdBy}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className="gap-2" onClick={() => { setSelectedSim(sim); setIsReviewOpen(true); }}>
                        <Eye className="h-4 w-4" /> Review Matrix
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingSims.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                      No pending simulations for approval.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl">Review Scoping: {selectedSim?.name}</DialogTitle>
                  <DialogDescription>
                    Review the accounts included in scope based on PM Rp {selectedSim?.pmValue.toLocaleString()}.
                  </DialogDescription>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Overall Materiality</p>
                    <p className="text-sm font-mono font-bold">Rp {selectedSim?.omValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right border-l pl-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-blue-600">Performance Materiality</p>
                    <p className="text-sm font-mono font-bold text-blue-600">Rp {selectedSim?.pmValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden px-6 py-2">
              {!snapshot ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm italic">Loading worksheet snapshot...</p>
                </div>
              ) : (
                <GLDataGrid 
                  data={snapshot.rows} 
                  assessmentData={selectedSim?.assessmentData || {}} 
                  pmValue={selectedSim?.pmValue || 0}
                  onAssessmentChange={() => {}} // Disabled
                  onApplyToFSLI={() => {}} // Disabled
                  isReadOnly={true}
                />
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t flex gap-6 items-start">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold flex items-center gap-2"><MessageSquare className="h-3 w-3" /> Approval/Rejection Note</Label>
                <Textarea 
                  placeholder="Write your feedback here..." 
                  className="bg-white h-20 text-xs"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 w-48">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={approveMutation.isPending}
                  onClick={() => selectedSim && approveMutation.mutate(selectedSim.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Baseline
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  disabled={rejectMutation.isPending}
                  onClick={() => selectedSim && rejectMutation.mutate(selectedSim.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject & Return
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
