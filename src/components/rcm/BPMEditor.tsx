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
  Search, PlusCircle, LayoutDashboard, ChevronRight, GripVertical
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RCM, Control } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { RiskLibraryLookup } from './RiskLibraryLookup';

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

  // Track if diagram has been modified
  const isDirty = useMemo(() => {
    if (!diagram) return false;
    
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

  const createRiskMutation = useMutation({
    mutationFn: (description: string) => api<RCM>('/api/rcm', {
      method: 'POST',
      body: JSON.stringify({ riskDescription: description, subProcess })
    }),
    onSuccess: (newRisk) => {
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
      if (selectedNodeId) linkRiskToActivity(selectedNodeId, newRisk.id);
    }
  });

  const createControlMutation = useMutation({
    mutationFn: (name: string) => api<Control>('/api/controls', {
      method: 'POST',
      body: JSON.stringify({ name, subProcess })
    }),
    onSuccess: (newControl) => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      if (selectedNodeId) linkControlToActivity(selectedNodeId, newControl.id);
    }
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
        markerEnd: { type: MarkerType.ArrowClosed }
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

  const updateNodeData = (id: string, partialData: any) => {
    setNodes(nds => nds.map(node => node.id === id ? { ...node, data: { ...node.data, ...partialData } } : node));
  };

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
    toast.success("Risk linked to activity");
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

    toast.success("Control linked to risk");
  };

  const linkControlToActivity = (nodeId: string, controlId: string) => {
    // Legacy fallback, link to first risk if exists
    const node = nodes.find(n => n.id === nodeId);
    if (node?.data.risks?.length > 0) {
      linkControlToRisk(nodeId, node.data.risks[0].rcmId, controlId);
    } else {
      toast.error("Please add a risk first before linking a control");
    }
  };

  const unlinkControlFromActivity = (nodeId: string, controlId: string) => {
    setNodes(nds => {
      const parentNode = nds.find(n => n.id === nodeId);
      if (!parentNode) return nds;

      const newRisks = (parentNode.data.risks || []).map((r: any) => ({
        ...r,
        controlIds: (r.controlIds || []).filter((cid: string) => cid !== controlId)
      }));
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
          .map(node => node.id === nodeId ? { 
            ...node, 
            data: { 
              ...node.data, 
              risks: newRisks, 
              controlIds: allControlIds,
              hasLinkage: enriched.hasLinkage,
              relatedElcNames: enriched.relatedElcNames
            } 
          } : node);
      } else {
        return nds.map(node => {
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
      }
    });
    toast.info("Control unlinked");
  };

  const checkImpact = async (id: string, type: 'Risk' | 'Control') => {
    try {
      const res = await api<any>(`/api/bpm/usage-check/${id}?type=${type}`);
      setImpactData({ id, type, ...res });
    } catch (e) {
      toast.error("Failed to check impact");
    }
  };

  const linkedRisksWithData = useMemo(() => {
    return selectedNode?.data.risks?.map((r: any) => ({
      ...r,
      rcm: rcmData?.items.find(item => item.id === r.rcmId),
      controls: r.controlIds?.map((cid: string) => controlsData?.items.find(c => c.id === cid)).filter(Boolean) || []
    })).filter((r: any) => r.rcm) || [];
  }, [selectedNode, rcmData, controlsData]);

  if (isDiagramLoading) return <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          deleteKeyCode={["Delete", "Backspace"]}
          onConnect={(params) => setEdges((eds) => addEdge({ 
            ...params, 
            markerEnd: { type: MarkerType.ArrowClosed } 
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
            <Button size="sm" variant="default" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => saveMutation.mutate({ nodes, edges, name: `Flow: ${subProcess}`, subProcess })} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> Save Alur
            </Button>
          </Panel>
          <Panel position="top-left" className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm flex flex-col gap-2">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Process Mapping</span>
               <span className="text-xs font-bold text-slate-700">{subProcess}</span>
             </div>
             <div className="flex gap-1 pt-1 flex-wrap max-w-[180px]">
                <Button variant="outline" size="icon" className="h-7 w-7" title="Add Activity" onClick={() => {
                  const id = `node_${Date.now()}`;
                  setNodes(nds => [...nds, { id, type: 'activity', position: { x: 100, y: 100 }, data: { label: 'New Activity', role: 'Staff' } }]);
                }}>
                  <Activity className="h-3.5 w-3.5 text-slate-600" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 bg-blue-50" title="Add Automated Activity" onClick={() => {
                  const id = `node_${Date.now()}`;
                  setNodes(nds => [...nds, { id, type: 'automated-activity', position: { x: 100, y: 100 }, data: { label: 'System Process' } }]);
                }}>
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
          </Panel>
        </ReactFlow>

        <AnimatePresence>
          {selectedNode && (
            <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l z-30 shadow-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex flex-col">
                  <h4 className="font-bold text-xs uppercase text-slate-500">Properties</h4>
                  <span className="text-[9px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetNav(null)}><X className="h-4 w-4" /></Button>
              </div>

              <ScrollArea className="flex-1 -mx-5 px-5">
                <div className="space-y-4 pb-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Label</label>
                    <textarea className="w-full text-xs border rounded-md p-2 min-h-[80px]" value={selectedNode.data.label} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} />
                  </div>

                  {selectedNode.type === 'activity' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
                        <Input className="h-8 text-xs" value={selectedNode.data.role} onChange={(e) => updateNodeData(selectedNode.id, { role: e.target.value })} />
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1.5">Risks ({linkedRisksWithData.length})</h5>
                            <RiskLibraryLookup 
                              onSelect={(risk, assertions) => {
                                // Instead of prompt, we use the standardized library
                                createRiskMutation.mutate(risk);
                              }}
                              trigger={
                                <Button variant="outline" size="sm" className="h-7 text-[9px] bg-red-50 border-red-100 text-red-700 gap-1">
                                  <PlusCircle className="h-3 w-3" /> Add Standardized
                                </Button>
                              }
                            />
                          </div>

                          {linkedRisksWithData.length > 5 && (
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                              <Input 
                                placeholder="Search linked risks..." 
                                className="h-7 text-[10px] pl-7" 
                                value={riskSearch}
                                onChange={(e) => setRiskSearch(e.target.value)}
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {linkedRisksWithData
                              .filter(r => r.rcm.riskDescription.toLowerCase().includes(riskSearch.toLowerCase()))
                              .map(riskEntry => (
                              <div key={riskEntry.rcmId} className="p-2 rounded border border-red-100 bg-red-50/30 group/item relative space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[10px] font-medium text-red-900 leading-tight pr-8">{riskEntry.rcm.riskDescription}</p>
                                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-300" onClick={() => unlinkRiskFromActivity(selectedNode.id, riskEntry.rcmId)}><X className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-red-200" onClick={() => checkImpact(riskEntry.rcmId, 'Risk')}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                </div>

                                {/* Controls for this specific risk */}
                                <div className="pl-2 border-l-2 border-red-200 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Controls</span>
                                    <Select onValueChange={(val) => linkControlToRisk(selectedNode.id, riskEntry.rcmId, val)}>
                                      <SelectTrigger className="h-5 w-24 text-[8px] bg-white border-slate-200">Link Master</SelectTrigger>
                                      <SelectContent>
                                        <div className="p-2 border-b">
                                           <Input 
                                             placeholder="Search master data..." 
                                             className="h-6 text-[8px]" 
                                             value={controlSearch}
                                             onChange={(e) => setControlSearch(e.target.value)}
                                             onKeyDown={(e) => e.stopPropagation()}
                                           />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                          {controlsData?.items
                                            .filter(c => c.name.toLowerCase().includes(controlSearch.toLowerCase()) || c.code?.toLowerCase().includes(controlSearch.toLowerCase()))
                                            .map(c => <SelectItem key={c.id} value={c.id} className="text-[10px]">[{c.code}] {c.name}</SelectItem>)}
                                          {controlsData?.items.length === 0 && <p className="text-[10px] p-2 text-center text-slate-400 italic">No controls found.</p>}
                                        </div>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {riskEntry.controls.map((ctrl: any) => (
                                    <div key={ctrl.id} className="flex items-center justify-between bg-white/50 p-1 rounded text-[9px] group/ctrl">
                                      <span className="text-slate-600 line-clamp-1">[{ctrl.code}] {ctrl.name}</span>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-4 w-4 text-slate-300 hover:text-red-500 opacity-0 group-hover/ctrl:opacity-100"
                                        onClick={() => {
                                          setNodes(nds => nds.map(node => {
                                            if (node.id === selectedNode.id) {
                                              const newRisks = node.data.risks.map((r: any) => {
                                                if (r.rcmId === riskEntry.rcmId) {
                                                  return { ...r, controlIds: r.controlIds.filter((cid: string) => cid !== ctrl.id) };
                                                }
                                                return r;
                                              });
                                              return { ...node, data: { ...node.data, risks: newRisks } };
                                            }
                                            return node;
                                          }));
                                        }}
                                      >
                                        <X className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm" className="w-full gap-2 text-[10px] h-8 font-bold uppercase" onClick={() => {
                  // Delete the node AND its children (badges)
                  setNodes(nds => nds.filter(n => n.id !== selectedNode.id && n.parentId !== selectedNode.id));
                  setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNodeId(null);
                }}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove Node
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
