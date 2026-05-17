import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Database, Loader2, Info, ChevronRight, ArrowRight,
  Workflow as WorkflowIcon, ShieldCheck, ShieldAlert,
  Calendar, Layers, Filter, CheckCircle2, AlertTriangle,
  Target, Fingerprint, Lock, PlusCircle, X as XIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLSnapshot, BPMProcess, User, BPMDiagram, Settings, AccountAssertion, MaterialitySimulation } from '@shared/types';
import { MOCK_DEPARTMENTS } from '@shared/mock-data';
import { BPMModal } from '@/components/bpm/BPMModal';
import { CSAModal } from '@/components/bpm/CSAModal';
import { BPMEditor } from '@/components/rcm/BPMEditor';
import { BPMAccountAssertion } from '@/components/bpm/BPMAccountAssertion';
import { BPMDiagramList } from '@/components/bpm/BPMDiagramList';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAccountAssertions } from '@/hooks/use-bpm';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import { PageHeader } from '@/components/layout/PageHeader';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

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
      const approved = [...list.items]
        .filter(s => s.status === 'Approved')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      if (approved) return approved;
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

  const { assertion: accountAssertion, isLoading: assertionLoading } = useAccountAssertions(
    selectedFsli, 
    selectedAccountKey.split(' ||| ')[0]
  );

  React.useEffect(() => {
    if (accountAssertion !== undefined) {
      if (accountAssertion === null) {
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

  const glLookupMap = React.useMemo(() => {
    if (!activeSnap || !activeSnap.rows) return new Map<string, string>();
    const map = new Map<string, string>();
    activeSnap.rows.forEach(r => {
      if (r.glDesc && r.fsliName) map.set(`desc:${r.glDesc}`, r.fsliName);
      if (r.noGL && r.fsliName) map.set(`no:${r.noGL}`, r.fsliName);
    });
    return map;
  }, [activeSnap]);

  const fsliNoUrutMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!activeSnap || !activeSnap.rows) return map;
    activeSnap.rows.forEach(r => {
      if (r.fsliName) {
        const currentMin = map.get(r.fsliName) ?? 999999;
        const rowNoUrut = r.noUrut ?? 999999;
        if (rowNoUrut < currentMin) map.set(r.fsliName, rowNoUrut);
      }
    });
    return map;
  }, [activeSnap]);

  const significantFsliNames = React.useMemo(() => {
    const names = new Set<string>();
    if (activeSim && activeSim.significantAccounts) {
      activeSim.significantAccounts.forEach(sa => { 
        if (sa.name) {
          const fsliNameFromMap = glLookupMap.get(`desc:${sa.name}`) || glLookupMap.get(`no:${sa.fsliCode}`);
          if (fsliNameFromMap) names.add(fsliNameFromMap);
          else names.add(sa.name);
        }
      });
    }
    const urlFsli = searchParams.get('fsli');
    if (urlFsli) names.add(urlFsli);
    return Array.from(names).sort((a, b) => {
      const orderA = fsliNoUrutMap.get(a) ?? 999999;
      const orderB = fsliNoUrutMap.get(b) ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [activeSim, glLookupMap, fsliNoUrutMap, searchParams]);

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

  const { departmentName, hasAccess } = React.useMemo(() => {
    if (!selectedGLRow || !activeSim || !currentUser) return { hasAccess: true, departmentName: "Finance & Accounting" };
    const assignment = activeSim.significantAccounts?.find(sa => 
      sa.name === selectedGLRow.fsliName || (sa.fsliCode && sa.fsliCode === selectedGLRow.fsliCode)
    );
    const deptIds = assignment?.assignedDepartmentIds || [];
    const deptName = deptIds.length > 0 
      ? deptIds.map(id => MOCK_DEPARTMENTS.find(d => d.id === id)?.name).filter(Boolean).join(", ")
      : "Unassigned";
    if (currentUser.role === 'Line 2' || currentUser.role === 'Admin') return { departmentName: deptName, hasAccess: true };
    const match = !!currentUser.departmentId && deptIds.includes(currentUser.departmentId);
    return { departmentName: deptName, hasAccess: match };
  }, [selectedGLRow, activeSim, currentUser]);

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
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 pb-10"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={<span className="font-display tracking-tight text-slate-900 font-extrabold">{t('title')}</span>} 
            description={t('description')}
            badge={
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1.5 py-1 px-3 font-bold uppercase tracking-widest text-[10px] rounded-md shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('common:cycles.cycleLabel', { year: viewYear })}
              </Badge>
            }
          >
            <div className="flex flex-col items-end gap-1.5">
              <Label htmlFor="cycle-year-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('common:cycles.complianceCycle')}</Label>
              <Select value={viewYear} onValueChange={handleYearChange}>
                <SelectTrigger id="cycle-year-select" className="w-[150px] h-10 bg-white border-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder={t('common:placeholders.year')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  {dynamicYears.map(y => (
                    <SelectItem key={y} value={y} className="text-xs font-bold uppercase">{t('common:cycles.yearCycle', { year: y })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PageHeader>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-slate-200 shadow-md bg-white rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <Label htmlFor="fsli-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                    <Database className="h-3.5 w-3.5 text-indigo-500" /> 1. {t('bpm:fsliLabel')}
                  </Label>
                  <Select 
                    value={selectedFsli} 
                    onValueChange={(v) => { 
                      if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                      setSelectedFsli(v); 
                      setSelectedAccountKey(""); 
                      setSelectedBpmId(null); 
                    }}
                  >
                    <SelectTrigger id="fsli-select" className="bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm">
                      <SelectValue placeholder={t('common:placeholders.choose')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-slate-200">
                      {significantFsliNames.map(f => (
                        <SelectItem key={f} value={f} className="text-xs font-bold uppercase">{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
                    <Search className="h-3.5 w-3.5 text-indigo-500" /> 2. {t('common:glAccount')}
                  </Label>
                  <Select 
                    value={selectedAccountKey} 
                    onValueChange={(v) => {
                      if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                      setSelectedAccountKey(v);
                    }} 
                    disabled={!selectedFsli}
                  >
                    <SelectTrigger id="account-select" className="bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm">
                      <SelectValue placeholder={t('common:placeholders.choose')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-slate-200">
                      {glNumbers.map(g => (
                        <SelectItem key={g.key} value={g.key} className="text-xs font-bold uppercase">{g.noGL} • {g.glDesc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-slate-400" /> {t('common:icofr.category')}
                  </Label>
                  <div className="h-10 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
                    {selectedGLRow?.category || "-"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" /> {t('common:icofr.subCategory')}
                  </Label>
                  <div className="h-10 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
                    {selectedGLRow?.subKategori || "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeSim && activeSim.status === 'Approved' ? (
            <motion.div 
              key="approved-banner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest">{t('bpm:baseline.status')}</p>
                <p className="text-xs font-medium text-emerald-700/80 leading-relaxed">{t('bpm:baseline.description', { year: viewYear })}</p>
              </div>
            </motion.div>
          ) : !snapLoading && (
            <motion.div 
              key="rejected-banner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50 border-slate-200"
            >
              <div className="h-14 w-14 bg-slate-100 text-slate-300 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white shadow-sm">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h3 className="text-md font-display font-bold text-slate-600 uppercase tracking-tight">{t('bpm:baseline.status')} {t('common:status.rejected')}</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mt-2 font-medium leading-relaxed px-6">
                {t('bpm:baseline.empty', { year: viewYear })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!activeSim ? null : !selectedAccountKey ? (
          <motion.div 
            variants={itemVariants}
            className="py-24 text-center border-2 border-dashed rounded-2xl bg-white border-slate-200 shadow-sm"
          >
            <div className="h-20 w-20 bg-indigo-50/50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/30">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tight mb-2">Ready to Map Process</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium leading-relaxed">
              Select an FSLI and GL Account from the selection panel above to begin mapping business processes, risks, and controls.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">1</div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">2</div>
            </div>
          </motion.div>
        ) : !hasAccess ? (
          <motion.div 
            variants={itemVariants}
            className="py-12 text-center border-2 border-rose-100 rounded-2xl bg-rose-50/30"
          >
            <div className="h-14 w-14 bg-rose-100 text-rose-300 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-display font-bold text-rose-900">{t('common:access.restricted')}</h3>
            <p className="text-rose-700/70 text-xs max-w-md mx-auto mt-2 leading-relaxed font-medium px-6">
              {t('common:access.assignedTo')} <strong className="text-rose-900 underline decoration-rose-200">{departmentName || "Departemen Lain"}</strong>. 
              {t('common:access.lini1Restricted')}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants}>
              <BPMAccountAssertion 
                localAssertion={localAssertion}
                assertionLoading={assertionLoading}
                isAssertionDirty={isAssertionDirty}
                onAssertionChange={handleAssertionChange}
                onSave={handleSaveAssertions}
                isSaving={updateAssertionMutation.isPending}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 w-full md:max-w-md relative group">
                  <Label htmlFor="bpm-search" className="sr-only">Search BPM Processes</Label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    id="bpm-search"
                    placeholder={t('searchPlaceholder')} 
                    className="pl-10 h-10 bg-slate-50 border-slate-200 text-sm font-medium rounded-lg focus:bg-white transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t('bpm:modal.owner')}</p>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                      <Target className="h-3 w-3 text-indigo-500" />
                      {departmentName || "Finance & Accounting"}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-100" />
                  <Button onClick={() => setIsCreatingBPM(true)} className="h-10 gap-2 bg-slate-900 hover:bg-slate-800 shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest px-6 rounded-lg">
                    <PlusCircle className="h-3.5 w-3.5" /> {t('createProcessButton')}
                  </Button>
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
            </motion.div>
          </motion.div>
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
          <DialogContent className="max-w-[98vw] w-[1600px] h-[98vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <WorkflowIcon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">BPM Workflow Editor: {currentSubProcess}</h2>
                </div>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] ml-[48px]">Mapping business processes, risks, and controls visually.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseDiagram} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
                 <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 bg-slate-50">
              {selectedDiagramId && <BPMEditor diagramId={selectedDiagramId} subProcess={currentSubProcess} workingYear={viewYear} />}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreatingBPM} onOpenChange={setIsCreatingBPM}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl rounded-xl overflow-hidden p-0">
            <div className="bg-slate-900 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="font-display text-xl tracking-tight">{t('bpm:createModalTitle')}</DialogTitle>
                <DialogDescription className="text-slate-400 text-[10px] uppercase tracking-wider mt-1">
                  Define a major process heading for <strong>{selectedGLRow?.noGL}</strong>.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">{t('bpm:processNameLabel')}</Label>
                <Input 
                  placeholder="e.g. Penerimaan setoran tunai" 
                  value={bpmName} 
                  onChange={e => setBpmName(e.target.value)} 
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsCreatingBPM(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">{t('common:actions.cancel')}</Button>
                <Button 
                  disabled={!bpmName || createBPMMutation.isPending} 
                  onClick={() => createBPMMutation.mutate({ name: bpmName, noGL: selectedGLRow?.noGL || "", fsliName: selectedFsli })}
                  className="h-10 px-6 bg-slate-900 hover:bg-slate-800 shadow-sm rounded-lg font-bold text-[10px] uppercase tracking-widest text-white"
                >
                  {createBPMMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  {t('bpm:createProcessButton')}
                </Button>
              </DialogFooter>
            </div>
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
      </motion.div>
    </AppLayout>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
