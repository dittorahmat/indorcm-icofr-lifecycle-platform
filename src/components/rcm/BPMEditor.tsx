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
  Save, AlertTriangle, ShieldCheck, Info, X, RefreshCw, Link as LinkIcon, Workflow 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RCM, Control } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { motion, AnimatePresence } from 'framer-motion';

// --- Custom Nodes sesuai Legenda Lampiran 3 & 4 ---

const StartEndNode = ({ data, selected }: NodeProps) => (
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
);

const ActivityNode = ({ data, selected }: NodeProps) => (
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
);

const RiskNode = ({ data, selected }: NodeProps) => (
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
);

const ControlPointNode = ({ data, selected }: NodeProps) => (
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
);

const DecisionNode = ({ data, selected }: NodeProps) => (
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
);

const DocumentNode = ({ data, selected }: NodeProps) => (
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
);

const SystemNode = ({ data, selected }: NodeProps) => (
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
);

const ArchiveNode = ({ data, selected }: NodeProps) => (
  <div className={cn(
    "w-14 h-20 bg-slate-100 border-2 border-slate-800 relative rounded-sm flex flex-col items-center justify-center shadow-inner transition-all",
    selected && "ring-4 ring-primary/20 border-primary scale-105 shadow-lg"
  )}>
    <div className="absolute inset-x-0 top-1 h-1 bg-slate-300 mx-1 rounded-full opacity-50" />
    <div className="absolute inset-x-0 top-3 h-1 bg-slate-300 mx-1 rounded-full opacity-50" />
    <div className="absolute inset-x-0 top-5 h-1 bg-slate-300 mx-1 rounded-full opacity-50" />
    <Handle type="target" position={Position.Top} className="z-10" />
    <GitCommit className="h-5 w-5 text-slate-400 mt-2 rotate-180" />
    <span className="text-[9px] font-black mt-1 text-slate-600 uppercase">ARSIP</span>
    <div className={cn(
      "absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 text-center text-[10px] font-bold uppercase leading-none py-1 px-2 rounded-md",
      selected ? "bg-slate-800 text-white" : "text-slate-700 bg-slate-50"
    )}>{data.label}</div>
  </div>
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
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (rcm.bpmData) {
      setNodes(rcm.bpmData.nodes);
      setEdges(rcm.bpmData.edges);
    }
  }, [rcm.bpmData, setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

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
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
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
                <Button variant="ghost" size="sm" className="w-full h-5 text-[8px] text-blue-600 p-0" onClick={syncRiskNode}>
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
            className="absolute top-0 right-0 bottom-0 w-72 bg-white border-l z-30 shadow-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex flex-col">
                <h4 className="font-bold text-xs uppercase text-slate-500">Node Properties</h4>
                <span className="text-[9px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedNodeId(null)}><X className="h-4 w-4" /></Button>
            </div>
            
            <div className="space-y-4">
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
                  <div className="p-3 rounded-md bg-green-50 border border-green-100 text-[10px] text-green-700">
                    Linking a control point ensures that the visual flow matches the audit procedures defined in the matrix.
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Label / Description</label>
                  <textarea 
                    className="w-full text-xs border rounded-md p-2 min-h-[80px] focus:ring-2 focus:ring-primary/20 outline-none"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    disabled={selectedNode.type === 'risk'}
                  />
                  {selectedNode.type === 'risk' && (
                    <p className="text-[9px] text-muted-foreground italic">Risk description is synced from the RCM matrix.</p>
                  )}
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

function motion(props: any) {
  // Simple shim for framer-motion since we use it in other parts
  return <div {...props} />;
}
