import React from 'react';
import ReactFlow, { Background } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Workflow, FileText } from 'lucide-react';
import { bridgeEdgeOptions } from './canvas-hydration';
import { BPMCanvasHeader, BPMCanvasFooter } from '../nodes/BPMCanvasLayout';

interface BPMDocumentViewProps {
  subProcess: string;
  workingYear: string;
  isDirty: boolean;
  fsliName: string;
  nodes: any[];
  edges: any[];
  globalScale: number;
  signatures: {
    lini1Name: string;
    lini1Date: string;
    lini2Name: string;
    lini2Date: string;
    cfoName: string;
    cfoDate: string;
  };
  onChangeSignature: (key: string, value: string) => void;
  isLocked: boolean;
  nodeTypes: any;
  edgeTypes: any;
  onInit?: (instance: any) => void;
  onClose: () => void;
  onExportToImage: () => void;
}

export const BPMDocumentView: React.FC<BPMDocumentViewProps> = ({
  subProcess,
  workingYear,
  isDirty,
  fsliName,
  nodes,
  edges,
  globalScale,
  signatures,
  onChangeSignature,
  isLocked,
  nodeTypes,
  edgeTypes,
  onInit,
  onClose,
  onExportToImage,
}) => {
  return (
    <div className="bg-slate-100 p-4 sm:p-8 overflow-y-auto print:p-0 h-full">
      <div
        id="bpm-document-canvas"
        className="max-w-5xl mx-auto border-2 border-slate-300 p-4 sm:p-8 shadow-2xl bg-white print:border-none print:shadow-none min-h-[100dvh] rounded-lg overflow-hidden"
      >
        <BPMCanvasHeader
          subProcess={subProcess}
          year={workingYear}
          isDraft={isDirty}
          fsliName={fsliName || 'N/A'}
        />

        <div className="h-[800px] border-2 border-slate-100 rounded-lg relative overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            minZoom={0.02}
            maxZoom={2.5}
            style={
              {
                '--bpm-global-width-scale': globalScale / 100,
                '--bpm-global-font-scale': globalScale / 100,
              } as React.CSSProperties
            }
            onInit={(instance) => {
              onInit?.(instance);
              setTimeout(() => instance.fitView({ padding: 0.15 }), 100);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={bridgeEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            panOnDrag={false}
          >
            <Background gap={16} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </div>

        <BPMCanvasFooter
          signatures={signatures}
          onChangeSignature={onChangeSignature}
          isLocked={isLocked}
        />
      </div>

      <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-2 sm:inset-x-auto sm:right-8 sm:bottom-8 sm:flex-row print:hidden">
        <Button size="lg" className="shadow-2xl gap-2 w-full sm:w-auto" onClick={onClose}>
          <Workflow className="h-5 w-5" /> Back to Editor
        </Button>
        <Button size="lg" variant="secondary" className="shadow-2xl gap-2 w-full sm:w-auto" onClick={onExportToImage}>
          <FileText className="h-5 w-5" /> Print / Export PDF
        </Button>
      </div>
    </div>
  );
};
