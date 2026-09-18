import React from 'react';
import ReactFlow, { Background, BackgroundVariant } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Workflow, FileText } from 'lucide-react';
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
  onInit,
  onClose,
  onExportToImage,
}) => {
  return (
    <div className="bg-slate-100 p-8 overflow-y-auto print:p-0 h-full">
      <div
        id="bpm-document-canvas"
        className="max-w-5xl mx-auto border-2 border-slate-300 p-8 shadow-2xl bg-white print:border-none print:shadow-none min-h-screen"
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
            style={
              {
                '--bpm-global-width-scale': globalScale / 100,
                '--bpm-global-font-scale': globalScale / 100,
              } as React.CSSProperties
            }
            onInit={(instance) => {
              onInit?.(instance);
              setTimeout(() => instance.fitView(), 100);
            }}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            panOnDrag={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} color="hsl(var(--muted))" />
          </ReactFlow>
        </div>

        <BPMCanvasFooter
          signatures={signatures}
          onChangeSignature={onChangeSignature}
          isLocked={isLocked}
        />
      </div>

      <div className="fixed bottom-8 right-8 flex gap-2 print:hidden">
        <Button size="lg" className="shadow-2xl gap-2" onClick={onClose}>
          <Workflow className="h-5 w-5" /> Back to Editor
        </Button>
        <Button size="lg" variant="secondary" className="shadow-2xl gap-2" onClick={onExportToImage}>
          <FileText className="h-5 w-5" /> Print / Export PDF
        </Button>
      </div>
    </div>
  );
};
