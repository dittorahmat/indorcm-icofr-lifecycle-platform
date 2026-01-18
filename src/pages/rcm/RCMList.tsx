import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { RCM, Control, ChangeLog, SOCReport, Application } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, ShieldCheck, History, Search, Cloud, Server, Workflow } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { RiskLibraryLookup } from '@/components/rcm/RiskLibraryLookup';
// Lazy load heavy BPM Editor
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

  const { data: changeLogsData, isLoading: logsLoading } = useQuery({
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
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
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
            <TabsTrigger value="matrix">RCM Matrix</TabsTrigger>
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

            <motion.div
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
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
                                                    <Badge variant={rcm.status === 'Active' ? 'default' : rcm.status === 'Pending Validation' ? 'destructive' : 'secondary'}>
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
                                                </div>
                                              </div>                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(controlsByRcmId[rcm.id] || []).map(control => (
                            <div key={control.id} className="border p-4 rounded-md flex justify-between items-start bg-card hover:bg-accent/50 transition-colors gap-4 group">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  {control.isKeyControl && <ShieldCheck className="h-4 w-4 text-green-600" title="Key Control" />}
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
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-[10px] ${control.riskRating === 'High' ? 'bg-red-100 text-red-700' : control.riskRating === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
                                  >
                                    {control.riskRating} Risk
                                  </Badge>
                                  {control.isFraudRisk && <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">FRAUD RISK</Badge>}
                                  {control.itgcArea && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">ITGC: {control.itgcArea} {control.cobitId ? `(${control.cobitId})` : ''}</Badge>}
                                  <Badge variant="outline" className="text-[10px] border-muted-foreground/20 text-muted-foreground font-normal italic">Eff: {new Date(control.effectiveDate).toLocaleDateString()}</Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleEditControl(control)} className="opacity-0 group-hover:opacity-100 transition-opacity">Edit</Button>
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

          <TabsContent value="logs" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Change Management Log
                </CardTitle>
                <CardDescription>Dokumentasi Perubahan Proses Bisnis dan Pengendalian (Lampiran 6)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">Proses / Sub-Proses</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Pemilik</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Deskripsi Sebelum</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Deskripsi Sesudah</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Tgl Laporan</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Tgl Efektif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading logs...</TableCell></TableRow>
                    ) : changeLogsData?.items?.length ? (
                      changeLogsData.items.map(log => {
                        const relatedRcm = rcmData?.items.find(r => r.id === log.entityId);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs font-semibold">
                              {relatedRcm ? `${relatedRcm.process} - ${relatedRcm.subProcess}` : log.entityId}
                            </TableCell>
                            <TableCell className="text-xs font-medium">{log.userId}</TableCell>
                            <TableCell className="text-[10px] max-w-[200px] text-muted-foreground truncate" title={log.descriptionBefore}>
                              {log.descriptionBefore}
                            </TableCell>
                            <TableCell className="text-[10px] max-w-[200px] font-medium" title={log.descriptionAfter}>
                              {log.descriptionAfter}
                            </TableCell>
                            <TableCell className="text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                            <TableCell className="text-[10px] font-bold text-primary italic">As Per Cycle</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground italic">No change logs found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soc" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      Third Party SOC Report Validations
                    </CardTitle>
                    <CardDescription>Dokumentasi validasi laporan SOC 1 Type 2 untuk kontrol yang dialihkan ke pihak ketiga.</CardDescription>
                  </div>
                  <Button size="sm"><PlusCircle className="h-4 w-4 mr-2" /> Add SOC Review</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor / Service Org</TableHead>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Validated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading SOC reports...</TableCell></TableRow>
                    ) : socReportsData?.items?.length ? (
                      socReportsData.items.map(report => (
                        <TableRow key={report.id}>
                          <TableCell className="font-semibold">{report.vendorName}</TableCell>
                          <TableCell><Badge variant="outline">{report.reportType}</Badge></TableCell>
                          <TableCell className="text-xs">{report.issuer}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={report.status === 'Valid' ? 'default' : report.status === 'Expired' ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(report.lastValidatedDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground italic">No SOC reports documented.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apps" className="pt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      Significant Application Inventory
                    </CardTitle>
                    <CardDescription>Daftar aplikasi yang relevan dengan pelaporan keuangan dan status efektivitas ITGC-nya.</CardDescription>
                  </div>
                  <Button size="sm"><PlusCircle className="h-4 w-4 mr-2" /> Add Application</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Criticality</TableHead>
                      <TableHead>ITGC Status</TableHead>
                      <TableHead>Last Tested</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center">Loading applications...</TableCell></TableRow>
                    ) : applicationsData?.items?.length ? (
                      applicationsData.items.map(app => (
                        <TableRow key={app.id}>
                          <TableCell className="font-semibold">{app.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{app.description}</TableCell>
                          <TableCell>
                            <Badge variant={app.criticality === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {app.criticality}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={app.statusITGC === 'Effective' ? 'default' : app.statusITGC === 'Ineffective' ? 'destructive' : 'outline'}
                              className={`text-[10px] ${app.statusITGC === 'Effective' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`}
                            >
                              {app.statusITGC}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {app.lastITGCTestDate ? new Date(app.lastITGCTestDate).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground italic">No significant applications found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ControlEditor
        isOpen={isEditorOpen}
        setIsOpen={setEditorOpen}
        control={selectedControl}
      />
      
      <Dialog open={isAddProcessOpen} onOpenChange={setAddProcessOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Process (RCM)</DialogTitle>
            <DialogDescription>Define a new process and its associated risks.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process">Process Name</Label>
                <Input 
                  id="process" 
                  value={newRcmData.process} 
                  onChange={(e) => setNewRcmData({ ...newRcmData, process: e.target.value })} 
                  placeholder="e.g. Procure to Pay" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subProcess">Sub-Process</Label>
                <Input 
                  id="subProcess" 
                  value={newRcmData.subProcess} 
                  onChange={(e) => setNewRcmData({ ...newRcmData, subProcess: e.target.value })} 
                  placeholder="e.g. Invoice Verification" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="risk">Risk Description</Label>
                <RiskLibraryLookup onSelect={(desc) => setNewRcmData({ ...newRcmData, riskDescription: desc })} />
              </div>
              <Textarea 
                id="risk" 
                value={newRcmData.riskDescription} 
                onChange={(e) => setNewRcmData({ ...newRcmData, riskDescription: e.target.value })} 
                placeholder="Describe the risk..." 
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProcessOpen(false)}>Cancel</Button>
            <Button onClick={() => createRcmMutation.mutate(newRcmData)} disabled={createRcmMutation.isPending}>
              {createRcmMutation.isPending ? 'Creating...' : 'Create Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBpmOpen} onOpenChange={setBpmOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Business Process Map: {selectedRcmForBpm?.process}</DialogTitle>
            <DialogDescription>
              Visualisasi alur proses bisnis {selectedRcmForBpm?.subProcess} (Standar Lampiran 4).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-1">
            <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Skeleton className="h-full w-full" /></div>}>
              <BPMEditor 
                rcmId={selectedRcmForBpm?.id} 
                initialData={selectedRcmForBpm?.bpmData} 
              />
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}