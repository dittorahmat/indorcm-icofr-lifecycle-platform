import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Position,
  NodeProps,
  Handle,
  ReactFlowProvider,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { 
  FileText, Database, Activity, GitCommit, PlayCircle, StopCircle, 
  Save, AlertTriangle, ShieldCheck, Info, X, RefreshCw, Link as LinkIcon, Workflow, Trash2, 
  Search, PlusCircle, LayoutDashboard, ChevronRight, GripVertical, Check, ChevronsUpDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RCM, Control, QualitativeLevel } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useTranslation } from 'react-i18next';
import { RegulatoryPropertySheet } from './properties/RegulatoryPropertySheet';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// --- Custom Nodes sesuai Legenda Lampiran 3 & 4 ---

const NodeTooltip = ({ children, data, type }: { children: React.ReactNode, data: any, type: string }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{children}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px] p-2 bg-slate-900 border-slate-700 shadow-2xl z-[100]">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
              <p className="font-bold text-[10px] uppercase text-slate-400">
                {type} Preview
              </p>
              {data.relatedElcNames && data.relatedElcNames.length > 0 && (
                <ShieldCheck className="h-3 w-3 text-indigo-400" />
              )}
            </div>
            <p className="text-[11px] font-bold leading-tight text-white">{data.label}</p>
            {data.description && <p className="text-[10px] text-slate-400 line-clamp-3 italic leading-relaxed">{data.description}</p>}
            
            {data.relatedElcNames && data.relatedElcNames.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">Payung Kebijakan (ELC):</p>
                <ul className="space-y-0.5">
                  {data.relatedElcNames.map((name: string, i: number) => (
                    <li key={i} className="text-[9px] text-slate-300 flex items-start gap-1">
                      <div className="h-1 w-1 rounded-full bg-indigo-500 mt-1 shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-2 pt-1">
              {data.role && <p className="text-[9px] text-blue-400 font-bold uppercase">Role: {data.role}</p>}
              {data.code && <p className="text-[9px] text-green-400 font-mono font-bold">Code: {data.code}</p>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StartEndNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center transition-all",
      data.type === 'start' ? "border-green-600 ring-green-100" : "border-red-600 ring-red-100",
      selected && "ring-4 border-primary shadow-lg scale-105"
    )}>
      <Handle type={data.type === 'start' ? "source" : "target"} position={data.type === 'start' ? Position.Bottom : Position.Top} className="w-3 h-3 border-2 border-white bg-slate-400" />
      <span className={cn(
        "font-bold text-[11px] uppercase tracking-wider",
        data.type === 'start' ? "text-green-700" : "text-red-700"
      )}>{data.label}</span>
    </div>
  </NodeTooltip>
);

const ActivityNode = ({ data, selected, type }: NodeProps) => {
  return (
    <NodeTooltip data={data} type={type}>
      <div className={cn(
        "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all relative",
        selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
      )}>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="font-bold text-[9px] mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
          <Activity className="h-2.5 w-2.5" /> {data.role || "Role"}
        </div>
        <div className="text-[12px] font-semibold text-slate-800 leading-tight">{data.label}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </NodeTooltip>
  );
};

const DockedRiskNode = ({ data, selected }: NodeProps) => (
  <div className="relative group cursor-pointer">
    <svg width="24" height="22" viewBox="0 0 80 70" className={cn(
      "text-red-600 drop-shadow-sm transition-all",
      selected ? "scale-125 text-red-700" : "hover:scale-110"
    )}>
      <path d="M20 0 L60 0 L80 35 L60 70 L20 70 L0 35 Z" fill="currentColor" />
    </svg>
    <div className="absolute -top-2 -right-2 bg-red-700 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm">
      {data.riskIds?.length || 0}
    </div>
  </div>
);

const DockedControlNode = ({ data, selected }: NodeProps) => (
  <div className="relative group cursor-pointer">
    <div className={cn(
      "w-5 h-5 rounded-full bg-green-600 border-2 border-green-900 flex items-center justify-center shadow-sm transition-all",
      selected ? "scale-125 bg-green-700 border-primary" : "hover:scale-110"
    )}>
      <ShieldCheck className="h-3 w-3 text-white" />
    </div>
    <div className="absolute -top-2 -right-2 bg-green-700 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm">
      {data.controlIds?.length || 0}
    </div>
  </div>
);

const RiskNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative group transition-all", selected && "scale-110")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "w-20 h-[70px] flex items-center justify-center shadow-xl transition-all",
        selected ? "fill-red-700 stroke-primary stroke-[3px]" : "fill-red-600 stroke-red-900 stroke-[2px]"
      )} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
        <svg width="80" height="70" viewBox="0 0 80 70">
          <path d="M20 0 L60 0 L80 35 L60 70 L20 70 L0 35 Z" fill="currentColor" className={cn(selected ? "text-red-700" : "text-red-600")} />
          <foreignObject x="15" y="15" width="50" height="40">
            <div className="w-full h-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-white drop-shadow-md" />
            </div>
          </foreignObject>
        </svg>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
      <div className={cn(
        "absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 text-center text-[10px] font-black uppercase leading-tight py-1 px-2 rounded-md transition-colors",
        selected ? "bg-red-700 text-white" : "text-red-700 bg-red-50/80"
      )}>
        {data.label}
      </div>
    </div>
  </NodeTooltip>
);

const ControlPointNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative group transition-all", selected && "scale-110")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all",
        selected ? "bg-green-700 border-primary ring-4 ring-primary/20" : "bg-green-600 border-green-900"
      )}>
        <div className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center">
           <ShieldCheck className="h-5 w-5 text-white" />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
      <div className={cn(
        "absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 text-center text-[10px] font-black uppercase leading-tight py-1 px-2 rounded-md transition-colors",
        selected ? "bg-green-700 text-white" : "text-green-700 bg-green-50/80"
      )}>
        {data.code ? `[${data.code}] ${data.label}` : data.label}
      </div>
    </div>
  </NodeTooltip>
);

const AutomatedActivityNode = ({ data, selected, type }: NodeProps) => {
  return (
    <NodeTooltip data={data} type={type}>
      <div className={cn(
        "px-4 py-3 shadow-md rounded-sm bg-blue-50 border-2 border-blue-800 min-w-[160px] text-center transition-all relative",
        selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
      )}>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="font-bold text-[9px] mb-1.5 uppercase text-blue-600 border-b border-blue-200 pb-1 flex items-center justify-center gap-1">
          <Database className="h-2.5 w-2.5" /> SYSTEM
        </div>
        <div className="text-[12px] font-semibold text-blue-900 leading-tight mb-2">{data.label}</div>
        <div className="absolute bottom-1 left-2 right-1 h-0.5 bg-blue-800/30 rounded-full" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </NodeTooltip>
  );
};

const SystemOutputNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative group transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "w-32 h-12 flex items-center justify-center bg-white border-2 shadow-md transition-all",
        selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
      )} style={{ transform: 'skew(-20deg)' }}>
        <div style={{ transform: 'skew(20deg)' }} className="text-center text-[10px] font-bold uppercase text-slate-700 px-2">
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const PhysicalDocumentNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-4 py-2 shadow-md bg-white border-2 border-slate-800 min-w-[130px] text-center relative transition-all", 
      selected && "ring-4 ring-primary/20 border-primary scale-105 shadow-lg"
    )} style={{ borderRadius: "4px 4px 0 0" }}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className="flex flex-col items-center gap-1.5 pb-2">
        <FileText className="h-4 w-4 text-slate-500" />
        <span className="text-[11px] font-bold uppercase tracking-tight text-slate-700">{data.label}</span>
      </div>
      <div className="absolute -bottom-1.5 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCA0MCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA1IEMxMCAwIDMwIDAgNDAgNSBMNDAgMTAgTDAgMTAgWiIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')] bg-repeat-x" />
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const ReferenceNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-md transition-all",
      selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
    )}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <span className="text-[10px] font-black text-slate-700">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const DecisionNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative flex items-center justify-center w-[110px] h-[110px] transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white",
        selected ? "border-primary ring-4 ring-primary/20 bg-primary/5" : "border-slate-800"
      )}>
         <div className="-rotate-45 text-center text-[11px] px-3 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Left} id="no" className="z-10" />
      <Handle type="source" position={Position.Right} id="yes" className="z-10" />
      <Handle type="source" position={Position.Bottom} className="z-10" />
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-600 bg-white/80 px-1 rounded">NO</div>
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-green-600 bg-white/80 px-1 rounded">YES</div>
    </div>
  </NodeTooltip>
);

const DocumentNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-4 py-2 shadow-md bg-white border-2 border-slate-800 min-w-[130px] text-center relative transition-all", 
      selected && "ring-4 ring-primary/20 border-primary scale-105 shadow-lg"
    )} style={{ borderRadius: "0 0 20px 0" }}>
      <div className="absolute -top-2.5 left-0 w-5 h-5 bg-white border-t-2 border-l-2 border-slate-800 rotate-45 transform -translate-x-1/2" />
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className="flex flex-col items-center gap-1.5">
        <FileText className="h-4 w-4 text-slate-500" />
        <span className="text-[11px] font-bold uppercase tracking-tight text-slate-700">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const SystemNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("w-28 h-24 relative flex items-center justify-center transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      {/* Cylinder Shape */}
      <div className={cn(
        "absolute inset-0 border-2 bg-blue-50 transition-all",
        selected ? "border-primary ring-4 ring-primary/20" : "border-blue-800"
      )} />
      <div className={cn(
        "absolute -top-4 left-0 right-0 h-8 border-2 bg-blue-100 rounded-[100%] transition-all",
        selected ? "border-primary" : "border-blue-800"
      )} />
      <div className="z-10 flex flex-col items-center gap-1">
        <Database className="h-5 w-5 text-blue-600 opacity-50" />
        <div className="text-[10px] font-black text-blue-900 text-center px-2 uppercase leading-tight">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const ArchiveNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("w-20 h-24 relative flex items-center justify-center transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      {/* Cylinder Shape for Archive */}
      <div className={cn(
        "absolute inset-0 border-2 bg-slate-50 transition-all",
        selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
      )} />
      <div className={cn(
        "absolute -top-4 left-0 right-0 h-8 border-2 bg-slate-200 rounded-[100%] transition-all",
        selected ? "border-primary" : "border-slate-800"
      )} />
      <div className="z-10 flex flex-col items-center gap-1">
        <GitCommit className="h-5 w-5 text-slate-600 opacity-50 rotate-180" />
        <span className="text-[9px] font-black text-slate-600 uppercase">ARSIP</span>
        <div className={cn(
          "absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 text-center text-[10px] font-bold uppercase leading-none py-1 px-2 rounded-md transition-colors",
          selected ? "bg-slate-800 text-white" : "text-slate-700 bg-slate-50"
        )}>{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': AutomatedActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  'physical-document': PhysicalDocumentNode,
  output: SystemOutputNode,
  system: SystemNode,
  risk: RiskNode,
  control: ControlPointNode,
  archive: ArchiveNode,
  'docked-risk': DockedRiskNode,
  'docked-control': DockedControlNode,
  reference: ReferenceNode,
};

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai', type: 'start' } },
];

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
}

export function BPMEditor({ diagramId, subProcess }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<{ id: string, type: 'Risk' | 'Control', count: number, usage: any[] } | null>(null);

  // Search states for selection lists
  const [riskSearch, setRiskSearch] = useState("");
  const [controlSearch, setControlSearch] = useState("");

  const generateUniqueId = useCallback((prefix: 'R' | 'C', existingNodes: any[]) => {
    // Collect all existing IDs of this prefix from regulatoryData
    const ids = existingNodes
      .map(n => prefix === 'R' ? n.data.regulatoryData?.riskId : n.data.regulatoryData?.controlId)
      .filter(id => id && id.startsWith(`${prefix}-`))
      .map(id => parseInt(id.split('-')[1]));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
  }, []);

  const createActivityNode = useCallback((type: 'activity' | 'automated-activity') => {
    const id = `node_${Date.now()}`;
    setNodes(nds => {
      const riskId = generateUniqueId('R', nds);
      const controlId = generateUniqueId('C', nds);
      
      const newNode = {
        id,
        type,
        position: { x: 100, y: 100 },
        data: {
          label: type === 'activity' ? 'New Activity' : 'System Process',
          role: type === 'activity' ? 'Staff' : '',
          regulatoryData: {
            riskId,
            controlId,
            riskDescription: '',
            controlDescription: '',
            isFraudRelated: false,
            riskRating: 'Low',
            isKeyControl: false,
            classification: 'TLC'
          }
        }
      };
      return [...nds, newNode];
    });
  }, [generateUniqueId, setNodes]);

  const onNodesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) {
      toast.info(`Deleted ${deleted.length} node(s)`);
    }
  }, []);

  const onEdgesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) {
      toast.info(`Deleted ${deleted.length} connection(s)`);
    }
  }, []);

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}`),
  });

  const currentYear = new Date().getFullYear();
  const isLocked = React.useMemo(() => {
    if (!diagram) return false;
    // Lock if year is before current year
    return diagram.year && diagram.year < currentYear;
  }, [diagram, currentYear]);

  // Track if diagram has been modified
  const isDirty = useMemo(() => {
    if (!diagram || isLocked) return false;
    
    // We compare coordinates and data. Note: markerEnd is added in useEffect, so we ignore it in comparison
    const currentNodes = JSON.stringify(nodes.map(n => ({ id: n.id, position: n.position, data: n.data })));
    const originalNodes = JSON.stringify((diagram.nodes || initialNodes).map((n: any) => ({ id: n.id, position: n.position, data: n.data })));
    
    const currentEdges = JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    const originalEdges = JSON.stringify((diagram.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target })));
    
    return currentNodes !== originalNodes || currentEdges !== originalEdges;
  }, [nodes, edges, diagram]);

  // Hook up unsaved changes protection
  const blocker = useUnsavedChanges(isDirty);

  // 2. Fetch Master Data
  const { data: controlsData } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls')
  });

  const { data: rcmData } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm')
  });

  const deletePermanentlyMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'Risk' | 'Control' }) => {
      const endpoint = type === 'Risk' ? `/api/rcm/${id}` : `/api/controls/${id}`;
      return api(endpoint, { method: 'DELETE' });
    },
    onSuccess: (_, { type }) => {
      toast.success(`${type} deleted from entire system`);
      queryClient.invalidateQueries({ queryKey: [type === 'Risk' ? 'rcm' : 'controls'] });
      setImpactData(null);
      setNodes(nds => nds.map(node => {
        const newData = { ...node.data };
        if (newData.riskIds) newData.riskIds = newData.riskIds.filter(rid => rid !== impactData?.id);
        if (newData.controlIds) newData.controlIds = newData.controlIds.filter(cid => cid !== impactData?.id);
        return { ...node, data: newData };
      }));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete");
    }
  });

  useEffect(() => {
    if (diagram) {
      setNodes(diagram.nodes || initialNodes);
      setEdges((diagram.edges || []).map((edge: any) => ({
        ...edge,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#1e293b'
        },
        style: {
          strokeWidth: 2,
          stroke: '#1e293b'
        }
      })));
    }
  }, [diagram, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const resetNav = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const getEnrichedControlData = useCallback((ids: string[]) => {
    const items = controlsData?.items || [];
    const list = ids.map(id => items.find(c => c.id === id)).filter(Boolean) as Control[];
    const hasLinkage = list.some(c => c.relatedControlIds && c.relatedControlIds.length > 0);
    const relatedElcIds = Array.from(new Set(list.flatMap(c => c.relatedControlIds || [])));
    const relatedElcNames = relatedElcIds.map(eid => items.find(c => c.id === eid)?.name).filter(Boolean);
    return { hasLinkage, relatedElcNames, list };
  }, [controlsData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/bpm-diagrams/${diagramId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('BPM Diagram saved');
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    }
  });

  const updateNodeData = useCallback((nodeId: string, partialData: any) => {
    setNodes(nds => {
      // 1. Update the target node data
      const updatedNodes = nds.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...partialData } } : node
      );

      const targetNode = updatedNodes.find(n => n.id === nodeId);
      if (!targetNode || !(targetNode.type === 'activity' || targetNode.type === 'automated-activity')) {
        return updatedNodes;
      }

      // 2. Extract unique IDs for badges
      const pairs = targetNode.data.regulatoryPairs || 
                    (targetNode.data.regulatoryData ? [targetNode.data.regulatoryData] : []);
      
      const riskIds = Array.from(new Set(pairs.map((p: any) => p.riskId).filter(Boolean)));
      const controlIds = Array.from(new Set(pairs.map((p: any) => p.controlId).filter(Boolean)));

      // 3. Sync Docked Nodes (Badges)
      const riskBadgeId = `risk_${nodeId}`;
      const ctrlBadgeId = `ctrl_${nodeId}`;
      
      let finalNodes = [...updatedNodes];

      // Sync Risk Badge
      if (riskIds.length > 0) {
        const existingRiskIdx = finalNodes.findIndex(n => n.id === riskBadgeId);
        if (existingRiskIdx > -1) {
          finalNodes[existingRiskIdx] = { 
            ...finalNodes[existingRiskIdx], 
            data: { ...finalNodes[existingRiskIdx].data, riskIds } 
          };
        } else {
          finalNodes.push({
            id: riskBadgeId, type: 'docked-risk', parentId: nodeId, extent: 'parent', draggable: false,
            position: { x: 45, y: -12 }, data: { riskIds, label: 'Risks' }
          });
        }
      } else {
        finalNodes = finalNodes.filter(n => n.id !== riskBadgeId);
      }

      // Sync Control Badge
      if (controlIds.length > 0) {
        const existingCtrlIdx = finalNodes.findIndex(n => n.id === ctrlBadgeId);
        if (existingCtrlIdx > -1) {
          finalNodes[existingCtrlIdx] = { 
            ...finalNodes[existingCtrlIdx], 
            data: { ...finalNodes[existingCtrlIdx].data, controlIds } 
          };
        } else {
          finalNodes.push({
            id: ctrlBadgeId, type: 'docked-control', parentId: nodeId, extent: 'parent', draggable: false,
            position: { x: 130, y: -12 }, data: { controlIds, label: 'Controls' }
          });
        }
      } else {
        finalNodes = finalNodes.filter(n => n.id !== ctrlBadgeId);
      }

      return finalNodes;
    });
  }, [setNodes]);

  const linkRiskToActivity = (nodeId: string, rcmId: string) => {
    setNodes(nds => {
      const parentNode = nds.find(n => n.id === nodeId);
      if (!parentNode) return nds;
      
      const risks = parentNode.data.risks || [];
      if (risks.some((r: any) => r.rcmId === rcmId)) return nds;

      const newRisks = [...risks, { rcmId, controlIds: [] }];
      const childId = `risk_${nodeId}`;
      const childExists = nds.some(n => n.id === childId);

      const riskIds = newRisks.map(r => r.rcmId);
      
      // Update the parent node data AND the child node in one pass
      const updatedNodes = nds.map(node => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, risks: newRisks } };
        }
        if (node.id === childId) {
          return { ...node, data: { ...node.data, riskIds } };
        }
        return node;
      });

      if (!childExists) {
        updatedNodes.push({
          id: childId,
          type: 'docked-risk',
          position: { x: 45, y: -12 }, // Top-left
          parentId: nodeId,
          extent: 'parent',
          draggable: false,
          data: { riskIds, label: 'Risks' }
        });
      }
      
      return updatedNodes;
    });
  };

  const unlinkRiskFromActivity = (nodeId: string, rcmId: string) => {
    setNodes(nds => {
      const parentNode = nds.find(n => n.id === nodeId);
      if (!parentNode) return nds;
      
      const newRisks = (parentNode.data.risks || []).filter((r: any) => r.rcmId !== rcmId);
      const childId = `risk_${nodeId}`;
      const riskIds = newRisks.map(r => r.rcmId);

      if (newRisks.length === 0) {
        return nds
          .filter(n => n.id !== childId)
          .map(node => node.id === nodeId ? { ...node, data: { ...node.data, risks: newRisks } } : node);
      } else {
        return nds.map(node => {
          if (node.id === nodeId) return { ...node, data: { ...node.data, risks: newRisks } };
          if (node.id === childId) return { ...node, data: { ...node.data, riskIds } };
          return node;
        });
      }
    });
    toast.info("Risk unlinked");
  };

  const linkControlToRisk = (nodeId: string, rcmId: string, controlId: string) => {
    setNodes(nds => {
      const parentNode = nds.find(n => n.id === nodeId);
      if (!parentNode) return nds;

      // 1. Calculate new data for parent
      const risks = parentNode.data.risks || [];
      const newRisks = risks.map((r: any) => {
        if (r.rcmId === rcmId) {
          const controlIds = r.controlIds || [];
          if (controlIds.includes(controlId)) return r;
          return { ...r, controlIds: [...controlIds, controlId] };
        }
        return r;
      });

      const allControlIds = newRisks.flatMap(r => r.controlIds);
      const enriched = getEnrichedControlData(allControlIds);
      
      const childId = `ctrl_${nodeId}`;
      const childExists = nds.some(n => n.id === childId);
      
      const badgeData = { 
        controlIds: allControlIds, 
        label: 'Controls',
        hasLinkage: enriched.hasLinkage,
        relatedElcNames: enriched.relatedElcNames
      };

      // 2. Update existing nodes (parent and badge if exists)
      const updatedNodes = nds.map(node => {
        if (node.id === nodeId) {
          return { 
            ...node, 
            data: { 
              ...node.data, 
              risks: newRisks, 
              controlIds: allControlIds,
              hasLinkage: enriched.hasLinkage,
              relatedElcNames: enriched.relatedElcNames
            } 
          };
        }
        if (node.id === childId) {
          return { ...node, data: badgeData };
        }
        return node;
      });

      // 3. Add badge if it doesn't exist and we have controls
      if (!childExists && allControlIds.length > 0) {
        updatedNodes.push({
          id: childId,
          type: 'docked-control',
          position: { x: 130, y: -12 }, // Top-right
          parentId: nodeId,
          extent: 'parent',
          draggable: false,
          data: badgeData
        });
      }

      return updatedNodes;
    });
  };

  const unlinkControlFromRisk = (nodeId: string, rcmId: string, controlId: string) => {
    setNodes(nds => {
      const parentNode = nds.find(n => n.id === nodeId);
      if (!parentNode) return nds;

      const newRisks = (parentNode.data.risks || []).map((r: any) => {
        if (r.rcmId === rcmId) {
          return { ...r, controlIds: (r.controlIds || []).filter((id: string) => id !== controlId) };
        }
        return r;
      });

      const allControlIds = newRisks.flatMap(r => r.controlIds);
      const enriched = getEnrichedControlData(allControlIds);
      const childId = `ctrl_${nodeId}`;

      const badgeData = { 
        controlIds: allControlIds, 
        label: 'Controls',
        hasLinkage: enriched.hasLinkage,
        relatedElcNames: enriched.relatedElcNames
      };

      if (allControlIds.length === 0) {
        return nds
          .filter(n => n.id !== childId)
          .map(node => node.id === nodeId ? { ...node, data: { ...node.data, risks: newRisks, controlIds: [], hasLinkage: false, relatedElcNames: [] } } : node);
      } else {
        return nds.map(node => {
          if (node.id === nodeId) return { ...node, data: { ...node.data, risks: newRisks, controlIds: allControlIds, ...badgeData } };
          if (node.id === childId) return { ...node, data: badgeData };
          return node;
        });
      }
    });
    toast.info("Control unlinked from risk");
  };

  const updateRiskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<RCM> }) => api(`/api/rcm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      toast.success("Risk updated");
    }
  });

  const updateControlMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Control> }) => api(`/api/controls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success("Control updated");
    }
  });

  const checkImpact = async (id: string, type: 'Risk' | 'Control') => {
    try {
      const res = await api<any>(`/api/bpm/usage-check/${id}?type=${type}`);
      setImpactData({ id, type, ...res });
    } catch (e) {
      toast.error("Failed to check impact");
    }
  };

  const linkedRisksWithData = useMemo(() => {
    if (!selectedNode) return [];
    
    // Normalize data: some nodes might have 'risks' (array of objects) 
    // and others might have 'riskIds' (array of strings from legacy/visual badges)
    const risksSource = selectedNode.data.risks || 
                       (selectedNode.data.riskIds || []).map((id: string) => ({ rcmId: id, controlIds: [] }));

    return risksSource.map((r: any) => {
      const rcm = rcmData?.items.find(item => item.id === r.rcmId);
      
      // Get controls from the object, OR fallback to the node's controlIds if it's a legacy structure
      const cIds = r.controlIds || [];
      const controls = cIds.map((cid: string) => controlsData?.items.find(c => c.id === cid)).filter(Boolean) || [];
      
      return {
        ...r,
        rcm: rcm || { id: r.rcmId, riskDescription: `Risk ID: ${r.rcmId} (Missing from Database)` },
        controls
      };
    });
  }, [selectedNode, rcmData, controlsData]);

  const isNodeDirty = useMemo(() => {
    if (!selectedNodeId || !diagram) return false;
    const current = nodes.find(n => n.id === selectedNodeId);
    // Find the same node in the original diagram data
    const original = diagram.nodes?.find((n: any) => n.id === selectedNodeId);
    if (!original) return true; // It's a new node
    
    // Compare essential data (label, role, and the new regulatoryPairs)
    return JSON.stringify(current.data) !== JSON.stringify(original.data);
  }, [nodes, selectedNodeId, diagram]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isLocked ? undefined : onNodesChange}
          onEdgesChange={isLocked ? undefined : onEdgesChange}
          onNodesDelete={isLocked ? undefined : onNodesDelete}
          onEdgesDelete={isLocked ? undefined : onEdgesDelete}
          deleteKeyCode={isLocked ? null : ["Delete", "Backspace"]}
          nodesDraggable={!isLocked}
          nodesConnectable={!isLocked}
          elementsSelectable={true}
          onConnect={isLocked ? undefined : (params) => setEdges((eds) => addEdge({ 
            ...params, 
            markerEnd: { 
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#1e293b'
            },
            style: {
              strokeWidth: 2,
              stroke: '#1e293b'
            }
          }, eds))}
          onNodeClick={(_, node) => resetNav(node.id)}
          onPaneClick={() => resetNav(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background gap={16} size={1} color="#cbd5e1" />
          <Controls />
          <MiniMap />
          <Panel position="top-right" className="flex gap-2">
            {isLocked && (
              <Badge variant="outline" className="h-8 bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                LOCKED (Audit Baseline {diagram?.year})
              </Badge>
            )}
            <Button 
              size="sm" 
              variant="default" 
              className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => saveMutation.mutate({ nodes, edges, name: `Flow: ${subProcess}`, subProcess })} 
              disabled={saveMutation.isPending || isLocked}
            >
              <Save className="h-3.5 w-3.5" /> Save Alur
            </Button>
          </Panel>
          <Panel position="top-left" className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm flex flex-col gap-2">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Process Mapping</span>
               <span className="text-xs font-bold text-slate-700">{subProcess}</span>
             </div>
             {!isLocked && (
               <div className="flex gap-1 pt-1 flex-wrap max-w-[180px]">
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Add Activity" onClick={() => createActivityNode('activity')}>
                    <Activity className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-blue-50" title="Add Automated Activity" onClick={() => createActivityNode('automated-activity')}>
                    <Database className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Add Decision" onClick={() => {
                    const id = `node_${Date.now()}`;
                    setNodes(nds => [...nds, { id, type: 'decision', position: { x: 100, y: 100 }, data: { label: 'Decision?' } }]);
                  }}>
                    <GitCommit className="h-3.5 w-3.5 text-slate-600 rotate-90" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Add Output (System)" onClick={() => {
                    const id = `node_${Date.now()}`;
                    setNodes(nds => [...nds, { id, type: 'output', position: { x: 100, y: 100 }, data: { label: 'System Output' } }]);
                  }}>
                    <LayoutDashboard className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Add Physical Document" onClick={() => {
                    const id = `node_${Date.now()}`;
                    setNodes(nds => [...nds, { id, type: 'physical-document', position: { x: 100, y: 100 }, data: { label: 'Form Fisik' } }]);
                  }}>
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" title="Add On-page Reference" onClick={() => {
                    const id = `node_${Date.now()}`;
                    setNodes(nds => [...nds, { id, type: 'reference', position: { x: 100, y: 100 }, data: { label: 'A' } }]);
                  }}>
                    <LinkIcon className="h-3.5 w-3.5 text-slate-600" />
                  </Button>
               </div>
             )}
          </Panel>
        </ReactFlow>

        <RegulatoryPropertySheet
          selectedNode={selectedNode}
          isOpen={!!selectedNode}
          onClose={() => resetNav(null)}
          onUpdateNodeData={updateNodeData}
          onDeleteNode={(id) => {
            setNodes(nds => nds.filter(n => n.id !== id && n.parentId !== id));
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
            setSelectedNodeId(null);
          }}
          onSave={() => saveMutation.mutate({ nodes, edges, name: `Flow: ${subProcess}`, subProcess })}
          isSaving={saveMutation.isPending}
          isDirty={isNodeDirty}
        />

        <AlertDialog open={!!impactData} onOpenChange={(open) => !open && setImpactData(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete {impactData?.type}?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>Used in <strong>{impactData?.count}</strong> places.</p>
                  {impactData?.usage && impactData.usage.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-md border text-xs max-h-40 overflow-y-auto">
                      {impactData.usage.map((u, i) => <div key={i} className="border-b last:border-0 py-1">{u.diagramName} (Node: {u.nodeLabel})</div>)}
                    </div>
                  )}
                  <p className="text-red-700 font-medium">This action will remove it from ALL diagrams and master data. This cannot be undone.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={() => impactData && deletePermanentlyMutation.mutate({ id: impactData.id, type: impactData.type })} disabled={deletePermanentlyMutation.isPending}>
                {deletePermanentlyMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}
