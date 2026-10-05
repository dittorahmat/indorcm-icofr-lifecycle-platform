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
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';

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
  const [showFullTable, setShowFullTable] = React.useState(false);

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
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName, workingYear],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>(`/api/controls?year=${workingYear}`);
      return all.items.filter(c => {
        // Year check: if control has year specified, it must match workingYear
        if (c.year && workingYear && c.year.toString() !== workingYear.toString()) {
          return false;
        }

        const cSub = (c.subProcess || "").toLowerCase().trim();
        const targetSub = (subProcessName || "").toLowerCase().trim();

        // Match 1: Hard ID link (Primary & Strict)
        if (bpmProcessId && c.bpmProcessId === bpmProcessId) {
          if (noGL && c.fsliCodes && c.fsliCodes.length > 0) {
            return c.fsliCodes.includes(noGL);
          }
          return true;
        }
        
        // Match 2: Name link (Secondary Fallback - MUST also match GL)
        if (targetSub && cSub === targetSub) {
          if (noGL && c.fsliCodes && c.fsliCodes.length > 0) {
            return c.fsliCodes.includes(noGL);
          }
          return !noGL;
        }
        
        return false;
      });
    }
  });

  const { data: allControlsData } = useQuery({
    queryKey: ['controls-all', workingYear],
    queryFn: () => api<{ items: Control[] }>(`/api/controls?year=${workingYear}`),
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
        nature: 'Manual',
        year: workingYear ? parseInt(workingYear) : undefined
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 p-4 border-b shrink-0 flex-wrap gap-3 min-w-0 max-w-full">
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 min-w-0">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Control Activity Matrix (RCM) - {subProcessName || fsliName} ({noGL})</span>
          </h4>
          <p className="text-xs text-slate-500">Identify risks and control activities at the transaction level.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full min-[480px]:w-auto">
          <Button 
            onClick={() => setIsProcedureOpen(!isProcedureOpen)} 
            variant="outline" 
            size="sm"
            className="h-9 min-h-[44px] min-[480px]:min-h-0 gap-2 border-slate-200 text-slate-900 font-bold flex-1 min-[480px]:flex-none justify-center"
          >
            <Shield className="h-4 w-4" />
            {isProcedureOpen ? "Hide Procedure" : "Set Std. Procedure"}
          </Button>
          <Button 
            onClick={() => createMutation.mutate()} 
            variant="default" 
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 font-bold gap-2 shadow-md px-4 h-9 min-h-[44px] min-[480px]:min-h-0 flex-1 min-[480px]:flex-none justify-center"
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
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
               <p className="text-xs text-slate-400">Prosedur dan Kode ini akan menjadi acuan identitas proses dalam pengerjaan CSA.</p>
            </div>
         </CollapsibleContent>
      </Collapsible>

      {/* MOBILE VIEW: Control summary cards */}
      <div className="md:hidden px-3 pt-3 space-y-3 max-h-[45vh] overflow-y-auto shrink-0" data-testid="bpm-worksheet-mobile-cards">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          {t('bpm:mobile.worksheetSummary', { defaultValue: 'Ringkasan Worksheet' })}
        </p>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-slate-400 font-medium">Loading...</p>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Info className="h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">No records found.</p>
          </div>
        ) : (
          <>
            {table.getRowModel().rows.map(row => {
              const c = row.original as any;
              const assertions = Array.isArray(c.assertions) ? c.assertions : [];
              return (
                <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                      {c.code || '-'}
                    </span>
                    {c.isKeyControl && (
                      <Badge className="bg-indigo-600 text-white font-semibold text-xs shrink-0">
                        {t('bpm:mobile.keyControl', { defaultValue: 'Kontrol Utama' })}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{c.name || '-'}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.type && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{c.type}</span>
                    )}
                    {c.nature && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{c.nature}</span>
                    )}
                    {assertions.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium">
                        {t('bpm:mobile.assertionsCount', { count: assertions.length, defaultValue: `${assertions.length} asersi` })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFullTable(v => !v)}
              aria-expanded={showFullTable}
              className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
            >
              {showFullTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showFullTable
                ? t('bpm:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' })
                : t('bpm:mobile.fullTable', { defaultValue: 'Lihat Tabel Penuh' })}
            </Button>
          </>
        )}
      </div>

      <div className={cn("flex-1 min-h-0 overflow-auto overflow-x-auto max-w-full w-full touch-pan-x overscroll-x-contain table-scroll-hint", !showFullTable && "hidden", "md:block")}>
        {showFullTable && (
          <div className="md:hidden px-3 pt-3">
            <MobileDesktopBanner recordCount={table.getRowModel().rows.length} />
          </div>
        )}
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
                    <p className="text-xs text-slate-400 font-medium">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20} className="h-32 text-center border-b">
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Info className="h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-400">No records found. Click add row above.</p>
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
        <DialogContent className="sm:max-w-[425px] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
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
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddingApp(false)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center">Cancel</Button>
            <Button 
              disabled={!newAppName || createAppMutation.isPending}
              onClick={() => createAppMutation.mutate(newAppName)}
              className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center"
            >
              Add Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBpmModalOpen} onOpenChange={(open) => !open && handleCloseDiagram()}>
        <DialogContent className="w-full sm:max-w-[95vw] h-[90dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-xl min-w-0 truncate">
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
