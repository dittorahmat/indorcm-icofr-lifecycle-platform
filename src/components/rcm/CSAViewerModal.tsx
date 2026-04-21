import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { RefreshCw, Activity, Database, GitCommit, FileText, LayoutDashboard, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// --- Simplified Read-only Nodes ---

const BaseNode = ({ children, selected, type, highlight }: { children: React.ReactNode, selected?: boolean, type: string, highlight?: boolean }) => (
  <div className={cn(
    "transition-all relative",
    highlight && "ring-8 ring-yellow-400 ring-offset-4 rounded-lg animate-pulse scale-110 z-50"
  )}>
    {children}
  </div>
);

const ActivityNode = ({ data, type, id }: NodeProps) => (
  <BaseNode type={type} highlight={data.highlight}>
    <div className="px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="font-bold text-[9px] mb-1.5 uppercase text-slate-500 border-b pb-1">
        {data.role || "Role"}
      </div>
      <div className="text-[12px] font-semibold text-slate-800 leading-tight">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  </BaseNode>
);

const StartEndNode = ({ data }: NodeProps) => (
  <div className={cn(
    "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center",
    data.type === 'start' ? "border-green-600" : "border-red-600"
  )}>
    <span className={cn("font-bold text-[11px] uppercase tracking-wider", data.type === 'start' ? "text-green-700" : "text-red-700")}>
      {data.label}
    </span>
  </div>
);

// ... Other simplified node components would go here ...

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': ActivityNode, // Reuse activity for simplicity
  decision: ({ data }: NodeProps) => <div className="w-10 h-10 border-2 border-slate-800 rotate-45 bg-white flex items-center justify-center"><div className="-rotate-45 text-[8px] font-bold">{data.label}</div></div>,
  // Fallbacks for other types
};

interface CSAViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  controlId: string;
}

export function CSAViewerModal({ isOpen, onClose, controlId }: CSAViewerModalProps) {
  const { data: impact, isLoading: isImpactLoading } = useQuery({
    queryKey: ['bpm-diagrams', 'by-control', controlId],
    queryFn: () => api<any>(`/api/bpm-diagrams/by-control/${controlId}`),
    enabled: isOpen && !!controlId
  });

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  React.useEffect(() => {
    if (impact?.diagram) {
      const hydratedNodes = (impact.diagram.nodes || []).map((n: any) => ({
        ...n,
        draggable: false,
        data: {
          ...n.data,
          highlight: n.id === impact.nodeId
        }
      }));
      setNodes(hydratedNodes);
      setEdges((impact.diagram.edges || []).map((edge: any) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed }
      })));
    }
  }, [impact, setNodes, setEdges]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            BPM Context for Control Assessment
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative bg-slate-50">
          {isImpactLoading ? (
            <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={true}
              zoomOnScroll={true}
            >
              <Background color="#cbd5e1" gap={16} />
              <Controls />
            </ReactFlow>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
