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
  Workflow as WorkflowIcon, Save, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLSnapshot, GLRow, BPMProcess, UserRole, MaterialitySimulation, User, BPMDiagram, Settings, AccountAssertion } from '@shared/types';
import { MOCK_DEPARTMENTS } from '@shared/mock-data';
import { BPMWorksheet } from '@/components/bpm/BPMWorksheet';
import { BPMModal } from '@/components/bpm/BPMModal';
import { CSAModal } from '@/components/bpm/CSAModal';
import { BPMEditor } from '@/components/rcm/BPMEditor';
import { BPMAccountAssertion } from '@/components/bpm/BPMAccountAssertion';
import { BPMDiagramList } from '@/components/bpm/BPMDiagramList';
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
import { useActiveSnapshot, useActiveSimulation, useAccountAssertions, useBpmProcesses, useBpmDiagrams } from '@/hooks/use-bpm';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { cn } from '@/lib/utils';

import { PageHeader } from '@/components/layout/PageHeader';

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

  // 1b. Fetch Active Simulation for Account Assignments - Filtered by viewYear
  const { data: activeSim } = useQuery({
    queryKey: ['active-simulation', viewYear],
    queryFn: async () => {
      const list = await api<{ items: MaterialitySimulation[] }>(`/api/simulations?year=${viewYear}`);
      if (list.items.length === 0) return null;

      // Priority 1: Latest Approved
      const approved = [...list.items]
        .filter(s => s.status === 'Approved')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      
      if (approved) return approved;

      // Priority 2: Latest regardless of status (Draft/Pending)
      return [...list.items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
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
  const { assertion: accountAssertion, isLoading: assertionLoading, updateAssertion } = useAccountAssertions(
    selectedFsli, 
    selectedAccountKey.split(' ||| ')[0]
  );

  // Sync local assertion state when data is loaded
  React.useEffect(() => {
    if (accountAssertion !== undefined) {
      if (accountAssertion === null) {
        // Initialize with 'N' if no record found
        setLocalAssertion({ 
          assertionE: 'N', assertionC: 'N', assertionA: 'N', 
          assertionCo: 'N', assertionRo: 'N', assertionVa: 'N', 
          assertionPd: 'N' 
        });
      } else {
        setLocalAssertion(accountAssertion);
      }
    }
  }, [accountAssertion]);

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

  // 0. Build lookup map for GL rows to speed up auto-healing and filter logic
  const glLookupMap = React.useMemo(() => {
    if (!activeSnap || !activeSnap.rows) return new Map<string, string>();
    const map = new Map<string, string>();
    activeSnap.rows.forEach(r => {
      if (r.glDesc && r.fsliName) map.set(`desc:${r.glDesc}`, r.fsliName);
      if (r.noGL && r.fsliName) map.set(`no:${r.noGL}`, r.fsliName);
    });
    return map;
  }, [activeSnap]);

  // 0b. Build FSLI -> Min noUrut map for hierarchical sorting
  const fsliNoUrutMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!activeSnap || !activeSnap.rows) return map;
    
    activeSnap.rows.forEach(r => {
      if (r.fsliName) {
        const currentMin = map.get(r.fsliName) ?? 999999;
        const rowNoUrut = r.noUrut ?? 999999;
        if (rowNoUrut < currentMin) {
          map.set(r.fsliName, rowNoUrut);
        }
      }
    });
    return map;
  }, [activeSnap]);

  // 2. Derive unique significant FSLIs based on Scoping Criteria with Auto-Healing & Hierarchical Sorting
  const significantFsliNames = React.useMemo(() => {
    const names = new Set<string>();
    if (activeSim && activeSim.significantAccounts) {
      activeSim.significantAccounts.forEach(sa => { 
        if (sa.name) {
          // AUTO-HEALING: Use lookup map instead of .find() for O(1) lookup
          const fsliNameFromMap = glLookupMap.get(`desc:${sa.name}`) || glLookupMap.get(`no:${sa.fsliCode}`);
          if (fsliNameFromMap) {
            names.add(fsliNameFromMap);
          } else {
            names.add(sa.name);
          }
        }
      });
    }
    const urlFsli = searchParams.get('fsli');
    if (urlFsli) names.add(urlFsli);

    // Hierarchical sort based on noUrut (consistent with ScopingPage)
    const result = Array.from(names).sort((a, b) => {
      const orderA = fsliNoUrutMap.get(a) ?? 999999;
      const orderB = fsliNoUrutMap.get(b) ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
    
    return result;
  }, [activeSim, glLookupMap, fsliNoUrutMap, searchParams]);

  // 3. Filtered GL Numbers (Unique combination of noGL + glDesc)
  const glNumbers = React.useMemo(() => {
    if (!activeSnap || !activeSnap.rows || !selectedFsli) return [];
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
    if (!selectedAccountKey || !activeSnap || !activeSnap.rows) return null;
    const [noGL, glDesc] = selectedAccountKey.split(' ||| ');
    return activeSnap.rows.find(r => r.noGL === noGL && r.glDesc === glDesc);
  }, [selectedAccountKey, activeSnap]);

  // Authorization Logic
  const { assignedDeptIds, departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) return { hasAccess: true, departmentName: "Finance & Accounting" };
    const assignment = activeSim.significantAccounts?.find(sa => 
      sa.name === selectedGLRow.fsliName || (sa.fsliCode && sa.fsliCode === selectedGLRow.fsliCode)
    );
    const deptIds = assignment?.assignedDepartmentIds || [];
    const deptName = deptIds.length > 0 
      ? deptIds.map(id => MOCK_DEPARTMENTS.find(d => d.id === id)?.name).filter(Boolean).join(", ")
      : "Unassigned";
    
    if (currentUser.role === 'Line 2' || currentUser.role === 'Admin') return { assignedDeptIds: deptIds, departmentName: deptName, hasAccess: true };
    
    const match = !!currentUser.departmentId && deptIds.includes(currentUser.departmentId);
    return { assignedDeptIds: deptIds, departmentName: deptName, hasAccess: match };
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
      toast.success(t('common:notifications.created'));
    }
  });

  const deleteBPMMutation = useMutation({
    mutationFn: (id: string) => api(`/api/bpm-processes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      setSelectedBpmId(null);
      toast.success(t('common:notifications.deleted'));
    }
  });

  const filteredBpmProcesses = React.useMemo(() => {
    if (!bpmProcesses?.items) return [];
    return bpmProcesses.items.filter(bpm => bpm.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [bpmProcesses, searchTerm]);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <PageHeader 
          title={t('title')} 
          description={t('description')}
          badge={
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1 px-3">
              <Shield className="h-3 w-3" />
              Fiscal Year: {viewYear}
            </Badge>
          }
        >
          <div className="flex flex-col items-end gap-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Cycle</Label>
            <Select value={viewYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px] bg-white border-slate-200">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {dynamicYears.map(y => (
                  <SelectItem key={y} value={y}>{t('common:cycles.yearCycle', { year: y })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PageHeader>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
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
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
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
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('common:icofr.category')}</Label>
                <div className="h-10 px-3 flex items-center border rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                  {selectedGLRow?.category || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('common:icofr.subCategory')}</Label>
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
              <p className="text-xs text-emerald-700">{t('bpm:baseline.description', { year: viewYear })}</p>
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
            <p className="text-slate-500 font-medium">{t('bpm:emptyState')}</p>
          </div>
        ) : !hasAccess ? (
          <div className="py-20 text-center border-2 border-red-100 rounded-xl bg-red-50/30">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800">{t('common:access.restricted')}</h3>
            <p className="text-red-600/80 text-sm max-w-md mx-auto mt-2">
              {t('common:access.assignedTo')} <strong>{departmentName || "Departemen Lain"}</strong>. 
              {t('common:access.lini1Restricted')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <BPMAccountAssertion 
              localAssertion={localAssertion}
              assertionLoading={assertionLoading}
              isAssertionDirty={isAssertionDirty}
              onAssertionChange={handleAssertionChange}
              onSave={handleSaveAssertions}
              isSaving={updateAssertion.isPending}
            />

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
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner Unit</p>
                  <p className="text-xs font-bold text-slate-600">{departmentName || "Finance & Accounting"}</p>
                </div>
                {(currentUser?.role === 'Line 2' || currentUser?.role === 'Admin' || hasAccess) && (
                  <Button onClick={() => setIsCreatingBPM(true)} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                    <Plus className="h-4 w-4" /> {t('createButton')}
                  </Button>
                )}
              </div>
            </div>

            <BPMDiagramList 
              bpmLoading={bpmLoading}
              filteredBpmProcesses={filteredBpmProcesses}
              diagrams={diagrams}
              settings={settings}
              selectedGLRow={selectedGLRow}
              onOpenDiagram={handleOpenDiagram}
              onCreateDiagram={(name) => createDiagramMutation.mutate(name)}
              onOpenWorksheet={(id, name) => {
                setSelectedBpmId(id);
                setSelectedBpmName(name);
                setIsModalOpen(true);
              }}
              onDeleteProcess={(id, name) => {
                if (confirm(t('bpm:deleteConfirm', { name }))) {
                  deleteBPMMutation.mutate(id);
                }
              }}
              searchTerm={searchTerm}
            />
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
            subProcessName={selectedBpmName}
            year={viewYear}
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
              <DialogTitle>{t('bpm:createModalTitle')}</DialogTitle>
              <DialogDescription>Define a major process heading for <strong>{selectedGLRow?.noGL}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500">{t('bpm:processNameLabel')}</Label>
                <Input placeholder="e.g. Penerimaan setoran tunai" value={bpmName} onChange={e => setBpmName(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingBPM(false)}>{t('common:actions.cancel')}</Button>
              <Button disabled={!bpmName || createBPMMutation.isPending} onClick={() => createBPMMutation.mutate({ name: bpmName, noGL: selectedGLRow?.noGL || "", fsliName: selectedFsli })}>{t('bpm:createProcessButton')}</Button>
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
            bpmProcessId={selectedBpmId || undefined}
          />
        )}
      </div>
    </AppLayout>
  );
}
