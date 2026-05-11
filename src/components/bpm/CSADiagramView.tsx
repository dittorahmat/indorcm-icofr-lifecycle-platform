import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import { LayoutDashboard } from 'lucide-react';
import { BPMDiagram } from '@shared/types';

interface CSADiagramViewProps {
  diagram?: BPMDiagram;
  nodeTypes: any;
}

export function CSADiagramView({ diagram, nodeTypes }: CSADiagramViewProps) {
  return (
    <div className="h-full relative bg-slate-50 border-l overflow-hidden">
      {diagram ? (
        <ReactFlow nodes={diagram.nodes} edges={diagram.edges} nodeTypes={nodeTypes} fitView>
          <Background color="#cbd5e1" gap={16} />
          <Controls />
        </ReactFlow>
      ) : (
        <div className="h-full flex flex-col items-center justify-center opacity-20">
          <LayoutDashboard className="h-12 w-12 mb-2" />
          <p className="text-xs font-bold uppercase">No Diagram Linked</p>
        </div>
      )}
    </div>
  );
}
