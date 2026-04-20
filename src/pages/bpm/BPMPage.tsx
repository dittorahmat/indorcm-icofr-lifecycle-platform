import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Database, FileSpreadsheet, Loader2, Info, ChevronRight, 
  Trash2, AlertTriangle, PlusCircle, CheckCircle2, Shield, Edit2, ExternalLink,
  Workflow as WorkflowIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLSnapshot, GLRow, BPMProcess, UserRole, MaterialitySimulation, User, BPMDiagram } from '@shared/types';
import { BPMWorksheet } from '@/components/bpm/BPMWorksheet';
import { BPMModal } from '@/components/bpm/BPMModal';
import { BPMEditor } from '@/components/rcm/BPMEditor';
import { toast } from 'sonner';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BPMPage() {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedFsli, setSelectedFsli] = React.useState<string>("");
  const [selectedAccountKey, setSelectedAccountKey] = React.useState<string>("");
  const [selectedBpmId, setSelectedBpmId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = React.useState(false);
  const [selectedDiagramId, setSelectedDiagramId] = React.useState<string | null>(null);
  const [currentSubProcess, setCurrentSubProcess] = React.useState("");
  const [isCreatingBPM, setIsCreatingBPM] = React.useState(false);
  const [bpmName, setBpmName] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  // ... (useEffects and useQueries are unchanged)

  // Handle Deep Linking from Scoping
  React.useEffect(() => {
    const fsli = searchParams.get('fsli');
    const noGL = searchParams.get('noGL');
    const glDesc = searchParams.get('glDesc');

    if (fsli) setSelectedFsli(fsli);
    if (noGL && glDesc) {
      setSelectedAccountKey(`${noGL} ||| ${glDesc}`);
      // If we have an account but no specific BPM ID, we might want to show the list first
      // or if there's only one BPM, open it. For now, let's just set the account.
    }
  }, [searchParams]);

  // 1. Fetch Active Snapshot
  const { data: activeSnap, isLoading: snapLoading } = useQuery({
    queryKey: ['gl-snapshots-active'],
    queryFn: async () => {
      const list = await api<{ items: GLSnapshot[] }>('/api/gl-snapshots');
      const active = list.items.find(s => s.isActive);
      if (!active) return null;
      // Fetch full details including rows
      return api<GLSnapshot>(`/api/gl-snapshots/${active.id}`);
    }
  });

  // 1b. Fetch Active Simulation for Account Assignments
  const { data: activeSim } = useQuery({
    queryKey: ['active-simulation'],
    queryFn: async () => {
      const list = await api<{ items: MaterialitySimulation[] }>('/api/simulations');
      // Ambil yang paling baru diupdate
      return [...list.items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || null;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/auth/me'),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  // 2. Derive unique significant FSLIs based on Scoping Criteria
  const significantFsliNames = React.useMemo(() => {
    if (!activeSnap || !activeSim) return [];
    
    // We strictly use the significantAccounts list from the active simulation (scoping result)
    const sigAccounts = activeSim.significantAccounts || [];
    if (sigAccounts.length === 0) return [];

    const sigFsliNames = new Set<string>();
    
    // Create a set of significant GL codes for fast lookup
    const sigCodes = new Set(sigAccounts.map(sa => sa.fsliCode).filter(Boolean));

    // Map those codes back to FSLI names using the active snapshot
    activeSnap.rows.forEach(row => {
      if (row.fsliName && sigCodes.has(row.noGL)) {
        sigFsliNames.add(row.fsliName);
      }
    });

    return Array.from(sigFsliNames).sort();
  }, [activeSnap, activeSim]);

  // 3. Filtered GL Numbers (Unique combination of noGL + glDesc)
  const glNumbers = React.useMemo(() => {
    if (!activeSnap || !selectedFsli) return [];
    
    const accounts: { key: string, noGL: string, glDesc: string }[] = [];
    const seen = new Set<string>();

    activeSnap.rows
      .filter(r => r.fsliName === selectedFsli)
      .forEach(r => {
        const key = `${r.noGL} ||| ${r.glDesc}`;
        if (!seen.has(key)) {
          seen.add(key);
          accounts.push({ key, noGL: r.noGL, glDesc: r.glDesc });
        }
      });

    return accounts.sort((a, b) => a.noGL.localeCompare(b.noGL));
  }, [activeSnap, selectedFsli]);

  // Derive selected row based on the unique key
  const selectedGLRow = React.useMemo(() => {
    if (!selectedAccountKey || !activeSnap) return null;
    const [noGL, glDesc] = selectedAccountKey.split(' ||| ');
    return activeSnap.rows.find(r => r.noGL === noGL && r.glDesc === glDesc);
  }, [selectedAccountKey, activeSnap]);

  // --- Mode Galak: Authorization Logic ---
  const { assignedDeptId, departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) return { hasAccess: true };
    
    // Cari penugasan departemen untuk akun ini
    const assignment = activeSim.significantAccounts?.find(sa => sa.fsliCode === selectedGLRow.noGL);
    const deptId = assignment?.assignedDepartmentId;
    
    // Lini 2 dan Admin punya kunci master
    if (currentUser.role === 'Line 2' || currentUser.role === 'Admin') {
      return { 
        assignedDeptId: deptId, 
        departmentName: assignment?.name || "Unassigned", // Ini harusnya ambil dari list dept tapi kita buat simpel dulu
        hasAccess: true 
      };
    }

    // Lini 1 harus cocok departemennya
    const match = currentUser.departmentId === deptId;
    return { 
      assignedDeptId: deptId, 
      hasAccess: match 
    };
  }, [selectedGLRow, activeSim, currentUser]);

  // 4. Fetch BPM Processes for selected account
  const { data: bpmProcesses, isLoading: bpmLoading } = useQuery({
    queryKey: ['bpm-processes', selectedAccountKey],
    queryFn: () => {
      const noGL = selectedAccountKey.split(' ||| ')[0];
      return api<{ items: BPMProcess[] }>(`/api/bpm-processes?noGL=${noGL}`);
    },
    enabled: !!selectedAccountKey
  });

  const { data: diagrams } = useQuery({
    queryKey: ['bpm-diagrams'],
    queryFn: () => api<{ items: BPMDiagram[] }>('/api/bpm-diagrams')
  });

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) => api('/api/bpm-diagrams', {
      method: 'POST',
      body: JSON.stringify({ name: `Flow: ${subProcess}`, subProcess })
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      setSelectedDiagramId(data.id);
      setIsWorkflowOpen(true);
    }
  });

  const createBPMMutation = useMutation({
// ... (mutations unchanged)
    mutationFn: (data: Partial<BPMProcess>) => api('/api/bpm-processes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setIsCreatingBPM(false);
      setBpmName("");
      toast.success("BPM Process created");
    }
  });

  const deleteBPMMutation = useMutation({
    mutationFn: (id: string) => api(`/api/bpm-processes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setSelectedBpmId(null);
      toast.success("BPM Process deleted");
    }
  });

  // 5. Filtered BPM processes based on search term
  const filteredBpmProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter(bpm => 
      bpm.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bpmProcesses, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('description')}
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Database className="h-3 w-3" /> 1. {t('scoping:activeSource')}
                </Label>
                <Select value={selectedFsli} onValueChange={(v) => { setSelectedFsli(v); setSelectedAccountKey(""); setSelectedBpmId(null); }}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Choose FSLI..." />
                  </SelectTrigger>
                  <SelectContent>
                    {significantFsliNames.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> 2. {t('scoping:form.name')}
                </Label>
                <Select value={selectedAccountKey} onValueChange={setSelectedAccountKey} disabled={!selectedFsli}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Choose GL Account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {glNumbers.map(g => (
                      <SelectItem key={g.key} value={g.key}>{g.noGL} - {g.glDesc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori</Label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                  {selectedGLRow?.category || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sub Kategori</Label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                  {selectedGLRow?.subKategori || "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedAccountKey ? (
          <div className="py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/30">
            <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Select an FSLI and GL Account to begin mapping.</p>
          </div>
        ) : !hasAccess ? (
          <div className="py-20 text-center border-2 border-red-100 rounded-xl bg-red-50/30">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800">Akses Dibatasi</h3>
            <p className="text-red-600/80 text-sm max-w-md mx-auto mt-2">
              Akun ini ditugaskan kepada <strong>{departmentName || "Departemen Lain"}</strong>. 
              Sebagai Lini 1, Anda hanya dapat mengelola proses bisnis untuk akun milik departemen Anda sendiri.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200">
              <div className="flex-1 w-full md:max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={t('searchPlaceholder')} 
                  className="pl-9 bg-white border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Owner Unit</p>
                  <p className="text-xs font-bold text-slate-600">{departmentName || "Finance & Accounting"}</p>
                </div>
                {(currentUser?.role === 'Line 2' || currentUser?.role === 'Admin' || hasAccess) && (
                  <Button onClick={() => setIsCreatingBPM(true)} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                    <Plus className="h-4 w-4" /> {t('createButton')}
                  </Button>
                )}
              </div>
            </div>

            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center">{t('table.action')}</TableHead>
                    <TableHead className="font-bold">{t('table.subProcess')}</TableHead>
                    <TableHead className="font-bold">{t('table.company')}</TableHead>
                    <TableHead className="font-bold">{t('table.location')}</TableHead>
                    <TableHead className="text-center font-bold">{t('table.risks')}</TableHead>
                    <TableHead className="text-center font-bold">{t('table.controls')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bpmLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                        <p className="text-xs text-slate-400 mt-2">Memuat daftar BPM...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBpmProcesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 italic">
                          {searchTerm ? `Tidak ditemukan sub proses dengan nama "${searchTerm}"` : 'Belum ada sub proses yang dibuat.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBpmProcesses.map((bpm) => (
                    <TableRow key={bpm.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                          onClick={() => {
                            const diagram = diagrams?.items.find(d => d.subProcess === bpm.name);
                            if (diagram) {
                              setSelectedDiagramId(diagram.id);
                              setCurrentSubProcess(bpm.name);
                              setIsWorkflowOpen(true);
                            } else {
                              createDiagramMutation.mutate(bpm.name);
                            }
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex flex-col cursor-pointer hover:bg-indigo-50/50 p-1 rounded transition-colors"
                          onClick={() => {
                            setSelectedBpmId(bpm.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <span className="font-bold text-indigo-600 hover:underline">{bpm.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">BPM ID: {bpm.id.substring(0,8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-xs">
                        {settings?.companyName || "PT BUMN SEjahtera"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                          {selectedGLRow?.entityCode || "ENT-01"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none font-bold">
                          {bpm.riskCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">
                          {bpm.controlCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus seluruh proses "${bpm.name}" beserta baris worksheet di dalamnya?`)) {
                              deleteBPMMutation.mutate(bpm.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {selectedGLRow && (
          <BPMModal 
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            noGL={selectedGLRow.noGL}
            glDesc={selectedGLRow.glDesc}
            fsliName={selectedFsli}
            bpmProcessId={selectedBpmId || undefined}
          />
        )}

        <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
          <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <WorkflowIcon className="h-5 w-5 text-indigo-600" />
                    BPM Workflow Editor: {currentSubProcess}
                  </DialogTitle>
                  <DialogDescription>
                    Mapping business processes, risks (RCM), and internal controls visually.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 border-t">
              {selectedDiagramId && (
                <BPMEditor 
                  diagramId={selectedDiagramId} 
                  subProcess={currentSubProcess}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreatingBPM} onOpenChange={setIsCreatingBPM}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New BPM Process</DialogTitle>
              <DialogDescription>
                Define a major process heading for <strong>{selectedGLRow?.noGL} - {selectedGLRow?.glDesc}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Process Name</Label>
                <Input 
                  placeholder="e.g. Penerimaan setoran tunai dari Nasabah" 
                  value={bpmName} 
                  onChange={e => setBpmName(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingBPM(false)}>Cancel</Button>
              <Button 
                disabled={!bpmName || createBPMMutation.isPending}
                onClick={() => createBPMMutation.mutate({ 
                  name: bpmName, 
                  noGL: selectedGLRow?.noGL || "",
                  fsliName: selectedFsli
                })}
              >
                Create Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
