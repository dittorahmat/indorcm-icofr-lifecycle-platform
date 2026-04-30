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
  Workflow as WorkflowIcon, Save, ShieldCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLSnapshot, GLRow, BPMProcess, UserRole, MaterialitySimulation, User, BPMDiagram, Settings, AccountAssertion } from '@shared/types';
import { MOCK_DEPARTMENTS } from '@shared/mock-data';
import { BPMWorksheet } from '@/components/bpm/BPMWorksheet';
import { BPMModal } from '@/components/bpm/BPMModal';
import { CSAModal } from '@/components/bpm/CSAModal';
import { BPMEditor } from '@/components/rcm/BPMEditor';
import { toast } from 'sonner';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { cn } from '@/lib/utils';

export function BPMPage() {
  const { t } = useTranslation(['bpm', 'common', 'rcm']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedFsli, setSelectedFsli] = React.useState<string>("");
  const [selectedAccountKey, setSelectedAccountKey] = React.useState<string>("");
  const [selectedBpmId, setSelectedBpmId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCsaModalOpen, setIsCsaModalOpen] = React.useState(false);
  const [selectedBpmName, setSelectedBpmName] = React.useState("");
  const [viewYear, setViewYear] = React.useState<string>(searchParams.get('year') || "2025");

  const currentYear = new Date().getFullYear();
  const dynamicYears = React.useMemo(() => {
    const years = [];
    const startYear = 2024;
    const endYear = currentYear + 1;
    for (let y = startYear; y <= endYear; y++) {
      years.push(y.toString());
    }
    return years;
  }, [currentYear]);

  const selectedDiagramId = searchParams.get('diagramId');
  const isBpmEditorOpen = !!selectedDiagramId;
  const currentSubProcess = searchParams.get('subProcess') || "";

  const [isCreatingBPM, setIsCreatingBPM] = React.useState(false);
  const [bpmName, setBpmName] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [localAssertion, setLocalAssertion] = React.useState<Partial<AccountAssertion>>({});

  const handleOpenDiagram = (diagramId: string, subProcess: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('diagramId', diagramId);
      next.set('subProcess', subProcess);
      next.set('year', viewYear);
      return next;
    });
  };

  const handleCloseDiagram = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('diagramId');
      next.delete('subProcess');
      return next;
    });
  };

  // Sync viewYear with search params
  React.useEffect(() => {
    const yearParam = searchParams.get('year');
    if (yearParam && yearParam !== viewYear) {
      setViewYear(yearParam);
    }
  }, [searchParams, viewYear]);

  // Update URL when viewYear changes
  const handleYearChange = (year: string) => {
    setViewYear(year);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('year', year);
      return next;
    });
  };

  // Handle Deep Linking from Scoping
  React.useEffect(() => {
    const fsli = searchParams.get('fsli');
    const noGL = searchParams.get('noGL');
    const glDesc = searchParams.get('glDesc');
    const year = searchParams.get('year');

    if (fsli) setSelectedFsli(fsli);
    if (noGL && glDesc) {
      setSelectedAccountKey(`${noGL} ||| ${glDesc}`);
    }
    if (year) setViewYear(year);
  }, [searchParams]);

  // 1. Fetch Active Snapshot
  const { data: activeSnap, isLoading: snapLoading } = useQuery({
    queryKey: ['gl-snapshots-active'],
    queryFn: async () => {
      const list = await api<{ items: GLSnapshot[] }>('/api/gl-snapshots');
      const active = list.items.find(s => s.isActive);
      if (!active) return null;
      return api<GLSnapshot>(`/api/gl-snapshots/${active.id}`);
    }
  });

  // 1b. Fetch Active Simulation for Account Assignments - Filtered by viewYear & Status Approved
  const { data: activeSim } = useQuery({
    queryKey: ['active-simulation', viewYear],
    queryFn: async () => {
      const list = await api<{ items: MaterialitySimulation[] }>(`/api/simulations?year=${viewYear}`);
      // Filter ONLY Approved and get the latest by createdAt as the official baseline
      return [...list.items]
        .filter(s => s.status === 'Approved')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0] || null;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  // Fetch Account Assertions
  const { data: accountAssertion, isLoading: assertionLoading } = useQuery({
    queryKey: ['account-assertions', selectedFsli, selectedAccountKey],
    queryFn: async () => {
      if (!selectedFsli || !selectedAccountKey) return null;
      const noGL = selectedAccountKey.split(' ||| ')[0];
      const res = await api<AccountAssertion>(`/api/account-assertions?fsliName=${selectedFsli}&noGL=${noGL}`);
      setLocalAssertion(res || { assertionE: 'N', assertionC: 'N', assertionA: 'N', assertionCo: 'N', assertionRo: 'N', assertionVa: 'N', assertionPd: 'N' });
      return res;
    },
    enabled: !!selectedFsli && !!selectedAccountKey
  });

  const updateAssertionMutation = useMutation({
    mutationFn: (data: Partial<AccountAssertion>) => api('/api/account-assertions', {
      method: 'POST',
      body: JSON.stringify({
        fsliName: selectedFsli,
        noGL: selectedAccountKey.split(' ||| ')[0],
        ...data
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-assertions'] });
      toast.success("Account assertions updated");
    }
  });

  const isAssertionDirty = React.useMemo(() => {
    if (!accountAssertion) {
      return Object.values(localAssertion).some(v => v === 'Y');
    }
    return (
      localAssertion.assertionE !== (accountAssertion.assertionE || 'N') ||
      localAssertion.assertionC !== (accountAssertion.assertionC || 'N') ||
      localAssertion.assertionA !== (accountAssertion.assertionA || 'N') ||
      localAssertion.assertionCo !== (accountAssertion.assertionCo || 'N') ||
      localAssertion.assertionRo !== (accountAssertion.assertionRo || 'N') ||
      localAssertion.assertionVa !== (accountAssertion.assertionVa || 'N') ||
      localAssertion.assertionPd !== (accountAssertion.assertionPd || 'N')
    );
  }, [localAssertion, accountAssertion]);

  const blocker = useUnsavedChanges(isAssertionDirty);

  const handleAssertionChange = (field: keyof AccountAssertion, value: string) => {
    setLocalAssertion(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAssertions = () => {
    updateAssertionMutation.mutate(localAssertion);
  };

  // 2. Derive unique significant FSLIs based on Scoping Criteria with Auto-Healing
  const significantFsliNames = React.useMemo(() => {
    const names = new Set<string>();
    if (activeSim && activeSim.significantAccounts) {
      activeSim.significantAccounts.forEach(sa => { 
        if (sa.name) {
          // AUTO-HEALING: If sa.name is actually a GL Description (found in snapshot rows),
          // reconcile it back to the true FSLI Name.
          const glMatch = activeSnap?.rows.find(r => r.glDesc === sa.name || r.noGL === sa.fsliCode);
          if (glMatch && glMatch.fsliName) {
            names.add(glMatch.fsliName);
          } else {
            names.add(sa.name);
          }
        }
      });
    }
    const urlFsli = searchParams.get('fsli');
    if (urlFsli) names.add(urlFsli);
    return Array.from(names).sort();
  }, [activeSim, activeSnap, searchParams]);

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

  const selectedGLRow = React.useMemo(() => {
    if (!selectedAccountKey || !activeSnap) return null;
    const [noGL, glDesc] = selectedAccountKey.split(' ||| ');
    return activeSnap.rows.find(r => r.noGL === noGL && r.glDesc === glDesc);
  }, [selectedAccountKey, activeSnap]);

  // Authorization Logic
  const { assignedDeptId, departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) return { hasAccess: true, departmentName: "Finance & Accounting" };
    const assignment = activeSim.significantAccounts?.find(sa => 
      sa.name === selectedGLRow.fsliName || (sa.fsliCode && sa.fsliCode === selectedGLRow.fsliCode)
    );
    const deptId = assignment?.assignedDepartmentId;
    const deptName = MOCK_DEPARTMENTS.find(d => d.id === deptId)?.name || "Unassigned";
    if (currentUser.role === 'Line 2' || currentUser.role === 'Admin') return { assignedDeptId: deptId, departmentName: deptName, hasAccess: true };
    const match = currentUser.departmentId === deptId;
    return { assignedDeptId: deptId, departmentName: deptName, hasAccess: match };
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
    queryKey: ['bpm-diagrams', viewYear],
    queryFn: () => api<{ items: BPMDiagram[] }>(`/api/bpm-diagrams?year=${viewYear}`)
  });

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) => api<{ id: string }>('/api/bpm-diagrams', {
      method: 'POST',
      body: JSON.stringify({ 
        name: `Flow: ${subProcess}`, 
        subProcess,
        year: parseInt(viewYear)
      })
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      handleOpenDiagram(data.id, variables);
    }
  });

  const createBPMMutation = useMutation({
    mutationFn: (data: Partial<BPMProcess>) => api('/api/bpm-processes', { method: 'POST', body: JSON.stringify(data) }),
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

  const filteredBpmProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter(bpm => bpm.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [bpmProcesses, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1 px-3">
                <Shield className="h-3 w-3" />
                Fiscal Year: {viewYear}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Compliance Cycle</Label>
            <Select value={viewYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px] bg-white border-slate-200">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024 Cycle</SelectItem>
                <SelectItem value="2025">2025 Cycle</SelectItem>
                <SelectItem value="2026">2026 Cycle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Database className="h-3 w-3" /> 1. {t('bpm:fsliLabel')}
                </Label>
                <Select 
                  value={selectedFsli} 
                  onValueChange={(v) => { 
                    if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) {
                      return;
                    }
                    setSelectedFsli(v); 
                    setSelectedAccountKey(""); 
                    setSelectedBpmId(null); 
                  }}
                >
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
                  <Search className="h-3 w-3" /> 2. {t('common:glAccount', 'GL Account')}
                </Label>
                <Select 
                  value={selectedAccountKey} 
                  onValueChange={(v) => {
                    if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) {
                      return;
                    }
                    setSelectedAccountKey(v);
                  }} 
                  disabled={!selectedFsli}
                >
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

        {activeSim && activeSim.status === 'Approved' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{t('bpm:baseline.status')}</p>
              <p className="text-[10px] text-emerald-700">{t('bpm:baseline.description', { year: viewYear })}</p>
            </div>
          </div>
        ) : !snapLoading && (
          <div className="py-20 text-center border-2 border-dashed rounded-xl bg-orange-50/30 border-orange-100">
            <ShieldAlert className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-orange-800">{t('bpm:baseline.status')} Not Found</h3>
            <p className="text-orange-600/80 text-sm max-w-md mx-auto mt-2">
              {t('bpm:baseline.empty', { year: viewYear })}
            </p>
          </div>
        )}

        {!activeSim ? null : !selectedAccountKey ? (
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
          <div className="space-y-6">
            {/* Financial Assertion Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-indigo-50/50 py-3 px-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('assertions.title')}</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAssertionDirty && (
                      <Button size="sm" onClick={handleSaveAssertions} disabled={updateAssertionMutation.isPending} className="h-7 px-3 text-[10px] gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                        {updateAssertionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {t('common:actions.save')}
                      </Button>
                    )}
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 font-bold text-[10px]">{t('assertions.subtitle')}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TooltipProvider>
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="divide-x divide-slate-100">
                        <TableHead className="text-center w-[120px]">
                          <Tooltip>
                            <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                              <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.eo.label')}</span>
                              <Info className="h-3 w-3 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs"><strong>{t('assertions.tooltip.eo.label')}</strong></p>
                              <p className="text-[10px] mt-1">{t('assertions.tooltip.eo.desc')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <Tooltip>
                            <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                              <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.c.label')}</span>
                              <Info className="h-3 w-3 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs"><strong>{t('assertions.tooltip.c.label')}</strong></p>
                              <p className="text-[10px] mt-1">{t('assertions.tooltip.c.desc')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <Tooltip>
                            <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                              <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.a.label')}</span>
                              <Info className="h-3 w-3 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs"><strong>{t('assertions.tooltip.a.label')}</strong></p>
                              <p className="text-[10px] mt-1">{t('assertions.tooltip.a.desc')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <Tooltip>
                            <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                              <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.co.label')}</span>
                              <Info className="h-3 w-3 text-slate-400" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs"><strong>{t('assertions.tooltip.co.label')}</strong></p>
                              <p className="text-[10px] mt-1">{t('assertions.tooltip.co.desc')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                                <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.ro.label')}</span>
                                <Info className="h-3 w-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs"><strong>{t('assertions.tooltip.ro.label')}</strong></p>
                                <p className="text-[10px] mt-1">{t('assertions.tooltip.ro.desc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                                <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.va.label')}</span>
                                <Info className="h-3 w-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs"><strong>{t('assertions.tooltip.va.label')}</strong></p>
                                <p className="text-[10px] mt-1">{t('assertions.tooltip.va.desc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead className="text-center w-[120px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help flex items-center justify-center gap-1 mx-auto">
                                <span className="font-bold text-[10px] uppercase">{t('assertions.tooltip.pd.label')}</span>
                                <Info className="h-3 w-3 text-slate-400" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs"><strong>{t('assertions.tooltip.pd.label')}</strong></p>
                                <p className="text-[10px] mt-1">{t('assertions.tooltip.pd.desc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="divide-x divide-slate-100">
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionE || "N"} onValueChange={(v) => handleAssertionChange('assertionE', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionC || "N"} onValueChange={(v) => handleAssertionChange('assertionC', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionA || "N"} onValueChange={(v) => handleAssertionChange('assertionA', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionCo || "N"} onValueChange={(v) => handleAssertionChange('assertionCo', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionRo || "N"} onValueChange={(v) => handleAssertionChange('assertionRo', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionVa || "N"} onValueChange={(v) => handleAssertionChange('assertionVa', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-0">
                          <Select value={localAssertion.assertionPd || "N"} onValueChange={(v) => handleAssertionChange('assertionPd', v)} disabled={assertionLoading}>
                            <SelectTrigger className="h-10 border-none rounded-none focus:ring-0 text-xs shadow-none text-center font-bold">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Y">{t('common:yes')}</SelectItem>
                              <SelectItem value="N">{t('common:no')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </CardContent>
            </Card>

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
                        <p className="text-sm text-slate-500 italic">{searchTerm ? `Tidak ditemukan sub proses "${searchTerm}"` : 'Belum ada sub proses.'}</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBpmProcesses.map((bpm) => (
                    <TableRow key={bpm.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-100"
                                  onClick={() => {
                                    const diagram = diagrams?.items.find(d => d.subProcess === bpm.name);
                                    if (diagram) handleOpenDiagram(diagram.id, bpm.name);
                                    else createDiagramMutation.mutate(bpm.name);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open Visual Workflow Editor</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100"
                                  onClick={() => {
                                    setSelectedBpmId(bpm.id);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open RCM Worksheet (Spreadsheet)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="flex flex-col cursor-pointer p-1 rounded group/name" 
                                onClick={() => { 
                                  setSelectedBpmId(bpm.id); 
                                  setSelectedBpmName(bpm.name);
                                  setIsCsaModalOpen(true); 
                                }}
                              >
                                <span className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5">
                                  {bpm.name}
                                  <ShieldCheck className="h-3 w-3 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">BPM ID: {bpm.id.substring(0,8)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Run Control Self Assessment (CSA)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-xs">{settings?.companyName || "PT BUMN SEjahtera"}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px] bg-slate-50">{selectedGLRow?.entityCode || "ENT-01"}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className="bg-orange-100 text-orange-700 font-bold">{bpm.riskCount || 0}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className="bg-green-100 text-green-700 font-bold">{bpm.controlCount || 0}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); if (confirm(`Hapus proses "${bpm.name}"?`)) deleteBPMMutation.mutate(bpm.id); }}>
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

        <Dialog open={isBpmEditorOpen} onOpenChange={(open) => !open && handleCloseDiagram()}>
          <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <WorkflowIcon className="h-5 w-5 text-indigo-600" />
                BPM Workflow Editor: {currentSubProcess}
              </DialogTitle>
              <DialogDescription>Mapping business processes, risks, and controls visually.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 border-t">
              {selectedDiagramId && <BPMEditor diagramId={selectedDiagramId} subProcess={currentSubProcess} workingYear={viewYear} />}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreatingBPM} onOpenChange={setIsCreatingBPM}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New BPM Process</DialogTitle>
              <DialogDescription>Define a major process heading for <strong>{selectedGLRow?.noGL}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500">Process Name</Label>
                <Input placeholder="e.g. Penerimaan setoran tunai" value={bpmName} onChange={e => setBpmName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingBPM(false)}>Cancel</Button>
              <Button disabled={!bpmName || createBPMMutation.isPending} onClick={() => createBPMMutation.mutate({ name: bpmName, noGL: selectedGLRow?.noGL || "", fsliName: selectedFsli })}>Create Process</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <UnsavedChangesDialog blocker={blocker} />

        {selectedGLRow && (
          <CSAModal
            isOpen={isCsaModalOpen}
            onOpenChange={setIsCsaModalOpen}
            noGL={selectedGLRow.noGL}
            subProcessName={selectedBpmName}
          />
        )}
      </div>
    </AppLayout>
  );
}
