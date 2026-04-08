import React, { useCallback, useEffect, useMemo } from 'react';
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
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { 
  FileText, Database, Activity, GitCommit, PlayCircle, StopCircle, 
  Save, AlertTriangle, ShieldCheck, Info, X, RefreshCw, Link as LinkIcon, Workflow, Trash2 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RCM, Control } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Custom Nodes sesuai Legenda Lampiran 3 & 4 ---

const NodeTooltip = ({ children, data, type }: { children: React.ReactNode, data: any, type: string }) => {
  const isRisk = type === 'risk';
  const isControl = type === 'control';
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{children}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px] p-2 bg-slate-900 border-slate-700">
          <div className="space-y-1">
            <p className="font-bold text-[10px] uppercase text-slate-400 border-b border-slate-700 pb-1 mb-1">
              {type} Preview
            </p>
            <p className="text-[11px] font-medium leading-tight text-white">{data.label}</p>
            {data.description && <p className="text-[10px] text-slate-400 line-clamp-2 italic">{data.description}</p>}
            {data.role && <p className="text-[9px] text-blue-400 font-bold uppercase mt-1">Role: {data.role}</p>}
            {data.code && <p className="text-[9px] text-green-400 font-mono">Code: {data.code}</p>}
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

const ActivityNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all",
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

const RiskNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative group transition-all", selected && "scale-110")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "w-20 h-[70px] flex items-center justify-center shadow-xl transition-all",
        selected ? "fill-red-700 stroke-primary stroke-[3px]" : "fill-red-600 stroke-red-900 stroke-[2px]"
      )} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
        <svg width="80" height="70" viewBox="0 0 80 70">
          <path d="M20 0 L60 0 L80 35 L60 70 L20 70 L0 35 Z" />
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
  decision: DecisionNode,
  document: DocumentNode,
  system: SystemNode,
  risk: RiskNode,
  control: ControlPointNode,
  archive: ArchiveNode,
};

const defaultNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai', type: 'start' } },
  { id: '2', type: 'activity', position: { x: 225, y: 80 }, data: { label: 'Terima Invoice', role: 'Staff AP' } },
  { id: '3', type: 'decision', position: { x: 240, y: 180 }, data: { label: 'Lengkap?' } },
  { id: '4', type: 'end', position: { x: 250, y: 400 }, data: { label: 'Selesai', type: 'end' } },
];

const defaultEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

interface BPMEditorProps {
  rcm: RCM;
  controls: Control[];
}

export function BPMEditor({ rcm, controls }: BPMEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(rcm.bpmData?.nodes || defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rcm.bpmData?.edges || defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  
  // Navigation stack for Drilldown: [{ id: string, type: 'node' | 'risk' | 'control' | 'fsli' }]
  const [navStack, setNavStack] = React.useState<{ id: string, type: 'node' | 'risk' | 'control' | 'fsli' }[]>([]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (rcm.bpmData) {
      setNodes(rcm.bpmData.nodes);
      setEdges(rcm.bpmData.edges);
    }
  }, [rcm.bpmData, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const currentNav = navStack[navStack.length - 1];

  const pushNav = (id: string, type: 'node' | 'risk' | 'control' | 'fsli') => {
    setNavStack(prev => [...prev, { id, type }]);
  };

  const popNav = () => {
    setNavStack(prev => prev.slice(0, -1));
  };

  const resetNav = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      setNavStack([{ id: nodeId, type: 'node' }]);
    } else {
      setNavStack([]);
    }
  };

  const DrilldownPanel = () => {
    if (!currentNav) return null;

    if (currentNav.type === 'node') {
      const node = nodes.find(n => n.id === currentNav.id);
      if (!node) return null;

      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Aktivitas BPM</label>
            <p className="text-sm font-semibold text-slate-800">{node.data.label}</p>
            {node.data.role && <p className="text-[10px] text-blue-600 font-bold uppercase">Role: {node.data.role}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" /> Terkait Risiko (Drilldown)
            </label>
            <div className="space-y-1">
              {/* For now, assuming 1 RCM maps to 1 Process Flow, so we show the RCM Risk */}
              <Button 
                variant="outline" 
                className="w-full justify-start text-left h-auto py-2 px-3 border-red-100 bg-red-50/30 hover:bg-red-50"
                onClick={() => pushNav(rcm.id, 'risk')}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-red-700">RISK-{rcm.id.substring(0,4).toUpperCase()}</span>
                  <span className="text-[10px] text-slate-600 line-clamp-2">{rcm.riskDescription}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (currentNav.type === 'risk') {
      const riskControls = controls.filter(c => c.rcmId === rcm.id);
      
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-red-400 uppercase">Detail Risiko</label>
            <p className="text-sm font-semibold text-slate-800">{rcm.riskDescription}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-500" /> Mitigating Controls (Drilldown)
            </label>
            <div className="space-y-1">
              {riskControls.length > 0 ? riskControls.map(ctrl => (
                <Button 
                  key={ctrl.id}
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2 px-3 border-green-100 bg-green-50/30 hover:bg-green-50"
                  onClick={() => pushNav(ctrl.id, 'control')}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-green-700">{ctrl.code || 'NO-CODE'}</span>
                    <span className="text-[10px] text-slate-600 line-clamp-1">{ctrl.name}</span>
                  </div>
                </Button>
              )) : (
                <p className="text-[10px] text-slate-400 italic italic">No controls linked in matrix yet.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentNav.type === 'control') {
      const ctrl = controls.find(c => c.id === currentNav.id);
      if (!ctrl) return null;

      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 font-mono text-[10px]">{ctrl.code || 'CTRL'}</Badge>
              <Badge variant="outline" className="text-[9px] uppercase">{ctrl.type}</Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-800 leading-tight">{ctrl.name}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{ctrl.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Nature</p>
              <p className="text-[10px] font-medium text-slate-700">{ctrl.nature}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Frequency</p>
              <p className="text-[10px] font-medium text-slate-700">{ctrl.frequency}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[8px] font-bold text-slate-400 uppercase">Key Assertions</p>
            <div className="flex flex-wrap gap-1">
              {ctrl.assertions.map(a => <Badge key={a} variant="secondary" className="text-[8px] px-1 h-4">{a}</Badge>)}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <FileText className="h-3 w-3 text-blue-500" /> Affected FSLI (Account)
            </label>
            <div className="space-y-1">
              {ctrl.fsliCodes && ctrl.fsliCodes.length > 0 ? ctrl.fsliCodes.map(code => (
                <Button 
                  key={code}
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2 px-3 border-blue-100 bg-blue-50/30 hover:bg-blue-50"
                  onClick={() => pushNav(code, 'fsli')}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-blue-700">{code}</span>
                    <span className="text-[10px] text-slate-600">Click to view account detail</span>
                  </div>
                </Button>
              )) : (
                <p className="text-[10px] text-slate-400 italic">No FSLI accounts linked yet.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentNav.type === 'fsli') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-blue-400 uppercase">FSLI Detail</label>
            <p className="text-sm font-semibold text-slate-800">Account Code: {currentNav.id}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
             <p className="text-[10px] text-blue-800 leading-relaxed italic">
               Informasi saldo dan signifikansi diambil dari modul Scoping (Lampiran 5).
             </p>
          </div>
          <Button variant="outline" size="sm" className="w-full text-[10px]" onClick={() => window.location.href = `/scoping?fsliCode=${currentNav.id}`}>
             Go to Scoping Matrix
          </Button>
        </div>
      );
    }

    return null;
  };

  // --- Metadata Sync Logic ---
  const syncStatus = useMemo(() => {
    const riskNodes = nodes.filter(n => n.type === 'risk');
    const controlNodes = nodes.filter(n => n.type === 'control');
    
    const errors: string[] = [];
    
    // Check Risk Node Sync
    if (riskNodes.length > 0) {
      const riskNode = riskNodes[0]; // Assuming 1 Risk per RCM
      if (riskNode.data.label !== rcm.riskDescription) {
        errors.push("Risk label mismatch with RCM description");
      }
    } else {
      errors.push("Missing Risk Node in BPM diagram");
    }

    // Check Controls Sync
    const linkedControlIds = controlNodes.map(n => n.data.controlId).filter(Boolean);
    const missingControls = rcm.controls.filter(id => !linkedControlIds.includes(id));
    if (missingControls.length > 0) {
      errors.push(`${missingControls.length} Controls defined in matrix are not linked in BPM`);
    }

    return { 
      isSynced: errors.length === 0,
      errors 
    };
  }, [nodes, rcm]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    resetNav(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    resetNav(null);
  }, []);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/rcm/${rcm.id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ bpmData: data }) 
    }),
    onSuccess: () => {
      toast.success('BPM Diagram saved successfully');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
    },
    onError: (error) => toast.error(`Failed to save diagram: ${error.message}`)
  });

  const handleSave = () => {
    saveMutation.mutate({ nodes, edges });
  };

  const addNode = (type: string, label: string, extraData = {}) => {
    const id = `${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 100, y: 100 },
      data: { label, role: 'User', type, ...extraData },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeData = (id: string, partialData: any) => {
    setNodes(nds => nds.map(node => node.id === id ? { ...node, data: { ...node.data, ...partialData } } : node));
  };

  const deleteNode = (id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
    toast.info("Node and its connections removed");
  };

  const syncRiskNode = () => {
    setNodes(nds => nds.map(n => n.type === 'risk' ? { ...n, data: { ...n.data, label: rcm.riskDescription } } : n));
    toast.info("Risk label synced from Matrix");
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-slate-50 relative">
      {/* Sidebar Palette */}
      <div className="w-52 bg-white border-r p-4 flex flex-col gap-3 z-20 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
          <Workflow className="h-3.5 w-3.5" /> BPM Palette
        </h3>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px]" onClick={() => addNode('activity', 'Aktivitas Manual')}>
          <Activity className="h-4 w-4" /> Activity
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px]" onClick={() => addNode('decision', 'Keputusan?')}>
          <GitCommit className="h-4 w-4 rotate-90" /> Decision
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px]" onClick={() => addNode('document', 'Dokumen')}>
          <FileText className="h-4 w-4" /> Document
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px]" onClick={() => addNode('system', 'System Input')}>
          <Database className="h-4 w-4" /> System
        </Button>
        <div className="border-t my-2" />
        <h3 className="text-[10px] font-bold uppercase text-red-600 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" /> ICOFR Design
        </h3>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px] border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => addNode('risk', rcm.riskDescription)}>
          <AlertTriangle className="h-4 w-4" /> Risk (Hexagon)
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px] border-green-200 bg-green-50 text-green-700 hover:bg-green-100" onClick={() => addNode('control', 'Pilih Kontrol...')}>
          <ShieldCheck className="h-4 w-4" /> Control Point
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-[11px]" onClick={() => addNode('archive', 'Arsip Dokumen')}>
          <GitCommit className="h-4 w-4 rotate-180" /> Archive
        </Button>
        
        {/* Sync Check Section */}
        <div className="mt-auto border-t pt-4">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">Sync Status</span>
              {syncStatus.isSynced ? (
                <Badge className="bg-green-500 h-4 text-[8px] uppercase px-1">Synced</Badge>
              ) : (
                <Badge variant="destructive" className="h-4 text-[8px] uppercase px-1">Out of Sync</Badge>
              )}
            </div>
            {!syncStatus.isSynced && (
              <div className="space-y-1">
                {syncStatus.errors.map((err, i) => (
                  <p key={i} className="text-[8px] text-red-600 leading-tight flex gap-1 items-start">
                    <AlertTriangle className="h-2 w-2 flex-shrink-0 mt-0.5" /> {err}
                  </p>
                ))}
                
                {/* Unmapped Controls Details */}
                {rcm.controls.filter(id => !nodes.filter(n => n.type === 'control').map(n => n.data.controlId).includes(id)).length > 0 && (
                  <div className="pt-1 mt-1 border-t border-slate-200">
                    <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Unmapped Controls:</p>
                    <div className="flex flex-wrap gap-1">
                      {rcm.controls
                        .filter(id => !nodes.filter(n => n.type === 'control').map(n => n.data.controlId).includes(id))
                        .map(id => {
                          const ctrl = controls.find(c => c.id === id);
                          return (
                            <Badge key={id} variant="outline" className="text-[7px] h-3 px-1 border-amber-200 text-amber-700 bg-amber-50">
                              {ctrl?.code || '??'}
                            </Badge>
                          );
                        })
                      }
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" className="w-full h-5 text-[8px] text-blue-600 p-0 mt-1" onClick={syncRiskNode}>
                  <RefreshCw className="h-2 w-2 mr-1" /> Auto-sync Risk Label
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} color="#e2e8f0" />
        </ReactFlow>
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
           <Button 
             size="sm" 
             className="gap-2 shadow-md" 
             onClick={handleSave}
             disabled={saveMutation.isPending}
           >
             {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             {saveMutation.isPending ? 'Saving...' : 'Save Diagram'}
           </Button>
        </div>

        {/* Node Detail Sidebar */}
        {selectedNode && (
          <motion.div 
            initial={{ x: 300 }} 
            animate={{ x: 0 }} 
            className="absolute top-0 right-0 bottom-0 w-72 bg-white border-l z-30 shadow-2xl p-5 flex flex-col gap-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {navStack.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={popNav}>
                      <Workflow className="h-3 w-3 rotate-180 text-blue-600" />
                    </Button>
                  )}
                  <h4 className="font-bold text-xs uppercase text-slate-500">
                    {currentNav?.type === 'node' ? 'Node Properties' : `${currentNav?.type} Details`}
                  </h4>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">ID: {currentNav?.id}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetNav(null)}><X className="h-4 w-4" /></Button>
            </div>
            
            <div className="space-y-4">
              <DrilldownPanel />

              {currentNav?.type === 'node' && (
                <>
                  <Separator className="my-2" />
                  {/* Special Linking for Controls */}
                  {selectedNode.type === 'control' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <LinkIcon className="h-2.5 w-2.5" /> Link to RCM Control
                        </label>
                        <Select 
                          value={selectedNode.data.controlId} 
                          onValueChange={(val) => {
                            const ctrl = controls.find(c => c.id === val);
                            updateNodeData(selectedNode.id, { 
                              controlId: val, 
                              label: ctrl?.name || "Unknown",
                              code: ctrl?.code 
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select control from matrix..." />
                          </SelectTrigger>
                          <SelectContent>
                            {controls.filter(c => c.rcmId === rcm.id).map(c => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                <span className="font-bold text-slate-400 mr-2">[{c.code}]</span> {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Ghost Control Warning */}
                      {selectedNode.data.controlId && !controls.find(c => c.id === selectedNode.data.controlId) && (
                        <div className="p-2 rounded bg-red-50 border border-red-200 flex gap-2 items-start">
                          <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5" />
                          <p className="text-[9px] text-red-700 leading-tight font-bold uppercase">Ghost Control</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Edit Label</label>
                      <textarea 
                        className="w-full text-xs border rounded-md p-2 min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none"
                        value={selectedNode.data.label}
                        onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        disabled={selectedNode.type === 'risk'}
                      />
                    </div>
                  )}

                  {selectedNode.type === 'activity' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Responsibility (Role)</label>
                      <input 
                        className="w-full text-xs border rounded-md p-2 focus:ring-2 focus:ring-primary/20 outline-none"
                        value={selectedNode.data.role}
                        onChange={(e) => updateNodeData(selectedNode.id, { role: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Compliance Tip</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed italic">
                      {selectedNode.type === 'risk' ? 
                        "Risiko harus dihubungkan dengan minimal satu Titik Kontrol (Control Point) untuk memastikan mitigasi yang memadai (Bab III)." : 
                        "Pastikan setiap aktivitas memiliki dokumen output jika menghasilkan bukti audit (Lampiran 8)."}
                    </p>
                  </div>

                  <Separator className="my-2" />
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full gap-2 text-[10px] h-8 font-bold uppercase"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Node
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
  );
}
