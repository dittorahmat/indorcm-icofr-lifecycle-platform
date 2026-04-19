import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { 
  Control, ControlAssertion, InformationProcessingObjective, 
  ControlType, ControlNature, Application 
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
import { 
  Network, Plus, Trash2, Loader2, PlusCircle, CheckCircle2, XCircle,
  Database, Info, FileSpreadsheet, Workflow as WorkflowIcon
} from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import { BPMEditor } from '../rcm/BPMEditor';

interface BPMWorksheetProps {
  bpmProcessId: string;
  fsliName: string;
  noGL: string;
}

export function BPMWorksheet({ bpmProcessId, fsliName, noGL }: BPMWorksheetProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddingApp, setIsAddingApp] = React.useState(false);
  const [newAppName, setNewAppName] = React.useState("");
  
  // BPM Editor Modal State
  const [isBpmModalOpen, setIsBpmModalOpen] = React.useState(false);
  const [selectedDiagramId, setSelectedDiagramId] = React.useState<string | null>(null);
  const [currentSubProcess, setCurrentSubProcess] = React.useState("");

  // 1. Fetch Controls for this BPM Process
  const { data: controls, isLoading } = useQuery({
    queryKey: ['bpm-controls', bpmProcessId],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>('/api/controls');
      // Filter by bpmProcessId, fallback to noGL if not set (for existing data)
      return all.items.filter(c => c.bpmProcessId === bpmProcessId || (!c.bpmProcessId && c.fsliCodes?.includes(noGL)));
    }
  });

  const { data: diagrams } = useQuery({
    queryKey: ['bpm-diagrams'],
    queryFn: () => api<{ items: any[] }>('/api/bpm-diagrams')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/auth/me'),
  });

  const isReadOnly = currentUser?.role === 'Line 1' && currentUser?.level === 'Manager';

  // 2. Fetch Applications for dropdown
  const { data: apps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications')
  });

  const { data: rcms } = useQuery({
    queryKey: ['rcm-list'],
    queryFn: () => api<{ items: any[] }>('/api/rcm')
  });

  // 3. Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Control> }) => 
      api(`/api/controls/${id}/bpm-update`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
    }
  });

  const createDiagramMutation = useMutation({
    mutationFn: (subProcess: string) => api('/api/bpm-diagrams', {
      method: 'POST',
      body: JSON.stringify({ name: `Flow: ${subProcess}`, subProcess })
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      setSelectedDiagramId(data.id);
      setIsBpmModalOpen(true);
    }
  });

  const createMutation = useMutation({
    mutationFn: () => api('/api/controls', {
      method: 'POST',
      body: JSON.stringify({ 
        bpmProcessId, 
        fsliCodes: [noGL],
        name: 'New Control Activity',
        businessProcessLvl1: fsliName,
        businessProcessLvl2: '',
        subProcess: '',
        location: '',
        isFraudRelated: false,
        isKeyControl: false,
        ipo: [],
        assertions: [],
        type: 'Preventive',
        nature: 'Manual'
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success("New row added");
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

  // Custom debounced update handler for auto-save
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdate = (id: string, field: string, value: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateMutation.mutate({ id, data: { [field]: value } });
    }, 500);
  };

  const columns = React.useMemo<ColumnDef<Control>[]>(() => [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:text-red-600 transition-colors"
          onClick={() => {
            if (confirm("Delete this row?")) {
              deleteMutation.mutate(row.original.id);
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40
    },
    {
      id: 'no',
      header: 'No',
      cell: info => <span className="text-[10px] text-slate-400 px-2">{info.row.index + 1}</span>,
      size: 40
    },
    {
      id: 'workflow',
      header: 'BPM Workflow',
      cell: ({ row }) => {
        const subProcess = row.original.subProcess;
        const diagram = diagrams?.items.find(d => d.subProcess === subProcess);
        
        return (
          <Button 
            variant={diagram ? "default" : "outline"} 
            size="sm" 
            className={cn(
              "h-7 text-[9px] gap-1.5 uppercase font-bold mx-2",
              diagram ? "bg-indigo-600 hover:bg-indigo-700" : "text-slate-400 border-slate-200"
            )}
            onClick={() => {
              if (diagram) {
                setSelectedDiagramId(diagram.id);
                setCurrentSubProcess(subProcess || "");
                setIsBpmModalOpen(true);
              } else if (subProcess) {
                createDiagramMutation.mutate(subProcess);
              } else {
                toast.error("Please fill Sub-Process name first");
              }
            }}
          >
            <Network className="h-3 w-3" />
            {diagram ? "View Flow" : "Create Flow"}
          </Button>
        );
      },
      size: 100
    },
    {
      accessorKey: 'businessProcessLvl1',
      header: 'Informasi Proses Bisnis (Lvl 1)',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[150px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'businessProcessLvl1', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'businessProcessLvl2',
      header: 'Informasi Proses Bisnis (Lvl 2)',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[150px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'businessProcessLvl2', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'subProcess',
      header: 'Informasi Sub-Proses Bisnis',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 font-bold min-w-[180px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'subProcess', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'location',
      header: 'Lokasi',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[100px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'location', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'description',
      header: 'Proses Bisnis (Aktivitas)',
      cell: ({ row, getValue }) => (
        <textarea 
          className="w-full min-h-[60px] text-xs border-none focus:ring-1 focus:ring-indigo-300 bg-transparent p-1 resize-none min-w-[250px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'description', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'isFraudRelated',
      header: 'Risiko Fraud',
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue() ? 'Y' : 'T'} 
          onValueChange={(v) => updateMutation.mutate({ id: row.original.id, data: { isFraudRelated: v === 'Y' } })}
        >
          <SelectTrigger className="h-7 text-[10px] border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">Y</SelectItem>
            <SelectItem value="T">T</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'reference',
      header: 'Referensi',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[120px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'reference', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'name',
      header: 'Nama Aktivitas Pengendalian',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 font-medium text-indigo-700 min-w-[200px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'name', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'supportingDocs',
      header: 'Dokumen Pendukung',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[150px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => debouncedUpdate(row.original.id, 'supportingDocs', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'isKeyControl',
      header: 'Pengendalian Utama',
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue() ? 'Y' : 'T'} 
          onValueChange={(v) => updateMutation.mutate({ id: row.original.id, data: { isKeyControl: v === 'Y' } })}
        >
          <SelectTrigger className="h-7 text-[10px] border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">Y</SelectItem>
            <SelectItem value="T">T</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'ipo',
      header: 'IPO',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[100px]"
          defaultValue={(getValue<string[]>() || []).join(', ')}
          onBlur={(e) => debouncedUpdate(row.original.id, 'ipo', e.target.value.split(',').map(s => s.trim()))}
        />
      )
    },
    {
      accessorKey: 'assertions',
      header: 'Asersi',
      cell: ({ row, getValue }) => (
        <Input 
          className="h-8 text-xs border-transparent focus:border-indigo-300 bg-transparent px-1 min-w-[100px]"
          defaultValue={(getValue<string[]>() || []).join(', ')}
          onBlur={(e) => debouncedUpdate(row.original.id, 'assertions', e.target.value.split(',').map(s => s.trim()))}
        />
      )
    },
    {
      accessorKey: 'type',
      header: 'Tipe',
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue()} 
          onValueChange={(v: ControlType) => updateMutation.mutate({ id: row.original.id, data: { type: v } })}
        >
          <SelectTrigger className="h-7 text-[10px] border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Preventive">Preventive</SelectItem>
            <SelectItem value="Detective">Detective</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'nature',
      header: 'Sifat',
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue()} 
          onValueChange={(v: ControlNature) => updateMutation.mutate({ id: row.original.id, data: { nature: v } })}
        >
          <SelectTrigger className="h-7 text-[10px] border-none bg-transparent min-w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Manual">Manual</SelectItem>
            <SelectItem value="Automated">Automated</SelectItem>
            <SelectItem value="ITDM - IPE">ITDM - IPE</SelectItem>
            <SelectItem value="ITDM - EUC">ITDM - EUC</SelectItem>
            <SelectItem value="MRC">MRC</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'applicationId',
      header: 'Aplikasi Signifikan',
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<string>() || "none"} 
          onValueChange={(v) => {
            if (v === 'add-new') {
              setIsAddingApp(true);
            } else {
              updateMutation.mutate({ id: row.original.id, data: { applicationId: v === 'none' ? undefined : v } });
            }
          }}
        >
          <SelectTrigger className="h-7 text-[10px] border-none bg-transparent min-w-[120px]">
            <SelectValue placeholder="Pilih..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- None --</SelectItem>
            {apps?.items.map(app => (
              <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
            ))}
            <SelectItem value="add-new" className="text-indigo-600 font-bold border-t mt-1">+ Add New Application</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ], [apps, rcms, navigate, deleteMutation, updateMutation]);

  const table = useReactTable({
    data: controls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Worksheet Header Actions */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            {t('worksheet.title')}
          </h4>
          <p className="text-[10px] text-slate-500 italic">{t('worksheet.description')}</p>
        </div>
        
        <Button 
          onClick={() => createMutation.mutate()} 
          variant="default" 
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 shadow-md px-4 h-9"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {t('worksheet.addRow')}
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border bg-white shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <Table className="min-w-[2500px] border-collapse relative">
            <TableHeader className="bg-slate-100 border-b-2 sticky top-0 z-20 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead 
                      key={header.id}
                      className="border-r last:border-r-0 h-14 text-[10px] font-extrabold uppercase text-slate-600 px-3 bg-slate-50/90 backdrop-blur-sm"
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
                  <TableCell colSpan={18} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <p className="text-xs text-slate-400 animate-pulse font-medium">Loading control worksheet...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Info className="h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-400 italic">No records found for this process. Click "Add New Row" above to begin mapping.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} className="hover:bg-indigo-50/30 transition-colors h-12 group border-b">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="border-r last:border-r-0 p-0 overflow-hidden relative">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Add Application */}
      <Dialog open={isAddingApp} onOpenChange={setIsAddingApp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Add a new IT system to the master data directory. This application will be available for all controls in the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input 
                id="app-name"
                placeholder="e.g. Oracle ERP, Core Banking System" 
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

      {/* Modal: BPM Workflow Editor */}
      <Dialog open={isBpmModalOpen} onOpenChange={setIsBpmModalOpen}>
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
    </div>
  );
}
