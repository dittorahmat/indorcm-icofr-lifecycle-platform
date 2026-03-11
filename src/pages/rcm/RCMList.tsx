import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { RCM, Control, ChangeLog, SOCReport, Application } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, FileDown, ShieldCheck, History, Search, Cloud, 
  Server, Workflow, CheckCircle2, XCircle, ArrowRight, Eye, AlertTriangle 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { RiskLibraryLookup } from '@/components/rcm/RiskLibraryLookup';
const BPMEditor = React.lazy(() => import('@/components/rcm/BPMEditor').then(m => ({ default: m.BPMEditor })));
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RCMDiffViewerProps {
  current: RCM;
  proposed: Partial<RCM>;
}

function RCMDiffViewer({ current, proposed }: RCMDiffViewerProps) {
  const fields: (keyof RCM)[] = ['process', 'subProcess', 'riskDescription'];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-[10px] font-bold uppercase text-slate-400 px-2">Current Version</div>
        <div className="text-[10px] font-bold uppercase text-slate-400 px-2">Proposed Changes</div>
      </div>
      <div className="space-y-2">
        {fields.map(field => {
          const isChanged = proposed[field] !== undefined && proposed[field] !== current[field];
          return (
            <div key={field} className={cn(
              "grid grid-cols-2 gap-4 p-2 rounded-md transition-colors",
              isChanged ? "bg-amber-50/50" : "bg-slate-50/30"
            )}>
              <div className="text-xs text-slate-600 line-clamp-2">{String(current[field] || '-')}</div>
              <div className="flex items-start gap-2">
                {isChanged && <ArrowRight className="h-3 w-3 text-amber-500 mt-0.5" />}
                <div className={cn(
                  "text-xs font-medium",
                  isChanged ? "text-amber-700" : "text-slate-400"
                )}>
                  {isChanged ? String(proposed[field]) : "No change"}
                </div>
              </div>
            </div>
          );
        })}
        {proposed.bpmData && (
          <div className="grid grid-cols-2 gap-4 p-2 rounded-md bg-blue-50/50">
            <div className="text-xs text-slate-600 italic">Diagram Version 1.0</div>
            <div className="flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5" />
              <div className="text-xs font-medium text-blue-700">Updated BPM Layout and Nodes</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RCMList() {
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const [isAddProcessOpen, setAddProcessOpen] = React.useState(false);
  const [isBpmOpen, setBpmOpen] = React.useState(false);
  const [isCompareOpen, setCompareOpen] = React.useState(false);
  const [isRejectOpen, setRejectOpen] = React.useState(false);
  const [selectedRcm, setSelectedRcm] = React.useState<RCM | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [newRcmData, setNewRcmData] = React.useState({ process: '', subProcess: '', riskDescription: '' });

  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm'),
  });

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: changeLogsData } = useQuery({
    queryKey: ['changelogs'],
    queryFn: () => api<{ items: ChangeLog[] }>('/api/changelogs'),
  });

  const { data: socReportsData } = useQuery({
    queryKey: ['socreports'],
    queryFn: () => api<{ items: SOCReport[] }>('/api/socreports'),
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  const queryClient = useQueryClient();
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';

  const validateMutation = useMutation({
    mutationFn: (rcmId: string) => api(`/api/rcm/${rcmId}/validate`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('RCM design validated and activated!');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
    }
  });

  const approveChangeMutation = useMutation({
    mutationFn: (rcmId: string) => api(`/api/rcm/${rcmId}/approve-change`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('RCM changes approved and effective!');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setCompareOpen(false);
    }
  });

  const rejectChangeMutation = useMutation({
    mutationFn: ({ rcmId, reason }: { rcmId: string, reason: string }) => 
      api(`/api/rcm/${rcmId}/reject-change`, { method: 'POST', body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      toast.info('Change request rejected and returned to Line 1');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setRejectOpen(false);
      setCompareOpen(false);
      setRejectReason("");
    }
  });

  const createRcmMutation = useMutation({
    mutationFn: (data: typeof newRcmData) => api('/api/rcm', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('New process added successfully');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setAddProcessOpen(false);
      setNewRcmData({ process: '', subProcess: '', riskDescription: '' });
    }
  });

  const controlsByRcmId = React.useMemo(() => {
    if (!controlsData) return {};
    return controlsData.items.reduce((acc, control) => {
      (acc[control.rcmId] = acc[control.rcmId] || []).push(control);
      return acc;
    }, {} as Record<string, Control[]>);
  }, [controlsData]);

  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    setEditorOpen(true);
  };

  const handleAddNewControl = (rcmId: string) => {
    const newControl: Partial<Control> = { rcmId, name: "New Control", description: "", assertions: [] };
    setSelectedControl(newControl as Control);
    setEditorOpen(true);
  };

  const isLoading = rcmLoading || controlsLoading;

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Risk Control Matrix (RCM)</h1>
            <p className="text-muted-foreground">Manage processes, risks, and internal controls.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><FileDown className="h-4 w-4 mr-2" /> Export</Button>
            <Button onClick={() => setAddProcessOpen(true)}><PlusCircle className="h-4 w-4 mr-2" /> Add Process</Button>
          </div>
        </div>

        <Tabs defaultValue="matrix">
          <TabsList>
            <TabsTrigger value="matrix">RCM Matrix (TLC)</TabsTrigger>
            <TabsTrigger value="elc">Indirect ELC (Tabel 17)</TabsTrigger>
            <TabsTrigger value="logs">Log Perubahan (Appendix 6)</TabsTrigger>
            <TabsTrigger value="soc">Third Party / SOC (Bab III 4.3)</TabsTrigger>
            <TabsTrigger value="apps">Significant Apps (Bab III 1.5)</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search controls or risks..." className="pl-8" />
              </div>
            </div>

            <div className="space-y-8">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
              ) : (
                rcmData?.items.map(rcm => (
                  <Card key={rcm.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{rcm.process} / {rcm.subProcess}</CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            <span className="font-semibold text-foreground uppercase tracking-tight">Risk:</span> {rcm.riskDescription}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[10px] gap-1"
                              onClick={() => { setSelectedRcm(rcm); setBpmOpen(true); }}
                            >
                              <Workflow className="h-3 w-3" /> BPM Flow
                            </Button>
                            <Badge variant={
                              rcm.status === 'Active' ? 'default' : 
                              rcm.status === 'Pending Validation' ? 'destructive' : 
                              rcm.status === 'Pending Change Approval' ? 'secondary' : 'secondary'
                            }>
                              {rcm.status}
                            </Badge>
                          </div>
                          {rcm.status === 'Pending Validation' && mockRole === 'Line 2' && (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-7 text-[10px] uppercase font-bold"
                              onClick={() => validateMutation.mutate(rcm.id)}
                              disabled={validateMutation.isPending}
                            >
                              Validate Design (Lini 2)
                            </Button>
                          )}
                          {rcm.status === 'Pending Change Approval' && mockRole === 'Line 2' && (
                            <div className="p-2 border rounded bg-amber-50 border-amber-200 mt-2 space-y-2 max-w-[250px]">
                              <p className="text-[9px] font-bold text-amber-800 uppercase tracking-tighter">Proposed Changes by Lini 1</p>
                              <Button 
                                size="sm" 
                                className="h-7 text-[10px] w-full bg-amber-600 hover:bg-amber-700 gap-1 font-bold"
                                onClick={() => { setSelectedRcm(rcm); setCompareOpen(true); }}
                              >
                                <Eye className="h-3 w-3" /> Review Changes (Lampiran 6)
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(controlsByRcmId[rcm.id] || []).map(control => (
                          <div key={control.id} className="border p-4 rounded-md flex justify-between items-start bg-card hover:bg-accent/50 transition-colors gap-4 group">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                {control.isKeyControl && <ShieldCheck className="h-4 w-4 text-green-600" />}
                                <span className="font-mono text-xs font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                  {control.code || "NO-CODE"}
                                </span>
                                <h4 className="font-semibold text-sm">{control.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{control.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px]">{control.frequency}</Badge>
                                <Badge variant="outline" className="text-[10px]">{control.type}</Badge>
                                <Badge variant="outline" className="text-[10px]">{control.nature}</Badge>
                                <Badge variant="secondary" className={cn(
                                  "text-[10px]",
                                  control.riskRating === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                )}>
                                  {control.riskRating} Risk
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditControl(control)} className="opacity-0 group-hover:opacity-100">Edit</Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => handleAddNewControl(rcm.id)}>
                          <PlusCircle className="h-4 w-4 mr-2" /> Add Control
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ControlEditor isOpen={isEditorOpen} setIsOpen={setEditorOpen} control={selectedControl} />
      
      {/* Comparison Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-600" /> 
              Review Proposed RCM Changes
            </DialogTitle>
            <DialogDescription>
              Comparing current design with changes proposed by Lini 1.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedRcm?.changeRequest && (
              <RCMDiffViewer current={selectedRcm} proposed={selectedRcm.changeRequest.proposedData} />
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4" /> Reject & Return
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => approveChangeMutation.mutate(selectedRcm!.id)}
              disabled={approveChangeMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve & Persist Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Reject Change Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This feedback will be sent to the Process Owner (Lini 1).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Feedback</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Risk description is not detailed enough according to PSAK..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              disabled={!rejectReason || rejectChangeMutation.isPending}
              onClick={() => rejectChangeMutation.mutate({ rcmId: selectedRcm!.id, reason: rejectReason })}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BPM Dialog */}
      <Dialog open={isBpmOpen} onOpenChange={setBpmOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>BPM Flow: {selectedRcm?.process}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-hidden">
            <React.Suspense fallback={<Skeleton className="h-full w-full" />}>
              {selectedRcm && <BPMEditor rcm={selectedRcm} controls={controlsData?.items || []} />}
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
