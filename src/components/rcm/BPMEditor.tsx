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
  Panel
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

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Custom Nodes sesuai Legenda Lampiran 3 & 4 ---

const NodeTooltip = ({ children, data, type }: { children: React.ReactNode, data: any, type: string }) => {
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

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai', type: 'start' } },
];

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
}

export function BPMEditor({ diagramId, subProcess }: BPMEditorProps) {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [navStack, setNavStack] = useState<{ id: string, type: 'node' | 'risk' | 'control' | 'fsli' }[]>([]);
  const [searchControl, setSearchControl] = useState("");

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}`),
  });

  // 2. Fetch Master Data for Sidebar & Linking
  const { data: controlsData } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls')
  });

  const { data: rcmData } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm')
  });

  useEffect(() => {
    if (diagram) {
      setNodes(diagram.nodes || initialNodes);
      setEdges(diagram.edges || []);
    }
  }, [diagram, setNodes, setEdges]);

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

  // Drag & Drop Handlers
  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/payload', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const payload = JSON.parse(event.dataTransfer.getData('application/payload') || '{}');

      if (typeof type === 'undefined' || !type) return;

      const position = { x: event.clientX - 400, y: event.clientY - 150 }; // Rough adjustment
      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { ...payload },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/bpm-diagrams/${diagramId}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      toast.success('BPM Diagram saved');
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    }
  });

  const assignRcmToDiagramMutation = useMutation({
    mutationFn: ({ rcmId, diagramId }: { rcmId: string, diagramId: string }) => 
      api(`/api/rcm/${rcmId}`, { method: 'PUT', body: JSON.stringify({ diagramId }) }),
    onSuccess: () => {
      toast.success('Risk linked to this diagram');
      queryClient.invalidateQueries({ queryKey: ['rcm'] });
    }
  });

  const linkedRcms = useMemo(() => 
    rcmData?.items.filter(r => r.diagramId === diagramId) || [], 
    [rcmData, diagramId]
  );

  const filteredSidebarControls = useMemo(() => {
    if (!controlsData?.items) return [];
    return controlsData.items.filter(c => 
      c.name.toLowerCase().includes(searchControl.toLowerCase()) || 
      c.code?.toLowerCase().includes(searchControl.toLowerCase())
    );
  }, [controlsData, searchControl]);

  const updateNodeData = (id: string, partialData: any) => {
    setNodes(nds => nds.map(node => node.id === id ? { ...node, data: { ...node.data, ...partialData } } : node));
  };

  if (isDiagramLoading) return <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* Sidebar: Control & Library */}
      <div className="w-80 bg-white border-r flex flex-col shadow-sm z-20">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" /> Controls Library
            </h3>
            <Badge variant="secondary" className="text-[10px] font-mono">{controlsData?.items.length || 0}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search master controls..." 
              className="pl-8 h-9 text-xs" 
              value={searchControl}
              onChange={e => setSearchControl(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase px-2 mb-1">Drag to Alur</p>
            {filteredSidebarControls.map(ctrl => (
              <div 
                key={ctrl.id}
                draggable
                onDragStart={(e) => onDragStart(e, 'control', { label: ctrl.name, code: ctrl.code, controlId: ctrl.id })}
                className="group p-3 rounded-lg border bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-slate-100"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-3 w-3 text-slate-300 mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-indigo-600">{ctrl.code || 'CTRL'}</span>
                      <Badge className="h-3.5 text-[8px] px-1">{ctrl.nature}</Badge>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 leading-tight group-hover:text-indigo-700 transition-colors">{ctrl.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-3 p-2">
            <h3 className="text-[10px] font-bold uppercase text-slate-500">Linked Risks (RCM)</h3>
            {linkedRcms.map(r => (
              <div key={r.id} className="p-2 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-indigo-700 line-clamp-1">{r.subProcess}</span>
                  <span className="text-[9px] text-indigo-500 italic">Linked</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            
            <div className="pt-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Link Existing Risk</label>
              <Select onValueChange={(val) => assignRcmToDiagramMutation.mutate({ rcmId: val, diagramId })}>
                <SelectTrigger className="h-8 text-[10px]">
                  <SelectValue placeholder="Search RCM..." />
                </SelectTrigger>
                <SelectContent>
                  {rcmData?.items.filter(r => !r.diagramId).map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.process} - {r.subProcess}
                    </SelectItem>
                  ))}
                  <SelectItem value="new" className="text-indigo-600 font-bold border-t">+ Create New Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onNodeClick={(_, node) => resetNav(node.id)}
          onPaneClick={() => resetNav(null)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background gap={16} size={1} color="#cbd5e1" />
          <Controls />
          <MiniMap />
          
          <Panel position="top-right" className="flex gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg border shadow-sm">
            <Button 
              size="sm" 
              variant="default"
              className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => saveMutation.mutate({ nodes, edges, name: `Flow: ${subProcess}`, subProcess })}
              disabled={saveMutation.isPending}
            >
              <Save className="h-3.5 w-3.5" /> Save Alur
            </Button>
          </Panel>

          <Panel position="top-left" className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm flex flex-col gap-2">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Process Mapping</span>
               <span className="text-xs font-bold text-slate-700">{subProcess}</span>
             </div>
             <div className="flex gap-1 pt-1">
                <Button variant="outline" size="icon" className="h-7 w-7" title="Add Activity" onClick={() => {
                  const id = `node_${Date.now()}`;
                  setNodes(nds => [...nds, { id, type: 'activity', position: { x: 100, y: 100 }, data: { label: 'New Activity', role: 'Staff' } }]);
                }}>
                  <Activity className="h-3.5 w-3.5 text-slate-600" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" title="Add Decision" onClick={() => {
                  const id = `node_${Date.now()}`;
                  setNodes(nds => [...nds, { id, type: 'decision', position: { x: 100, y: 100 }, data: { label: 'Decision?' } }]);
                }}>
                  <GitCommit className="h-3.5 w-3.5 text-slate-600 rotate-90" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" title="Add Risk" onClick={() => {
                  const id = `node_${Date.now()}`;
                  setNodes(nds => [...nds, { id, type: 'risk', position: { x: 100, y: 100 }, data: { label: 'Risk Description' } }]);
                }}>
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                </Button>
             </div>
          </Panel>
        </ReactFlow>

        {/* Node Detail Properties */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l z-30 shadow-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex flex-col">
                  <h4 className="font-bold text-xs uppercase text-slate-500">Properties</h4>
                  <span className="text-[9px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetNav(null)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Label</label>
                  <textarea 
                    className="w-full text-xs border rounded-md p-2 min-h-[80px] focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  />
                </div>

                {selectedNode.type === 'activity' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Responsibility (Role)</label>
                    <Input 
                      className="h-8 text-xs"
                      value={selectedNode.data.role}
                      onChange={(e) => updateNodeData(selectedNode.id, { role: e.target.value })}
                    />
                  </div>
                )}

                {selectedNode.type === 'control' && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-[10px] font-bold text-green-700 uppercase">Linked Control</span>
                    </div>
                    <p className="text-[11px] font-medium text-green-800 leading-tight">{selectedNode.data.label}</p>
                    <p className="text-[9px] text-green-600 font-mono">{selectedNode.data.code}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full gap-2 text-[10px] h-8 font-bold uppercase"
                  onClick={() => {
                    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                    setSelectedNodeId(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Node
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
