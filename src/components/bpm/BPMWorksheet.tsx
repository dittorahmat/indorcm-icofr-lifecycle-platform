import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { 
  Control, ControlAssertion, InformationProcessingObjective, 
  ControlType, ControlNature, Application, User, BPMProcess
} from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, ChevronUp, Save, 
  Network, Plus, Trash2, Loader2, PlusCircle, CheckCircle2, XCircle,
  Database, Info, FileSpreadsheet, Workflow as WorkflowIcon, Shield, Check
} from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BPMEditor } from '../rcm/BPMEditor';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useConfirm } from '@/hooks/use-confirm';
import { createWorksheetColumns } from './BPMWorksheetColumns';

interface BPMWorksheetProps {
  bpmProcessId: string;
  subProcessName?: string;
  fsliName: string;
  noGL: string;
  workingYear: string;
}

export function BPMWorksheet({ bpmProcessId, subProcessName, fsliName, noGL, workingYear }: BPMWorksheetProps) {
  const confirm = useConfirm();
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDirty } = useUnsavedChangesContext();
  const selectedDiagramId = searchParams.get('diagramId');
  const isBpmModalOpen = !!selectedDiagramId;
  const currentSubProcess = searchParams.get('subProcess') || subProcessName || "";
  
  const [isAddingApp, setIsAddingApp] = React.useState(false);
  const [newAppName, setNewAppName] = React.useState("");

  const handleOpenDiagram = React.useCallback((diagramId: string, subProcess: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('diagramId', diagramId);
      next.set('subProcess', subProcess);
      next.set('bpmProcessId', bpmProcessId);
      return next;
    });
  }, [setSearchParams, bpmProcessId]);

  const handleCloseDiagram = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('common:unsavedChanges.description'),
        variant: 'destructive'
      });
      if (!ok) return;
    }
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('diagramId');
      next.delete('subProcess');
      return next;
    });
  };

  // 1. Fetch Controls
  const { data: controls, isLoading } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>('/api/controls');
      return all.items.filter(c => {
        const cSub = (c.subProcess || "").toLowerCase().trim();
        const targetSub = (subProcessName || "").toLowerCase().trim();

        // Match 1: Hard ID link (Primary)
        if (bpmProcessId && c.bpmProcessId === bpmProcessId) return true;
        
        // Match 2: Name link (Reliable Fallback)
        if (targetSub && cSub === targetSub) return true;
        
        // Match 3: Orphan link (Fallback for data missing process metadata but linked to GL)
        if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
        
        return false;
      });
    }
  });

  const { data: allControlsData } = useQuery({
    queryKey: ['controls-all'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const elcControls = React.useMemo(() => {
    return allControlsData?.items.filter(c => c.level === 'ELC') || [];
  }, [allControlsData]);

  const { data: diagrams } = useQuery({
    queryKey: ['bpm-diagrams'],
    queryFn: () => api<{ items: any[] }>('/api/bpm-diagrams')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  // 2. Fetch Applications for dropdown
  const { data: apps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications')
  });

  // 2. Fetch Process Data for metadata
  const { data: bpmProcess } = useQuery({
    queryKey: ['bpm-processes', bpmProcessId],
    queryFn: () => api<BPMProcess>(`/api/bpm-processes?id=${bpmProcessId}`).then((res: any) => res.items.find((p: any) => p.id === bpmProcessId)),
    enabled: !!bpmProcessId
  });

  // 3. Mutations
  const updateProcessMutation = useMutation({
    mutationFn: (data: Partial<BPMProcess>) => 
      api(`/api/bpm-processes/${bpmProcessId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
      toast.success("Process metadata updated");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Control> }) => 
      api(`/api/controls/${id}/bpm-update`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
    }
  });

  const [standardProcedure, setStandardProcedure] = React.useState("");
  const [bpmCode, setBpmCode] = React.useState("");
  const [isProcedureOpen, setIsProcedureOpen] = React.useState(false);

  const isMetadataDirty = React.useMemo(() => {
    return standardProcedure !== (bpmProcess?.standardTestProcedure || "") || 
           bpmCode !== (bpmProcess?.bpmCode || "");
  }, [standardProcedure, bpmCode, bpmProcess]);

  useUnsavedChanges(isMetadataDirty && isProcedureOpen);

  React.useEffect(() => {
    if (bpmProcess) {
      setStandardProcedure(bpmProcess.standardTestProcedure || "");
      setBpmCode(bpmProcess.bpmCode || "");
    }
  }, [bpmProcess]);

  const handleSaveMetadata = () => {
    if (!bpmCode.trim()) {
      toast.error("BPM Code tidak boleh kosong");
      return;
    }
    
    updateProcessMutation.mutate({ 
      standardTestProcedure: standardProcedure,
      bpmCode: bpmCode.trim() 
    });
  };

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) => api<{ id: string }>('/api/bpm-diagrams', {
      method: 'POST',
      body: JSON.stringify({ name: subProcess, subProcess })
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      handleOpenDiagram(data.id, variables);
    }
  });

  const createMutation = useMutation({
    mutationFn: () => api('/api/controls', {
      method: 'POST',
      body: JSON.stringify({ 
        bpmProcessId, 
        fsliCodes: [noGL],
        name: 'New Control Activity',
        businessProcess: fsliName,
        subProcess: subProcessName || 'New Sub Process',
        location: '-',
        isFraudRelated: false,
        isKeyControl: false,
        ipos: [],
        assertions: [],
        type: 'Preventive',
        nature: 'Manual'
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success("New row added to worksheet");
    },
    onError: (err: any) => {
      toast.error(`Failed to add row: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/controls/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success("Row deleted");
    }
  });

  const createAppMutation = useMutation({
    mutationFn: (name: string) => api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ name, statusITGC: 'Not Tested', criticality: 'Medium' })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsAddingApp(false);
      setNewAppName("");
      toast.success("Application added to master data");
    }
  });

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdate = React.useCallback((id: string, field: string, value: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateMutation.mutate({ id, data: { [field]: value } });
    }, 500);
  }, [updateMutation]);

  const columns = React.useMemo<ColumnDef<Control>[]>(() => createWorksheetColumns({
    t,
    confirm,
    diagrams,
    apps,
    elcControls,
    handleOpenDiagram,
    createDiagramMutation,
    updateMutation,
    deleteMutation,
    debouncedUpdate,
    setIsAddingApp,
  }), [apps, diagrams, handleOpenDiagram, createDiagramMutation, debouncedUpdate, updateMutation, deleteMutation, elcControls, t, confirm]);

  const table = useReactTable({
    data: controls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between bg-slate-50/50 p-4 border-b shrink-0">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Control Activity Matrix (RCM) - {subProcessName || fsliName} ({noGL})
          </h4>
          <p className="text-xs text-slate-500 italic">Identify risks and control activities at the transaction level.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsProcedureOpen(!isProcedureOpen)} 
            variant="outline" 
            size="sm"
            className="h-9 gap-2 border-slate-200 text-slate-900 font-bold"
          >
            <Shield className="h-4 w-4" />
            {isProcedureOpen ? "Hide Procedure" : "Set Std. Procedure"}
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            variant="default" 
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 font-bold gap-2 shadow-md px-4 h-9"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {t('worksheet.addRow')}
          </Button>
        </div>
      </div>

      <Collapsible open={isProcedureOpen} onOpenChange={setIsProcedureOpen} className="bg-slate-50 border-b">
         <CollapsibleContent>
            <div className="p-4 space-y-3 max-w-4xl mx-auto">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Label className="text-xs font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">BPM Code:</Label>
                     <Input 
                       className="h-8 text-xs font-mono font-bold uppercase w-32 bg-white"
                       placeholder="BPM-FIN-01"
                       value={bpmCode}
                       onChange={e => setBpmCode(e.target.value)}
                     />
                     <div className="h-4 w-[1px] bg-slate-300 mx-2" />
                     <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Master Prosedur Pengujian (Standard)</Label>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs gap-1.5 bg-mancity-pattern hover:opacity-90 text-primary-foreground" 
                    onClick={handleSaveMetadata}
                    disabled={updateProcessMutation.isPending}
                  >
                    {updateProcessMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Metadata
                  </Button>
               </div>
               <Textarea 
                 className="min-h-[120px] text-xs font-medium shadow-inner bg-white"
                 placeholder="Tuliskan langkah-langkah pengujian standar untuk proses ini..."
                 value={standardProcedure}
                 onChange={e => setStandardProcedure(e.target.value)}
               />
               <p className="text-xs text-slate-400 italic">Prosedur dan Kode ini akan menjadi acuan identitas proses dalam pengerjaan CSA.</p>
            </div>
         </CollapsibleContent>
      </Collapsible>

      <div className="flex-1 min-h-0 overflow-auto bg-white">
        <Table className="min-w-[2500px] border-separate border-spacing-0">
          <TableHeader className="bg-slate-100 sticky top-0 z-20">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id}
                    className="border-b border-r h-12 text-xs font-extrabold uppercase text-slate-600 px-3 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={20} className="h-32 text-center border-b">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-slate-400 animate-pulse font-medium">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20} className="h-32 text-center border-b">
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Info className="h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-400 italic">No records found. Click add row above.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="hover:bg-slate-50/30 transition-colors h-12 group border-b">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="border-r p-1 overflow-hidden relative border-b">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddingApp} onOpenChange={setIsAddingApp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Add a new IT system to the master data directory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input 
                id="app-name"
                placeholder="e.g. Oracle ERP" 
                value={newAppName} 
                onChange={e => setNewAppName(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingApp(false)}>Cancel</Button>
            <Button 
              disabled={!newAppName || createAppMutation.isPending}
              onClick={() => createAppMutation.mutate(newAppName)}
            >
              Add Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBpmModalOpen} onOpenChange={(open) => !open && handleCloseDiagram()}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <WorkflowIcon className="h-5 w-5 text-primary" />
              BPM Workflow Editor: {currentSubProcess}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border-t">
            {selectedDiagramId && (
              <BPMEditor 
                diagramId={selectedDiagramId} 
                subProcess={currentSubProcess}
                workingYear={workingYear}
                currentGL={noGL}
                bpmProcessId={bpmProcessId}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
