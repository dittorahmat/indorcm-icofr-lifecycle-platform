import React, { useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Database, Activity, GitCommit, PlayCircle, StopCircle, Save } from 'lucide-react';

// --- Custom Nodes sesuai Legenda Lampiran 4 ---

const StartNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-md rounded-full bg-green-100 border-2 border-green-500 min-w-[100px] text-center">
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    <div className="flex items-center justify-center gap-2">
      <PlayCircle className="h-4 w-4 text-green-700" />
      <span className="font-bold text-xs">{data.label}</span>
    </div>
  </div>
);

const EndNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-md rounded-full bg-red-100 border-2 border-red-500 min-w-[100px] text-center">
    <Handle type="target" position={Position.Top} className="w-2 h-2" />
    <div className="flex items-center justify-center gap-2">
      <StopCircle className="h-4 w-4 text-red-700" />
      <span className="font-bold text-xs">{data.label}</span>
    </div>
  </div>
);

const ActivityNode = ({ data }: NodeProps) => (
  <div className="px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-400 min-w-[150px] text-center">
    <Handle type="target" position={Position.Top} className="w-2 h-2" />
    <div className="font-bold text-xs mb-1">{data.role || "Role"}</div>
    <div className="text-xs">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
  </div>
);

const DecisionNode = ({ data }: NodeProps) => (
  <div className="relative flex items-center justify-center w-[120px] h-[120px]">
    <Handle type="target" position={Position.Top} />
    <div className="absolute inset-0 bg-amber-50 border-2 border-amber-500 rotate-45 transform shadow-sm flex items-center justify-center">
       <div className="-rotate-45 text-center text-xs px-2 font-semibold text-amber-900">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Left} id="no" />
    <Handle type="source" position={Position.Right} id="yes" />
    <Handle type="source" position={Position.Bottom} />
    <div className="absolute -left-6 top-1/2 text-[10px] font-bold">NO</div>
    <div className="absolute -right-8 top-1/2 text-[10px] font-bold">YES</div>
  </div>
);

const DocumentNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-md bg-blue-50 border-2 border-blue-400 min-w-[120px] text-center relative" style={{ borderRadius: "2px 2px 20px 2px" }}>
    <Handle type="target" position={Position.Top} />
    <div className="flex flex-col items-center gap-1">
      <FileText className="h-4 w-4 text-blue-700" />
      <span className="text-xs font-semibold">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const SystemNode = ({ data }: NodeProps) => (
  <div className="px-4 py-2 shadow-md bg-purple-50 border-2 border-purple-400 min-w-[120px] text-center rounded-md">
    <Handle type="target" position={Position.Top} />
    <div className="flex flex-col items-center gap-1">
      <Database className="h-4 w-4 text-purple-700" />
      <span className="text-xs font-semibold">{data.label}</span>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  activity: ActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  system: SystemNode,
};

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai' } },
  { id: '2', type: 'activity', position: { x: 225, y: 80 }, data: { label: 'Terima Invoice', role: 'Staff AP' } },
  { id: '3', type: 'decision', position: { x: 240, y: 180 }, data: { label: 'Lengkap?' } },
  { id: '4', type: 'end', position: { x: 250, y: 400 }, data: { label: 'Selesai' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export function BPMEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type: string, label: string) => {
    const id = `${nodes.length + 1}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
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
           <Button size="sm" className="gap-2">
             <Save className="h-4 w-4" /> Save Diagram
           </Button>
        </div>
      </div>
    </div>
  );
}
