import React, { useState, useRef, useMemo } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { 
  NodeProps,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  AlertTriangle, ShieldCheck, Activity, Database, FileText, 
} from 'lucide-react';
import { Appendix7aDetailed } from '../reports/Appendix7aDetailed';
import { Appendix7aSummary } from '../reports/Appendix7aSummary';
import { cn } from '@/lib/utils';
import { Control, GLRow, TransactionDetail } from '@shared/types';
import { useCSA } from '@/hooks/useCSA';
import { CSAList } from './CSAList';
import { CSAForm } from './CSAForm';
import { CSADiagramView } from './CSADiagramView';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

// --- Simplified Read-only Nodes ---
const StartEndNode = ({ data }: NodeProps) => (
  <div className={cn(
    "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center",
    data.type === 'start' ? "border-green-600" : "border-red-600"
  )}>
    <Handle 
      type={data.type === 'start' ? "source" : "target"} 
      position={data.type === 'start' ? Position.Bottom : Position.Top} 
      className="opacity-0" 
    />
    <span className={cn("font-bold text-xs uppercase tracking-wider", data.type === 'start' ? "text-green-700" : "text-red-700")}>
      {data.label}
    </span>
  </div>
);

const ActivityNode = ({ data, type }: NodeProps) => (
  <div className={cn(
    "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all relative",
    data.highlight && "ring-8 ring-yellow-400 ring-offset-4 rounded-lg animate-pulse scale-110 z-50"
  )}>
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <div className="font-bold text-xs mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
      {type === 'automated-activity' ? <Database className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
      {data.role || (type === 'automated-activity' ? "SYSTEM" : "Role")}
    </div>
    <div className="text-[12px] font-semibold text-slate-800 leading-tight">{data.label}</div>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': ActivityNode,
  decision: ({ data }: NodeProps) => (
    <div className="relative flex items-center justify-center w-[80px] h-[80px]">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white border-slate-800">
         <div className="-rotate-45 text-center text-xs px-2 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Left} id="no" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="yes" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  document: ({ data }: NodeProps) => (
    <div className="px-3 py-2 border-2 border-slate-800 bg-white text-xs font-bold uppercase rounded-br-lg flex items-center gap-2 relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <FileText className="h-3 w-3" /> {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  system: ({ data }: NodeProps) => (
    <div className="px-3 py-2 border-2 border-blue-800 bg-blue-50 text-xs font-bold uppercase flex flex-col items-center gap-1 relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Database className="h-3 w-3" /> {data.label}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  ),
  risk: ({ data }: NodeProps) => <div className="w-10 h-8 bg-red-600 flex items-center justify-center text-white"><AlertTriangle className="h-4 w-4" /></div>,
  control: ({ data }: NodeProps) => <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white"><ShieldCheck className="h-4 w-4" /></div>,
  'risk-control-badge': ({ data }: NodeProps) => <div className="p-1 bg-indigo-100 border border-indigo-300 text-xs font-bold rounded">{data.label}</div>,
  'docked-risk': ({ data }: NodeProps) => <div className="p-1 bg-red-100 border border-red-300 text-xs font-bold rounded">{data.label}</div>,
  'docked-control': ({ data }: NodeProps) => <div className="p-1 bg-green-100 border border-green-300 text-xs font-bold rounded">{data.label}</div>,
  'reference': ({ data }: NodeProps) => <div className="p-1 bg-slate-100 border border-slate-300 text-xs font-bold rounded italic">{data.label}</div>,
};

interface CSATabContentProps {
  noGL?: string;
  controls?: Control[];
  initialSamples?: (GLRow | TransactionDetail)[];
  bpmProcessId?: string;
  subProcessName?: string;
  standalone?: boolean;
  scheduleId?: string;
}

export function CSATabContent({ 
  noGL, 
  controls: propControls = [], 
  initialSamples = [],
  bpmProcessId,
  subProcessName,
  standalone = false,
  scheduleId
}: CSATabContentProps) {
  const {
    view, setView,
    activeCsa,
    csaList, isListLoading,
    bpmProcess,
    diagram,
    form,
    fields, append,
    watchSamples,
    activeControls,
    bpmRiskControlPairs,
    anyPointFailed,
    isReadOnly,
    isAuthenticating,
    activeUploadRow, setActiveUploadRow,
    createMutation,
    uploadMutation,
    onSaveDraft,
    onSubmit,
    handleBackToList,
    handleDelete,
    manualViewOverride,
    setIsInitialized,
    activeCsaId,
    setActiveCsaId
  } = useCSA({ 
    bpmProcessId: bpmProcessId!, 
    scheduleId, 
    initialSamples, 
    controls: propControls 
  });

  const [printLayout, setPrintLayout] = useState<'detailed' | 'summary' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = form.formState.isDirty && view === 'form';
  useUnsavedChanges(isDirty);

  const handlePrint = (layout: 'detailed' | 'summary') => {
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
      setPrintLayout(null);
    }, 500);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadRow) {
      uploadMutation.mutate({ ...activeUploadRow, file });
    }
    e.target.value = '';
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const filenameParts = lastPart.split('-');
    if (filenameParts.length > 5) {
      return filenameParts.slice(5).join('-');
    }
    return lastPart;
  };

  const previewRecord = useMemo(() => {
    const values = form.getValues();
    return {
      ...activeCsa,
      ...values,
      id: activeCsaId || "PREVIEW-DRAFT",
      assessmentDate: activeCsa?.assessmentDate || Date.now(),
      assessedBy: activeCsa?.assessedBy || "Current User"
    } as any;
  }, [activeCsa, activeCsaId, form]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen { .printable-area { display: none; } }
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .print-hidden { display: none !important; }
        }
      `}} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
        accept=".pdf,.png,.jpg,.jpeg,.xlsx" 
      />

      <div className="printable-area">
        {printLayout === 'detailed' && (
          <Appendix7aDetailed 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL || bpmProcess?.noGL || "N/A"} 
          />
        )}
        {printLayout === 'summary' && (
          <Appendix7aSummary 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL || bpmProcess?.noGL || "N/A"} 
          />
        )}
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 print-hidden">
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white p-6 relative">
              {view === 'list' ? (
                <CSAList 
                  items={csaList?.items || []}
                  isLoading={isListLoading}
                  onViewDetail={(id) => { manualViewOverride.current = 'form'; setActiveCsaId(id); setView('form'); }}
                  onDelete={handleDelete}
                  onPrint={(id, layout) => { setActiveCsaId(id); handlePrint(layout); }}
                  onNewAssessment={() => {
                    manualViewOverride.current = 'form';
                    setIsInitialized(true); 
                    setView('form'); 
                    setActiveCsaId(null);
                    form.reset({
                       period: '2025-Q1',
                       result: 'Effective',
                       comments: '',
                       testProcedure: bpmProcess?.standardTestProcedure || '',
                       archiveLocation: '',
                       isBpmConfirmed: false,
                       samples: []
                    });
                  }}
                />
              ) : (
                <CSAForm 
                  form={form}
                  onSubmit={onSubmit}
                  onSaveDraft={onSaveDraft}
                  onBackToList={handleBackToList}
                  onPrint={handlePrint}
                  onFileUpload={(sIdx, cId) => { setActiveUploadRow({ sIdx, cId }); fileInputRef.current?.click(); }}
                  isReadOnly={isReadOnly}
                  isAuthenticating={isAuthenticating}
                  isPending={createMutation.isPending}
                  activeControls={activeControls}
                  bpmRiskControlPairs={bpmRiskControlPairs}
                  watchSamples={watchSamples}
                  fields={fields}
                  append={append}
                  anyPointFailed={anyPointFailed}
                  activeUploadRow={activeUploadRow}
                  getFileNameFromUrl={getFileNameFromUrl}
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20}>
          <CSADiagramView diagram={diagram} nodeTypes={nodeTypes} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
