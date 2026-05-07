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
  MaterialitySimulation, GLRow, GLSnapshot, QualitativeLevel, UserRole, SimulationStatus, Department, Application 
} from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Save, Loader2, Trash2, Upload, ArrowLeft, Send, History, ShieldCheck, Settings2, Info,
  Database, LayoutGrid, FileSpreadsheet, AlertTriangle, CheckCircle2, Building2
} from 'lucide-react';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { ScopingHealthDashboard } from '@/components/scoping/ScopingHealthDashboard';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { GLSourceTable } from '@/components/scoping/GLSourceTable';
import { SimulationListTable } from '@/components/scoping/SimulationListTable';
import { SetBenchmarkModal } from '@/components/scoping/SetBenchmarkModal';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  parseBalance, 
  detectGLColumns, 
  filterEmptyRows,
  validateGLMapping,
  calculateBenchmarkValue,
  getGroupMultiplier
} from '@/lib/compliance-utils';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function ScopingPage() {
  const { t } = useTranslation('scoping');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSimId = searchParams.get('id');
  const [filterYear, setFilterYear] = React.useState<string>("2025"); // Default to 2025
  
  const currentYear = new Date().getFullYear();
  const dynamicYears = React.useMemo(() => {
    const years = [];
    const startYear = 2024; // Baseline awal sistem
    const endYear = currentYear + 1; // Beri buffer 1 tahun ke depan
    for (let y = startYear; y <= endYear; y++) {
      years.push(y.toString());
    }
    return years;
  }, [currentYear]);

  const [isCreating, setIsCreating] = React.useState(false);
  const [benchmarkModalSnap, setBenchmarkModalSnap] = React.useState<GLSnapshot | null>(null);

  const { data: simulations, isLoading: simLoading } = useQuery({
    queryKey: ['simulations', filterYear],
    queryFn: () => api<{ items: MaterialitySimulation[] }>(`/api/simulations?year=${filterYear}`),
  });

  const { data: snapshots, isLoading: snapsLoading } = useQuery({
    queryKey: ['gl-snapshots'],
    queryFn: () => api<{ items: GLSnapshot[] }>('/api/gl-snapshots'),
  });

  const activeSnapshot = snapshots?.items.find(s => s.isActive);

  const createSimMutation = useMutation({
    mutationFn: (data: Partial<MaterialitySimulation>) => api<MaterialitySimulation>('/api/simulations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (newSim) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setSearchParams({ id: newSim.id });
      setIsCreating(false);
      toast.success(t('common:notifications.created'));
    }
  });

  const deleteSimMutation = useMutation({
    mutationFn: (id: string) => api(`/api/simulations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success(t('common:notifications.deleted'));
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/gl-snapshots/${id}/set-active`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success(t('common:notifications.updated'));
    }
  });

  const deleteSnapMutation = useMutation({
    mutationFn: (id: string) => api(`/api/gl-snapshots/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
      toast.success(t('common:notifications.deleted'));
    }
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
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
            ymd: String(r[mapping.period] || ''), 
            entityCode: String(r[mapping.entityCode] || ''),
            noGL: String(r[mapping.accountCode] || ''), 
            glDesc: String(r[mapping.accountName] || ''),
            currency: String(r[mapping.currency] || 'IDR'), 
            balance: parsedBal.success ? parsedBal.value : 0,
            fsliCode: String(r[mapping.fsliCode] || ''), 
            fsliName: String(r[mapping.fsliName] || ''),
            kategori: String(r[mapping.kategori] || ''), 
            subKategori: String(r[mapping.subKategori] || ''),
            fsliBalance: parsedFsliBal.success ? parsedFsliBal.value : 0, 
            noUrut: parseInt(String(r[mapping.noUrut] || '0')) || 0
          };
        }).filter(r => r.glDesc); // Only require description, allow empty No_GL for summary rows
        if (rows.length === 0) { toast.error(t('common:notifications.error')); return; }
        const snap = await api<GLSnapshot>('/api/gl-snapshots', { method: 'POST', body: JSON.stringify({ filename: file.name, rows }) });
        queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
        setBenchmarkModalSnap(snap);
        toast.success(t('common:notifications.success'));
      } catch (err) { console.error("Parse error:", err); toast.error(t('common:notifications.error')); }
    };
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  }, [queryClient, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] } 
  });

  if (selectedSimId) {
    const sim = simulations?.items.find(s => s.id === selectedSimId);
    if (sim) return <ScopingEditor simulation={sim} onBack={() => navigate('/scoping')} />;
  }

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t('title')}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm">{t('description')}</p>
              {activeSnapshot && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "gap-1.5 font-bold transition-colors",
                    activeSnapshot.status === 'Mapped' 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                  )}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> 
                    {t('activeSource')}: {activeSnapshot.filename} ({activeSnapshot.status})
                  </Badge>
                  {activeSnapshot.status === 'Draft' && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-6 text-amber-600 font-bold p-0 flex items-center gap-1 hover:text-amber-700 underline underline-offset-4"
                      onClick={() => setBenchmarkModalSnap(activeSnapshot)}
                    >
                      <Settings2 className="h-3 w-3" /> {t('setBenchmark')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicYears.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button variant="outline" className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5">
                  <Upload className="h-4 w-4" /> Upload GL
                </Button>
              </div>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="gap-2 shadow-lg shadow-primary/20" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped'}
              >
                <Plus className="h-4 w-4" /> New Simulation
              </Button>
            </div>
            {!activeSnapshot && <p className="text-[10px] text-muted-foreground italic">Upload a GL file to start</p>}
            {activeSnapshot && activeSnapshot.status === 'Draft' && (
              <p className="text-[10px] text-amber-600 font-medium italic flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" /> Set benchmark first to enable simulations
              </p>
            )}
          </div>
        </div>

        <Tabs defaultValue="simulations" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="simulations" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> {t('simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2">
              <Database className="h-4 w-4" /> Master Data GL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulations">
            <SimulationListTable 
              data={simulations?.items || []} 
              onSelect={(id) => setSearchParams({ id })} 
              onDelete={deleteSimMutation.mutate} 
              isLoading={simLoading}
            />
          </TabsContent>

          <TabsContent value="master-gl">
            <div className="flex justify-end mb-4">
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2 opacity-50 hover:opacity-100 transition-opacity"
                onClick={() => {
                  if (confirm("This will permanently delete ALL simulations and GL snapshots. Continue?")) {
                    api('/api/dev/purge-scoping', { method: 'DELETE' }).then(() => {
                      queryClient.invalidateQueries();
                      toast.success("All data purged. Fresh start!");
                    });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Reset Scoping Data
              </Button>
            </div>
            <GLSourceTable 
              data={snapshots?.items || []} 
              onSetActive={setActiveMutation.mutate}
              onSetBenchmark={setBenchmarkModalSnap}
              onDelete={deleteSnapMutation.mutate}
              isLoading={snapsLoading}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('simulation.createNew')}</DialogTitle>
              <DialogDescription>
                {t('simulation.basisDescription', { filename: activeSnapshot?.filename })}
              </DialogDescription>
            </DialogHeader>
            <SimulationInitialForm 
              activeSnap={activeSnapshot || null}
              onSubmit={(data) => createSimMutation.mutate({ ...data, glSnapshotId: activeSnapshot?.id })} 
              isPending={createSimMutation.isPending}
              yearOptions={dynamicYears}
            />
          </DialogContent>
        </Dialog>

        <SetBenchmarkModal 
          snapshot={benchmarkModalSnap} 
          isOpen={!!benchmarkModalSnap} 
          onOpenChange={(open) => !open && setBenchmarkModalSnap(null)} 
        />
      </div>
    </AppLayout>
  );
}

function SimulationInitialForm({ activeSnap, onSubmit, isPending, yearOptions }: { activeSnap: GLSnapshot | null, onSubmit: (data: any) => void, isPending: boolean, yearOptions: string[] }) {
  const { t } = useTranslation('scoping');
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());
  const [basis, setBasis] = React.useState<string>("");
  const [locations, setLocations] = React.useState(1);

  React.useEffect(() => {
    if (activeSnap?.benchmarkFsliNames?.length && !basis) {
      setBasis(activeSnap.benchmarkFsliNames[0]);
    }
  }, [activeSnap, basis]);

  const defaultOm = 5; // Default to 5% for FSLI based

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.name')}</Label>
          <Input placeholder={t('form.namePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.year')}</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.benchmark')}</Label>
          {activeSnap?.benchmarkFsliNames?.length ? (
            <Select value={basis} onValueChange={setBasis}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeSnap.benchmarkFsliNames.map(fsli => (
                  <SelectItem key={fsli} value={fsli}>{fsli}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 border rounded-md bg-amber-50 text-[10px] text-amber-700 flex gap-1 items-start">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>No benchmarks defined in Master Data GL.</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.locations')}</Label>
          <Input type="number" min={1} value={locations} onChange={e => setLocations(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-[10px] text-blue-700 leading-relaxed italic">
          Multiplier: <strong>{getGroupMultiplier(locations)}x</strong>.
          Default OM: <strong>{defaultOm}%</strong>.
        </p>
      </div>
      <Button className="w-full mt-2" disabled={!name || !basis || !year || isPending} onClick={() => onSubmit({ name, year: parseInt(year), basis, omPercentage: defaultOm, haircutPercentage: 25, locationCount: locations })}>
        {isPending ? "Creating..." : t('form.initialize')}
      </Button>
    </div>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const { t } = useTranslation('scoping');
  const queryClient = useQueryClient();
  const [simState, setSimState] = React.useState(simulation);
  const [glData, setGlData] = React.useState<GLRow[]>([]);
  const [localAppMappings, setLocalAppMappings] = React.useState<Record<string, string[]>>({});
  const [localDeptMappings, setLocalDeptMappings] = React.useState<Record<string, string[]>>({});

  // Fetch applications library
  const { data: appsData } = useQuery({
    queryKey: ['applications-all'],
    queryFn: () => api<{ items: (Application & { linkedControlCount?: number })[] }>('/api/applications'),
  });

  // Fetch initial mappings
  const { data: initialMappings } = useQuery({
    queryKey: ['sim-app-mappings', simulation.id],
    queryFn: () => api<{ items: any[] }>(`/api/simulations/${simulation.id}/account-applications`),
    enabled: !!simulation.id
  });

  React.useEffect(() => {
    if (initialMappings?.items) {
      const map: Record<string, string[]> = {};
      initialMappings.items.forEach(m => {
        if (!map[m.accountCode]) map[m.accountCode] = [];
        map[m.accountCode].push(m.applicationId);
      });
      setLocalAppMappings(map);
    }
  }, [initialMappings]);

  // Initialize department mappings from simulation data
  React.useEffect(() => {
    if (simulation.significantAccounts) {
      const map: Record<string, string[]> = {};
      simulation.significantAccounts.forEach(sa => {
        if (sa.fsliCode && sa.assignedDepartmentIds) {
          map[sa.fsliCode] = sa.assignedDepartmentIds;
        }
      });
      setLocalDeptMappings(map);
    }
  }, [simulation]);

  // Track if changes have been made but not saved
  const isDirty = React.useMemo(() => {
    const initialDeptMappings: Record<string, string[]> = {};
    simulation.significantAccounts?.forEach(sa => {
      if (sa.fsliCode && sa.assignedDepartmentIds) {
        initialDeptMappings[sa.fsliCode] = sa.assignedDepartmentIds;
      }
    });

    return JSON.stringify({
      assessmentData: simState.assessmentData,
      locationCount: simState.locationCount,
      omPercentage: simState.omPercentage,
      haircutPercentage: simState.haircutPercentage,
      basis: simState.basis,
      appMappings: localAppMappings,
      deptMappings: localDeptMappings
    }) !== JSON.stringify({
      assessmentData: simulation.assessmentData,
      locationCount: simulation.locationCount,
      omPercentage: simulation.omPercentage,
      haircutPercentage: simulation.haircutPercentage,
      basis: simulation.basis,
      appMappings: {}, // Simplified for now
      deptMappings: initialDeptMappings
    });
  }, [simState, simulation, localAppMappings, localDeptMappings]);

  const blocker = useUnsavedChanges(isDirty);

  React.useEffect(() => {
    setSimState(simulation);
  }, [simulation]);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: Department[] }>('/api/departments'),
  });

  const isLocked = simState.status === 'Approved' || simState.status === 'Pending CFO' || simState.status === 'Pending Komut';

  const mergedGlData = React.useMemo(() => {
    return glData.map(row => {
      return {
        ...row,
        assignedDepartmentIds: localDeptMappings[row.noGL] || []
      };
    });
  }, [glData, localDeptMappings]);

  const { data: snapshot } = useQuery({
    queryKey: ['gl-snapshot', simState.glSnapshotId],
    queryFn: () => api<GLSnapshot>(`/api/gl-snapshots/${simState.glSnapshotId}`),
    enabled: !!simState.glSnapshotId
  });

  React.useEffect(() => {
    if (snapshot) setGlData(snapshot.rows);
  }, [snapshot]);

  const calculateValues = React.useMemo(() => {
    if (glData.length === 0 || !snapshot) return { omValue: 0, pmValue: 0, multiplier: 1, benchmarkValue: 0 };
    const benchmarkValue = calculateBenchmarkValue(glData, simState.basis);
    const multiplier = getGroupMultiplier(simState.locationCount || 1);
    const baseOM = (benchmarkValue * simState.omPercentage) / 100;
    const omValue = baseOM * multiplier;
    const pmValue = omValue * (1 - simState.haircutPercentage / 100);
    return { omValue, pmValue, multiplier, benchmarkValue };
  }, [glData, snapshot, simState.basis, simState.omPercentage, simState.haircutPercentage, simState.locationCount]);

  const { omValue, pmValue, multiplier, benchmarkValue } = calculateValues;

  const significantAccounts = React.useMemo(() => {
    return mergedGlData.filter(row => {
      const assessments = simState.assessmentData?.[row.fsliName || ''] || {};
      const isQualSignificant = Object.values(assessments).some(v => v === 'High');
      const isKuanSignificant = Math.abs(row.balance) >= pmValue;
      return isQualSignificant || isKuanSignificant;
    }).map(row => ({
      name: row.fsliName || "Unmapped FSLI",
      balance: row.balance,
      isQuantitative: Math.abs(row.balance) >= pmValue,
      fsliCode: row.fsliCode || row.noGL, // Prefer FSLI code, fallback to noGL for unique ID
      assignedDepartmentIds: localDeptMappings[row.noGL] || []
    }));
  }, [mergedGlData, simState.assessmentData, pmValue, localDeptMappings]);

  const updateSimMutation = useMutation({
    mutationFn: async (data: Partial<MaterialitySimulation>) => {
      // 1. Save core simulation data (including significantAccounts with department IDs)
      await api(`/api/simulations/${simState.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...data, omValue, pmValue, significantAccounts }) 
      });

      // 2. Sync application mappings
      const mappings = Object.entries(localAppMappings).map(([accountCode, applicationIds]) => ({
        accountCode,
        applicationIds
      }));
      await api(`/api/simulations/${simState.id}/account-applications/sync`, {
        method: 'POST',
        body: JSON.stringify({ mappings })
      });

      // 3. Sync department mappings to gl_rows for access control
      // This is crucial because BPM access depends on gl_rows table
      const deptMappingsToSync = Object.entries(localDeptMappings).map(([noGL, departmentIds]) => ({
        noGL,
        departmentIds
      }));
      await api(`/api/simulations/${simState.id}/account-departments/sync`, {
        method: 'POST',
        body: JSON.stringify({ mappings: deptMappingsToSync })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      queryClient.invalidateQueries({ queryKey: ['sim-app-mappings', simulation.id] });
      queryClient.invalidateQueries({ queryKey: ['gl-snapshot', simState.glSnapshotId] });
      queryClient.invalidateQueries({ queryKey: ['applications-all'] });
      toast.success("Simulation, App & Owner Mappings saved");
    }
  });

  const submitSimMutation = useMutation({
    mutationFn: () => 
      api<MaterialitySimulation>(`/api/simulations/${simState.id}/submit`, { 
        method: 'POST',
        body: JSON.stringify({ ...simState, omValue, pmValue, significantAccounts })
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setSimState(updated);
      toast.success("Simulation submitted to CFO");
    }
  });

  const addAppMutation = useMutation({
    mutationFn: (name: string) => api<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ name, isSignificant: true })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications-all'] });
      toast.success("New application added to library");
    }
  });

  const handleAssessmentChange = (fsliName: string, ruleId: number, level: QualitativeLevel) => {
    if (isLocked) return;
    setSimState(prev => {
      const currentData = prev.assessmentData || {};
      const fsliData = currentData[fsliName] || {};
      return { ...prev, assessmentData: { ...currentData, [fsliName]: { ...fsliData, [ruleId]: level } } };
    });
  };

  const handleOwnerAcceptanceChange = async (noGL: string, acceptance: "Accepted" | "Rejected") => {
    if (isLocked) return;
    try {
      await api(`/api/gl-rows/${noGL}/owner-acceptance`, { method: 'PUT', body: JSON.stringify({ ownerAcceptance: acceptance }) });
      toast.success(`Owner acceptance updated to ${acceptance}`);
      queryClient.invalidateQueries({ queryKey: ['gl-snapshot', simState.glSnapshotId] });
    } catch (error) {
      toast.error("Failed to update owner acceptance");
    }
  };

  const [isPendingUpdate, startTransition] = React.useTransition();

  const handleAssignDepartments = React.useCallback((accountName: string, departmentIds: string[]) => {
    if (isLocked) return;
    startTransition(() => {
      setLocalDeptMappings(prev => ({ ...prev, [accountName]: departmentIds }));
    });
  }, [isLocked]);

  const handleAppsChange = React.useCallback((accountCode: string, appIds: string[]) => {
    if (isLocked) return;
    startTransition(() => {
      setLocalAppMappings(prev => ({ ...prev, [accountCode]: appIds }));
    });
  }, [isLocked]);

  const handleQuickAddApp = async (name: string, accountCode: string) => {
    try {
      const newApp = await addAppMutation.mutateAsync(name);
      if (newApp?.id) {
        setLocalAppMappings(prev => ({
          ...prev,
          [accountCode]: [...(prev[accountCode] || []), newApp.id]
        }));
      }
    } catch (error) {
      console.error("Failed to quick add app:", error);
    }
  };


  return (
    <AppLayout container>
      {/* Unsaved Changes Confirmation */}
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your scoping assessment. If you leave now, these changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay & Save
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => blocker.proceed?.()}
            >
              Leave Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center text-slate-900 dark:text-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{simState.name}</h1>
                <StatusBadge status={simState.status} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500" />
                Source: {snapshot?.filename || 'Loading...'} | Basis: {simState.basis}
              </p>
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
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" /> Scoping Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Significant Locations</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    disabled={isLocked} 
                    value={simState.locationCount ?? 1} 
                    onChange={e => setSimState(s => ({ ...s, locationCount: Number(e.target.value) }))} 
                  />
                  <p className="text-[9px] text-blue-600 italic">Multiplier: {multiplier}x</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">% OM (Overall Materiality)</Label>
                  <Input 
                    type="number" 
                    step={0.1} 
                    disabled={isLocked} 
                    value={simState.omPercentage ?? 0} 
                    onChange={e => setSimState(s => ({ ...s, omPercentage: Number(e.target.value) }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">% Haircut (PM)</Label>
                  <Input 
                    type="number" 
                    disabled={isLocked} 
                    value={simState.haircutPercentage ?? 0} 
                    onChange={e => setSimState(s => ({ ...s, haircutPercentage: Number(e.target.value) }))} 
                  />
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
                <p>An account is marked <strong>SIGNIFICANT</strong> if:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>|Balance| &gt;= PM (Quantitative)</li>
                  <li>At least one qualitative pillar at the FSLI level is 'HIGH'</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="worksheet" className="w-full">
              <TabsList className="grid w-full max-w-[550px] grid-cols-3 mb-4">
                <TabsTrigger value="worksheet">{t('approval.tabWorksheet')}</TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-3 w-3" /> {t('approval.tabHistory')}
                  {simState.history?.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{simState.history.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="integrity" className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> {t('approval.tabIntegrity')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="worksheet" className="space-y-6">
                <GLDataGrid
                  data={mergedGlData}
                  assessmentData={simState.assessmentData || {}}
                  omValue={omValue}
                  pmValue={pmValue}
                  onAssessmentChange={handleAssessmentChange}
                  onOwnerAcceptanceChange={handleOwnerAcceptanceChange}
                  isReadOnly={isLocked}
                  departments={departments?.items || []}
                  onAssignDepartments={handleAssignDepartments}
                  applications={appsData?.items || []}
                  selectedApps={localAppMappings}
                  onAppsChange={handleAppsChange}
                  onQuickAddApp={handleQuickAddApp}
                />
              </TabsContent>
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> {t('approval.tabHistory')} & Feedback</CardTitle>
                    <CardDescription>Track all actions and comments for this materiality baseline.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ApprovalHistoryTimeline history={simState.history} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="integrity" className="space-y-6">
                <ScopingHealthDashboard glData={glData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const { t } = useTranslation('scoping');
  switch (status) {
    case 'Approved': return <Badge className="bg-green-600">{t('status.approved')}</Badge>;
    case 'Pending CFO': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">{t('status.pendingCfo')}</Badge>;
    case 'Pending Komut': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">{t('status.pendingKomut')}</Badge>;
    case 'Rejected': return <Badge variant="destructive">{t('status.rejected')}</Badge>;
    default: return <Badge variant="outline">{t('status.draft')}</Badge>;
  }
}
