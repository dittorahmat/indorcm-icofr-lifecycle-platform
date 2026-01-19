import React, { useCallback, useEffect } from 'react';
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
import { FileText, Database, Activity, GitCommit, PlayCircle, StopCircle, Save, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

// --- Custom Nodes sesuai Legenda Lampiran 3 & 4 ---
// ... (rest of the node components remain the same)

const StartNode = ({ data }: NodeProps) => (
  <div className="px-6 py-2 shadow-sm rounded-[50px] bg-green-50 border-2 border-green-600 min-w-[100px] text-center">
    <Handle type="source" position={Position.Bottom} className="w-2 h-2 opacity-0" />
    <span className="font-bold text-[10px] text-green-800 uppercase tracking-tight">{data.label}</span>
  </div>
);

const EndNode = ({ data }: NodeProps) => (
  <div className="px-6 py-2 shadow-sm rounded-[50px] bg-red-50 border-2 border-red-600 min-w-[100px] text-center">
    <Handle type="target" position={Position.Top} className="w-2 h-2 opacity-0" />
    <span className="font-bold text-[10px] text-red-800 uppercase tracking-tight">{data.label}</span>
  </div>
);

const ActivityNode = ({ data }: NodeProps) => (
  <div className="px-4 py-3 shadow-sm rounded-none bg-white border-2 border-slate-800 min-w-[150px] text-center">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="font-bold text-[9px] mb-1 uppercase text-slate-500 border-b pb-1">{data.role || "Role"}</div>
    <div className="text-[11px] font-medium">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const DecisionNode = ({ data }: NodeProps) => (
  <div className="relative flex items-center justify-center w-[100px] h-[100px]">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="absolute inset-0 bg-white border-2 border-slate-800 rotate-45 transform shadow-sm flex items-center justify-center">
       <div className="-rotate-45 text-center text-[10px] px-2 font-bold leading-tight uppercase">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Left} id="no" className="opacity-0" />
    <Handle type="source" position={Position.Right} id="yes" className="opacity-0" />
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
    <div className="absolute -left-6 top-1/2 text-[9px] font-black text-red-600">NO</div>
    <div className="absolute -right-8 top-1/2 text-[9px] font-black text-green-600">YES</div>
  </div>
);

const DocumentNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-sm bg-white border-2 border-slate-800 min-w-[120px] text-center relative" 
       style={{ borderRadius: "0 0 20px 0" }}>
    <div className="absolute -top-2 left-0 w-4 h-4 bg-white border-t-2 border-l-2 border-slate-800 rotate-45 transform -translate-x-1/2" />
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-tighter">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const SystemNode = ({ data }: NodeProps) => (
  <div className="w-24 h-20 relative flex items-center justify-center">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    {/* Cylinder Shape */}
    <div className="absolute inset-0 border-2 border-blue-800 bg-blue-50" />
    <div className="absolute -top-3 left-0 right-0 h-6 border-2 border-blue-800 bg-blue-100 rounded-[100%]" />
    <div className="z-10 text-[9px] font-black text-blue-900 text-center px-2 uppercase leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const RiskNode = ({ data }: NodeProps) => (
  <div className="w-14 h-14 flex items-center justify-center bg-red-600 border-2 border-red-900 shadow-md relative" 
       style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <AlertTriangle className="h-6 w-6 text-white" />
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
    <div className="absolute -bottom-8 w-32 text-center text-[9px] font-black text-red-700 uppercase leading-none">{data.label}</div>
  </div>
);

const ControlPointNode = ({ data }: NodeProps) => (
  <div className="w-10 h-10 rounded-full bg-green-600 border-2 border-green-900 shadow-md flex items-center justify-center relative">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center">
       <div className="w-2 h-2 rounded-full bg-white" />
    </div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
    <div className="absolute -bottom-8 w-32 text-center text-[9px] font-black text-green-700 uppercase leading-none">{data.label}</div>
  </div>
);

const ArchiveNode = ({ data }: NodeProps) => (
  <div className="w-12 h-16 bg-slate-100 border-2 border-slate-800 relative rounded-sm flex flex-col items-center justify-center shadow-inner">
    <div className="absolute inset-x-0 top-1 h-1 bg-slate-300 mx-1 rounded-full" />
    <div className="absolute inset-x-0 top-3 h-1 bg-slate-300 mx-1 rounded-full" />
    <div className="absolute inset-x-0 top-5 h-1 bg-slate-300 mx-1 rounded-full" />
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <span className="text-[8px] font-black mt-4 text-slate-600 uppercase">ARSIP</span>
    <div className="absolute -bottom-8 w-32 text-center text-[9px] font-bold text-slate-700 uppercase leading-none">{data.label}</div>
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  activity: ActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  system: SystemNode,
  risk: RiskNode,
  control: ControlPointNode,
  archive: ArchiveNode,
};

const defaultNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai' } },
  { id: '2', type: 'activity', position: { x: 225, y: 80 }, data: { label: 'Terima Invoice', role: 'Staff AP' } },
  { id: '3', type: 'decision', position: { x: 240, y: 180 }, data: { label: 'Lengkap?' } },
  { id: '4', type: 'end', position: { x: 250, y: 400 }, data: { label: 'Selesai' } },
];

const defaultEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

interface BPMEditorProps {
  rcmId?: string;
  initialData?: {
    nodes: any[];
    edges: any[];
  };
}

export function BPMEditor({ rcmId, initialData }: BPMEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || defaultEdges);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialData) {
      setNodes(initialData.nodes);
      setEdges(initialData.edges);
    }
  }, [initialData, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/rcm/${rcmId}`, { 
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
    if (!rcmId) {
      toast.error('Cannot save: No RCM ID provided');
      return;
    }
    saveMutation.mutate({ nodes, edges });
  };

  const addNode = (type: string, label: string) => {
    const id = `${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 100, y: 100 },
      data: { label, role: 'User' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-slate-50">
      {/* Sidebar Palette */}
      <div className="w-48 bg-white border-r p-4 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">BPM Palette (Lampiran 4)</h3>
        <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode('activity', 'Aktivitas Manual')}>
          <Activity className="h-4 w-4" /> Activity
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode('decision', 'Keputusan?')}>
          <GitCommit className="h-4 w-4 rotate-90" /> Decision
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode('document', 'Dokumen')}>
          <FileText className="h-4 w-4" /> Document
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode('system', 'System Input')}>
          <Database className="h-4 w-4" /> System
        </Button>
        <div className="border-t my-2" />
        <h3 className="text-[9px] font-bold uppercase text-red-600 mb-1">ICOFR Specifics</h3>
        <Button variant="outline" size="sm" className="justify-start gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => addNode('risk', 'Identifikasi Risiko')}>
          <AlertTriangle className="h-4 w-4" /> Risk (Hexagon)
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100" onClick={() => addNode('control', 'Titik Kontrol')}>
          <ShieldCheck className="h-4 w-4" /> Control Point
        </Button>
        <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode('archive', 'Arsip Dokumen')}>
          <GitCommit className="h-4 w-4 rotate-180" /> Archive
        </Button>
        <div className="border-t my-2" />
        <Button variant="ghost" size="sm" className="justify-start gap-2 text-green-600" onClick={() => addNode('start', 'Start')}>
          <PlayCircle className="h-4 w-4" /> Start
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-2 text-red-600" onClick={() => addNode('end', 'End')}>
          <StopCircle className="h-4 w-4" /> End
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
        
        <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur p-2 rounded-md shadow-sm border">
           <Button 
             size="sm" 
             className="gap-2" 
             onClick={handleSave}
             disabled={saveMutation.isPending}
           >
             <Save className="h-4 w-4" /> 
             {saveMutation.isPending ? 'Saving...' : 'Save Diagram'}
           </Button>
        </div>
      </div>
    </div>
  );
}
