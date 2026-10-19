import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Control, Application, User, BPMProcess, BPMDiagram } from '@shared/types';
import { filterWorksheetControls } from '@shared/worksheet-control-scope';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Info, Workflow as WorkflowIcon } from 'lucide-react';
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
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BPMEditor } from '../rcm/BPMEditor';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useConfirm } from '@/hooks/use-confirm';
import { createWorksheetColumns } from './BPMWorksheetColumns';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { BPMWorksheetMobileCards } from './BPMWorksheetMobileCards';
import { BPMWorksheetProcedurePanel } from './BPMWorksheetProcedurePanel';
import { toWorksheetRows } from './worksheet-row';
import { useWorksheetRowCommit } from './useWorksheetRowCommit';
import { BPMWorksheetToolbar } from './BPMWorksheetToolbar';

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
      return filterWorksheetControls(all.items, { bpmProcessId, subProcessName, noGL, year: workingYear });
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
    queryFn: () => api<{ items: BPMDiagram[] }>('/api/bpm-diagrams')
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

  const commit = useWorksheetRowCommit({ diagrams, onOpenDiagram: handleOpenDiagram });

  const columns = React.useMemo<ColumnDef<Control>[]>(() => createWorksheetColumns({
    t,
    confirm,
    diagrams,
    apps,
    elcControls,
    commit,
    setIsAddingApp,
  }), [apps, diagrams, commit, elcControls, t, confirm]);

  const table = useReactTable({
    data: controls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <BPMWorksheetToolbar
        scopeName={subProcessName || fsliName}
        noGL={noGL}
        isProcedureOpen={isProcedureOpen}
        onToggleProcedure={() => setIsProcedureOpen(!isProcedureOpen)}
        onAddRow={() => createMutation.mutate()}
        isAddingRow={createMutation.isPending}
      />

      <BPMWorksheetProcedurePanel
        isOpen={isProcedureOpen}
        onOpenChange={setIsProcedureOpen}
        bpmCode={bpmCode}
        onBpmCodeChange={setBpmCode}
        standardProcedure={standardProcedure}
        onStandardProcedureChange={setStandardProcedure}
        isSaving={updateProcessMutation.isPending}
        onSave={handleSaveMetadata}
      />

      {/* MOBILE VIEW: Control summary cards */}
      <BPMWorksheetMobileCards
        rows={toWorksheetRows(controls ?? [])}
        isLoading={isLoading}
        showFullTable={showFullTable}
        onToggleFullTable={() => setShowFullTable(v => !v)}
      />

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
