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
  Trash2, AlertTriangle, PlusCircle, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GLSnapshot, GLRow, BPMProcess, UserRole } from '@shared/types';
import { BPMWorksheet } from '@/components/bpm/BPMWorksheet';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BPMPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedFsli, setSelectedFsli] = React.useState<string>("");
  const [selectedAccountKey, setSelectedAccountKey] = React.useState<string>("");
  const [selectedBpmId, setSelectedBpmId] = React.useState<string | null>(null);
  const [isCreatingBPM, setIsCreatingBPM] = React.useState(false);
  const [bpmName, setBpmName] = React.useState("");

  // Handle Deep Linking from Scoping
  React.useEffect(() => {
    const fsli = searchParams.get('fsli');
    const noGL = searchParams.get('noGL');
    const glDesc = searchParams.get('glDesc');

    if (fsli) setSelectedFsli(fsli);
    if (noGL && glDesc) {
      setSelectedAccountKey(`${noGL} ||| ${glDesc}`);
    }
  }, [searchParams]);

  // 1. Fetch Active Snapshot
  const { data: activeSnap, isLoading: snapLoading } = useQuery({
    queryKey: ['gl-snapshots-active'],
    queryFn: async () => {
      const list = await api<{ items: GLSnapshot[] }>('/api/gl-snapshots');
      return list.items.find(s => s.isActive) || null;
    }
  });

  // 2. Derive unique significant FSLIs
  const significantFsliNames = React.useMemo(() => {
    if (!activeSnap) return [];
    const names = new Set<string>();
    activeSnap.rows.forEach(r => { if (r.fsliName) names.add(r.fsliName); });
    return Array.from(names).sort();
  }, [activeSnap]);

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

  // 4. Fetch BPM Processes for selected account
  const { data: bpmProcesses, isLoading: bpmLoading } = useQuery({
    queryKey: ['bpm-processes', selectedAccountKey],
    queryFn: () => {
      const noGL = selectedAccountKey.split(' ||| ')[0];
      return api<{ items: BPMProcess[] }>(`/api/bpm-processes?noGL=${noGL}`);
    },
    enabled: !!selectedAccountKey
  });

  const createBPMMutation = useMutation({
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

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">BPM Workflow</h1>
            <p className="text-muted-foreground text-sm">
              Map business processes and controls at the transaction level.
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Database className="h-3 w-3" /> 1. Select FSLI
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
                  <Search className="h-3 w-3" /> 2. Select Nomor GL
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
                  {selectedGLRow?.kategori || "-"}
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
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-indigo-600" />
                Proses BPM untuk {selectedGLRow?.glDesc}
              </h3>
              <Button onClick={() => setIsCreatingBPM(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Create BPM
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {bpmLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : bpmProcesses?.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No processes created yet. Click "Create BPM" to add one.</p>
              ) : bpmProcesses?.items.map((bpm, idx) => (
                <div key={bpm.id} className="relative group">
                  <Button
                    variant={selectedBpmId === bpm.id ? "default" : "outline"}
                    className={cn(
                      "h-12 px-6 rounded-xl border-2 flex items-center gap-3 transition-all pr-10",
                      selectedBpmId === bpm.id 
                        ? "bg-indigo-600 border-indigo-700 shadow-lg shadow-indigo-200" 
                        : "bg-white border-slate-200 hover:border-indigo-300 text-slate-600"
                    )}
                    onClick={() => setSelectedBpmId(bpm.id)}
                  >
                    <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                      {idx + 1}
                    </span>
                    <span className="font-bold tracking-tight">{bpm.name}</span>
                    {selectedBpmId === bpm.id && <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete entire process "${bpm.name}" and all its worksheet rows?`)) {
                        deleteBPMMutation.mutate(bpm.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {selectedBpmId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-4 border-t border-slate-100"
              >
                <div className="flex justify-between items-center">
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-50 px-3 py-1 gap-2 uppercase tracking-widest font-extrabold text-[10px]">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Spreadsheet Worksheet
                  </Badge>
                </div>
                
                <BPMWorksheet 
                  bpmProcessId={selectedBpmId} 
                  fsliName={selectedFsli}
                  noGL={selectedGLRow?.noGL || ""}
                />
              </motion.div>
            )}
          </div>
        )}

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
