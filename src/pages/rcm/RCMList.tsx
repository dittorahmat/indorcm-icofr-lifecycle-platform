import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { RCM, Control, ChangeLog, SOCReport, Application } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, ShieldCheck, History, Search, Cloud, Server, Workflow, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { RiskLibraryLookup } from '@/components/rcm/RiskLibraryLookup';
const BPMEditor = React.lazy(() => import('@/components/rcm/BPMEditor').then(m => ({ default: m.BPMEditor })));
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function RCMList() {
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const [isAddProcessOpen, setAddProcessOpen] = React.useState(false);
  const [isBpmOpen, setBpmOpen] = React.useState(false);
  const [selectedRcmForBpm, setSelectedRcmForBpm] = React.useState<RCM | null>(null);
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

  const { data: socReportsData, isLoading: socLoading } = useQuery({
    queryKey: ['socreports'],
    queryFn: () => api<{ items: SOCReport[] }>('/api/socreports'),
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
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
    }
  });

  const createRcmMutation = useMutation({
    mutationFn: (data: typeof newRcmData) => api('/api/rcm', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('New process added successfully');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      setAddProcessOpen(false);
      setNewRcmData({ process: '', subProcess: '', riskDescription: '' });
    },
    onError: (error) => toast.error(`Failed to create process: ${error.message}`)
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

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

            <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
              ) : (
                rcmData?.items.map(rcm => (
                  <motion.div key={rcm.id} variants={itemVariants}>
                    <Card>
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
                                onClick={() => { setSelectedRcmForBpm(rcm); setBpmOpen(true); }}
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
                                <p className="text-[10px] text-amber-700 italic">"{rcm.changeRequest?.description}"</p>
                                <Button 
                                  size="sm" 
                                  className="h-6 text-[9px] w-full bg-amber-600 hover:bg-amber-700 gap-1"
                                  onClick={() => approveChangeMutation.mutate(rcm.id)}
                                  disabled={approveChangeMutation.isPending}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Approve Change (Lampiran 6)
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
                  </motion.div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="elc" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" /> Indirect ELC (Tabel 17)
                    </CardTitle>
                    <CardDescription>Dokumentasi pengendalian tingkat entitas tidak langsung.</CardDescription>
                  </div>
                  <Button size="sm"><PlusCircle className="h-4 w-4 mr-2" /> Add ELC</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prinsip COSO</TableHead>
                      <TableHead>Aktivitas Pengendalian</TableHead>
                      <TableHead>PIC / Fungsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Badge variant="outline">Prinsip 1</Badge></TableCell>
                      <TableCell>Penetapan Kode Etik</TableCell>
                      <TableCell>Human Capital</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Change Management Log
                </CardTitle>
                <CardDescription>Lampiran 6 Compliance.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Before</TableHead>
                      <TableHead>After</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeLogsData?.items.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-bold">{log.entityId}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{log.descriptionBefore}</TableCell>
                        <TableCell className="text-[10px]">{log.descriptionAfter}</TableCell>
                        <TableCell className="text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soc" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5 text-primary" /> SOC Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Vendor</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {socReportsData?.items.map(s => <TableRow key={s.id}><TableCell>{s.vendorName}</TableCell><TableCell><Badge>{s.status}</Badge></TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apps" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> IT Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>App Name</TableHead><TableHead>ITGC Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsData?.items.map(a => <TableRow key={a.id}><TableCell>{a.name}</TableCell><TableCell><Badge>{a.statusITGC}</Badge></TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ControlEditor isOpen={isEditorOpen} setIsOpen={setEditorOpen} control={selectedControl} />
      
      <Dialog open={isAddProcessOpen} onOpenChange={setAddProcessOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Add New Process (RCM)</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Process Name</Label><Input value={newRcmData.process} onChange={e => setNewRcmData({...newRcmData, process: e.target.value})} /></div>
              <div className="space-y-2"><Label>Sub-Process</Label><Input value={newRcmData.subProcess} onChange={e => setNewRcmData({...newRcmData, subProcess: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Risk Description</Label><Textarea value={newRcmData.riskDescription} onChange={e => setNewRcmData({...newRcmData, riskDescription: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProcessOpen(false)}>Cancel</Button>
            <Button onClick={() => createRcmMutation.mutate(newRcmData)} disabled={createRcmMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBpmOpen} onOpenChange={setBpmOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>BPM Flow: {selectedRcmForBpm?.process}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-hidden">
            <React.Suspense fallback={<Skeleton className="h-full w-full" />}><BPMEditor rcmId={selectedRcmForBpm?.id} initialData={selectedRcmForBpm?.bpmData} /></React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
