import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { 
  MaterialitySimulation, GLRow, GLSnapshot, QualitativeLevel, UserRole, SimulationStatus 
} from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Save, Loader2, Trash2, Upload, ArrowLeft, Send, History, ShieldCheck, Settings2, Info
} from 'lucide-react';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { ScopingHealthDashboard } from '@/components/scoping/ScopingHealthDashboard';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  parseBalance, 
  detectGLColumns, 
  filterEmptyRows,
  validateGLMapping,
  calculateBenchmarkValue,
  BenchmarkCategory,
  getGroupMultiplier
} from '@/lib/compliance-utils';

export function ScopingPage() {
  const queryClient = useQueryClient();
  const [selectedSimId, setSelectedSimId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const { data: simulations, isLoading: simLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => api<{ items: MaterialitySimulation[] }>('/api/simulations'),
  });

  const selectedSim = simulations?.items.find(s => s.id === selectedSimId);

  const createSimMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => api('/api/simulations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (newSim) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setSelectedSimId(newSim.id);
      setIsCreating(false);
      toast.success("Simulation created successfully");
    }
  });

  const deleteSimMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Simulation deleted");
    }
  });

  if (selectedSim) {
    return <ScopingEditor simulation={selectedSim} onBack={() => setSelectedSimId(null)} />;
  }

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Materiality Simulations</h1>
            <p className="text-muted-foreground text-sm">Manage and compare different scoping scenarios for the current fiscal year.</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Simulation
          </Button>
        </div>

        {simLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulations?.items.map(sim => (
              <Card key={sim.id} className="hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md border-slate-200" onClick={() => setSelectedSimId(sim.id)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <StatusBadge status={sim.status} />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteSimMutation.mutate(sim.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-2 text-slate-800">{sim.name}</CardTitle>
                  <CardDescription className="text-xs">Basis: {sim.basis} ({sim.omPercentage}%) | Multiplier: {getGroupMultiplier(sim.locationCount || 1)}x</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                    <span className="text-muted-foreground">Created {new Date(sim.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-primary text-[13px]">PM: Rp {sim.pmValue?.toLocaleString('id-ID') || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {simulations?.items.length === 0 && !isCreating && (
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-xl py-20 text-center space-y-4 bg-slate-50/50">
                <History className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground text-sm font-medium">No simulations found. Create your first scenario.</p>
                <Button variant="outline" onClick={() => setIsCreating(true)}>Get Started</Button>
              </div>
            )}
          </div>
        )}

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Simulation</DialogTitle>
              <DialogDescription>Set initial parameters for your materiality scenario.</DialogDescription>
            </DialogHeader>
            <SimulationInitialForm onSubmit={(data) => createSimMutation.mutate(data)} isPending={createSimMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  switch (status) {
    case 'Approved': return <Badge className="bg-green-600">Approved</Badge>;
    case 'Pending CFO': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Review CFO</Badge>;
    case 'Pending Komut': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Review Komut</Badge>;
    case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function SimulationInitialForm({ onSubmit, isPending }: { onSubmit: (data: any) => void, isPending: boolean }) {
  const [name, setName] = React.useState("");
  const [basis, setBasis] = React.useState("PBT");
  const [locations, setLocations] = React.useState(1);

  const defaultOm = basis === 'Revenue' || basis === 'Assets' ? 1 : 5;

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Simulation Name</Label>
        <Input placeholder="e.g. FY2024 - Conservative PBT" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Benchmark Basis</Label>
          <Select value={basis} onValueChange={setBasis}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Revenue">Revenue</SelectItem>
              <SelectItem value="PBT">Profit Before Tax</SelectItem>
              <SelectItem value="Assets">Total Assets</SelectItem>
              <SelectItem value="Equity">Total Equity</SelectItem>
              <SelectItem value="Net Current Assets">Net Current Assets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Significant Locations</Label>
          <Input type="number" min={1} value={locations} onChange={e => setLocations(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-[10px] text-blue-700 leading-relaxed italic">
          Multiplier: <strong>{getGroupMultiplier(locations)}x</strong> (Tabel 25).
          Default OM: <strong>{defaultOm}%</strong> (Tabel 3).
        </p>
      </div>
      <Button className="w-full mt-2" disabled={!name || isPending} onClick={() => onSubmit({ name, basis, omPercentage: defaultOm, locationCount: locations })}>
        {isPending ? "Creating..." : "Initialize Simulation"}
      </Button>
    </div>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const queryClient = useQueryClient();
  const [simState, setSimState] = React.useState(simulation);
  const [glData, setGlData] = React.useState<GLRow[]>([]);

  const isLocked = simState.status === 'Approved' || simState.status === 'Pending CFO' || simState.status === 'Pending Komut';

  const { data: snapshot } = useQuery({
    queryKey: ['gl-snapshot', simState.glSnapshotId],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${simState.glSnapshotId}`),
    enabled: !!simState.glSnapshotId
  });

  React.useEffect(() => {
    if (snapshot) setGlData(snapshot.rows);
  }, [snapshot]);

  const calculateValues = React.useMemo(() => {
    if (glData.length === 0) return { omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0 };
    const basisMap: Record<string, BenchmarkCategory> = {
      'Revenue': 'Revenue', 'PBT': 'Pre-Tax Income', 'Assets': 'Assets', 'Equity': 'Equity', 'Net Current Assets': 'Assets'
    };
    const benchmarkCategory = basisMap[simState.basis] || 'Revenue';
    const benchmarkValue = calculateBenchmarkValue(glData, benchmarkCategory);
    const multiplier = getGroupMultiplier(simState.locationCount || 1);
    const baseOM = (benchmarkValue * simState.omPercentage) / 100;
    const omValue = baseOM * multiplier;
    const pmValue = omValue * (1 - simState.haircutPercentage / 100);
    return { omValue, pmValue, multiplier, benchmarkValue };
  }, [glData, simState.basis, simState.omPercentage, simState.haircutPercentage, simState.locationCount]);

  const { omValue, pmValue, multiplier, benchmarkValue } = calculateValues;

  const updateSimMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => api(`/api/simulations/${simState.id}`, { method: 'PUT', body: JSON.stringify({ ...data, omValue, pmValue }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Simulation draft saved");
    }
  });

  const submitSimMutation = useMutation({
    mutationFn: () => api(`/api/simulations/${simState.id}/submit`, { method: 'POST' }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setSimState(updated);
      toast.success("Simulation submitted to CFO");
    }
  });

  const handleAssessmentChange = (noGL: string, ruleId: number, level: QualitativeLevel) => {
    if (isLocked) return;
    setSimState(prev => ({
      ...prev,
      assessmentData: { ...prev.assessmentData, [noGL]: { ...(prev.assessmentData[noGL] || {}), [ruleId]: level } }
    }));
  };

  const handleBatchApply = (fsliCode: string, ruleId: number, level: QualitativeLevel) => {
    if (isLocked) return;
    const affectedGLs = glData.filter(row => row.fsliCode === fsliCode).map(row => row.noGL);
    const newData = { ...simState.assessmentData };
    affectedGLs.forEach(noGL => { newData[noGL] = { ...(newData[noGL] || {}), [ruleId]: level }; });
    setSimState(prev => ({ ...prev, assessmentData: newData }));
    toast.info(`Applied ${level} to all accounts under FSLI ${fsliCode}`);
  };

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (isLocked) return;
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const bstr = e.target?.result;
      let rawData: any[] = [];
      let headers: string[] = [];
      try {
        if (file.name.endsWith('.csv')) {
          const results = Papa.parse(bstr as string, { header: true, skipEmptyLines: false, transformHeader: (h) => h.trim() });
          rawData = results.data;
          headers = results.meta.fields || [];
        } else {
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet);
          rawData = json.map((row: any) => {
            const trimmedRow: any = {};
            Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
            return trimmedRow;
          });
          headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        }
        const filteredRaw = filterEmptyRows(rawData);
        const mapping = detectGLColumns(headers);
        const validation = validateGLMapping(mapping);
        if (!validation.valid) { toast.error(`Missing required columns: ${validation.missing.join(', ')}`); return; }
        const rows: GLRow[] = filteredRaw.map((r: any) => {
          const parsedBal = parseBalance(r[mapping.balance]);
          const parsedFsliBal = parseBalance(r[mapping.fsliBalance]);
          return {
            ymd: String(r[mapping.period] || ''), entityCode: String(r[mapping.entityCode] || ''),
            noGL: String(r[mapping.accountCode] || ''), glDesc: String(r[mapping.accountName] || ''),
            currency: String(r[mapping.currency] || 'IDR'), balance: parsedBal.value,
            fsliCode: String(r[mapping.fsliCode] || ''), fsliName: String(r[mapping.fsliName] || ''),
            kategori: String(r[mapping.kategori] || ''), subKategori: String(r[mapping.subKategori] || ''),
            fsliBalance: parsedFsliBal.value, noUrut: parseInt(String(r[mapping.noUrut] || '0')) || 0
          };
        }).filter(r => r.noGL && r.glDesc);
        if (rows.length === 0) { toast.error("No valid GL rows found after parsing"); return; }
        const snap = await api<GLSnapshot>('/api/gl-snapshots', { method: 'POST', body: JSON.stringify({ filename: file.name, rows }) });
        setSimState(prev => {
          const updated = { ...prev, glSnapshotId: snap.id };
          updateSimMutation.mutate(updated);
          return updated;
        });
        setGlData(rows);
        toast.success(`Successfully processed ${rows.length} GL accounts`);
      } catch (err) { console.error("Parse error:", err); toast.error("Failed to parse GL file."); }
    };
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  }, [updateSimMutation, isLocked]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, disabled: isLocked,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] } 
  });

  return (
    <AppLayout container>
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{simState.name}</h1>
                <StatusBadge status={simState.status} />
              </div>
              <p className="text-sm text-muted-foreground">Year: {simState.year} | Basis: {simState.basis}</p>
            </div>
          </div>
          {!isLocked && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => updateSimMutation.mutate(simState)} disabled={updateSimMutation.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save Draft
              </Button>
              <Button onClick={() => submitSimMutation.mutate()} className="bg-indigo-600 hover:bg-indigo-700" disabled={submitSimMutation.isPending || !simState.glSnapshotId}>
                <Send className="h-4 w-4 mr-2" /> {simState.status === 'Rejected' ? 'Re-submit to CFO' : 'Submit to CFO'}
              </Button>
            </div>
          )}
          {simState.status === 'Approved' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" /> This baseline is officially approved and locked.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50 rounded-t-xl">
                <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" /> Scoping Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Significant Locations</Label>
                  <Input type="number" min={1} disabled={isLocked} value={simState.locationCount} onChange={e => setSimState(s => ({ ...s, locationCount: Number(e.target.value) }))} />
                  <p className="text-[9px] text-blue-600 italic">Multiplier: {multiplier}x (Table 25)</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">% OM (Overall Materiality)</Label>
                  <Input type="number" step={0.1} disabled={isLocked} value={simState.omPercentage} onChange={e => setSimState(s => ({ ...s, omPercentage: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">% Haircut (PM)</Label>
                  <Input type="number" disabled={isLocked} value={simState.haircutPercentage} onChange={e => setSimState(s => ({ ...s, haircutPercentage: Number(e.target.value) }))} />
                </div>
                <Separator />
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest flex justify-between">{simState.basis} Value <Info className="h-2.5 w-2.5" /></p>
                    <p className="text-sm font-mono font-bold text-slate-700 text-right">Rp {benchmarkValue.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Overall Materiality</p>
                    <p className="text-lg font-mono font-bold text-primary text-right">Rp {omValue.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-blue-400 uppercase font-bold tracking-widest">Performance Materiality</p>
                    <p className="text-lg font-mono font-bold text-blue-600 text-right">Rp {pmValue.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-2"><Info className="h-3 w-3" /> Scoping Logic</CardTitle></CardHeader>
              <CardContent className="text-[10px] text-amber-700 leading-relaxed space-y-2 italic">
                <p>Akun ditandai <strong>IN SCOPE</strong> jika:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>|Saldo| &gt;= PM (Kuan)</li>
                  <li>Salah satu dari 8 rule kualitatif bernilai 'HIGH'</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {!simState.glSnapshotId ? (
              <div {...getRootProps()} className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50",
                isLocked && "cursor-not-allowed opacity-50"
              )}>
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-slate-700">Upload General Ledger</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">Drop your .csv or .xlsx file here to populate the worksheet.</p>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">Support: CSV, XLSX, XLS</Badge>
              </div>
            ) : (
              <Tabs defaultValue="worksheet" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                  <TabsTrigger value="worksheet">Scoping Worksheet</TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-3 w-3" /> Approval History
                    {simState.history?.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{simState.history.length}</Badge>}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="worksheet" className="space-y-6">
                  <ScopingHealthDashboard glData={glData} />
                  <GLDataGrid 
                    data={glData} assessmentData={simState.assessmentData} 
                    omValue={omValue} pmValue={pmValue}
                    onAssessmentChange={handleAssessmentChange} onApplyToFSLI={handleBatchApply}
                    isReadOnly={isLocked}
                  />
                </TabsContent>
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> Activity Log & Feedback</CardTitle>
                      <CardDescription>Track all actions and comments for this materiality baseline.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ApprovalHistoryTimeline history={simState.history} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
