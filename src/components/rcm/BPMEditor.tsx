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
  Panel,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { 
  FileText, Database, Activity, GitCommit, PlayCircle, StopCircle, 
  Save, AlertTriangle, ShieldCheck, Info, X, RefreshCw, Link as LinkIcon, Workflow, Trash2, 
  Search, PlusCircle, LayoutDashboard, ChevronRight, GripVertical, Check, ChevronsUpDown,
  Layout
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RCM, Control, QualitativeLevel, Settings, BPMNode, BPMProcess } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { RegulatoryPropertySheet } from './properties/RegulatoryPropertySheet';

import { 
  StartEndNode, ActivityNode, ManualInputNode, ExternalProcessNode, 
  AutomatedActivityNode, DecisionNode, DocumentNode, ArchiveNode, 
  DataMediaNode, OffPageRefNode, ReferenceNode, RiskControlBadge, SwimlaneNode 
} from './nodes/BPMCustomNodes';
import { BPMCanvasHeader, BPMCanvasFooter } from './nodes/BPMCanvasLayout';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- React Flow Node Types Mapping ---
const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'manual-input': ManualInputNode,
  'external-process': ExternalProcessNode,
  'automated-activity': AutomatedActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  archive: ArchiveNode,
  'data-media': DataMediaNode,
  'off-page-ref': OffPageRefNode,
  reference: ReferenceNode,
  'risk-control-badge': RiskControlBadge,
  swimlane: SwimlaneNode,
  // Legacy / Helper types
  system: AutomatedActivityNode,
  'docked-risk': RiskControlBadge,
  'docked-control': RiskControlBadge,
};

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', type: 'start' } },
];

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
}

export function BPMEditor({ diagramId, subProcess, workingYear }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const [documentView, setDocumentView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<{ id: string, type: 'Risk' | 'Control', count: number, usage: any[] } | null>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const { setDirty, resetDirty } = useUnsavedChangesContext();

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}`),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings')
  });

  const { data: bpmProcess } = useQuery({
    queryKey: ['bpm-processes', subProcess, workingYear],
    queryFn: async () => {
      const res = await api<{ items: BPMProcess[] }>(`/api/bpm-processes?year=${workingYear}`);
      return res.items.find(p => p.name === subProcess && p.year === parseInt(workingYear));
    },
    enabled: !!subProcess
  });

  // Fetch matrix data for the dynamic backlog
  const { data: matrixData } = useQuery({
    queryKey: ['rcm-matrix-tlc', bpmProcess?.id, workingYear],
    queryFn: async () => {
      let url = `/api/rcm-matrix/tlc?year=${workingYear}`;
      if (bpmProcess?.id) url += `&bpmProcessId=${bpmProcess.id}`;
      return api<{ items: any[] }>(url);
    },
    enabled: !!bpmProcess?.id && !!workingYear
  });

  // Calculate unmapped controls by checking which matrix items are NOT in any node's regulatoryPairs
  const unmappedControls = useMemo(() => {
    if (!matrixData?.items) return [];
    
    const mappedRiskIds = new Set<string>();
    nodes.forEach(node => {
      const nodePairs = node.data?.regulatoryPairs || 
                       (node.data?.regulatoryData ? [node.data.regulatoryData] : []);
      nodePairs.forEach((pair: any) => {
        if (pair.riskId) mappedRiskIds.add(pair.riskId);
      });
      
      // Legacy support check
      if (node.data?.risks && !node.data?.regulatoryPairs && !node.data?.regulatoryData) {
         node.data.risks.forEach((r: any) => mappedRiskIds.add(r.rcmId));
      }
    });

    const filtered = matrixData.items.filter(item => !mappedRiskIds.has(item.rcmId || item.mappingId?.split(':')[0] || item.riskId || item.id));
    console.log("[BPMEditor] unmappedControls calculated:", {
       matrixItemsCount: matrixData.items.length,
       mappedRiskIds: Array.from(mappedRiskIds),
       unmappedCount: filtered.length,
       bpmProcessId: bpmProcess?.id
    });
    return filtered;
  }, [matrixData, nodes, bpmProcess]);

  const isWorkflowLocked = React.useMemo(() => {
    if (!bpmProcess) return false;
    const status = bpmProcess.workflowStatus || 'Draft';
    return status !== 'Draft' && status !== 'Rejected';
  }, [bpmProcess]);

  const isLocked = React.useMemo(() => {
    if (isWorkflowLocked) return true;
    if (!diagram || !workingYear) return false;
    const diagramYear = diagram.year || parseInt(workingYear);
    return diagramYear < parseInt(workingYear) || settings?.isPeriodLocked === true;
  }, [isWorkflowLocked, diagram, workingYear, settings?.isPeriodLocked]);

  const localizedInitialNodes = useMemo(() => [
    { ...initialNodes[0], data: { ...initialNodes[0].data, label: t('bpm:editor.nodes.start') } },
    { id: '2', type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } }
  ], [t]);

  const isDirty = useMemo(() => {
    if (!diagram || isLocked) return false;
    const currentNodes = JSON.stringify(nodes.map(n => ({ id: n.id, position: n.position, data: n.data })));
    const originalNodes = JSON.stringify((diagram.nodes || localizedInitialNodes).map((n: any) => ({ id: n.id, position: n.position, data: n.data })));
    const currentEdges = JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target })));
    const originalEdges = JSON.stringify((diagram.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target })));
    return currentNodes !== originalNodes || currentEdges !== originalEdges;
  }, [nodes, edges, diagram, isLocked, localizedInitialNodes]);

  // Sync isDirty with global context
  useEffect(() => {
    setDirty(isDirty || isExporting);
    return () => resetDirty();
  }, [isDirty, isExporting, setDirty, resetDirty]);

  const updateNodeData = useCallback((nodeId: string, partialData: any) => {
    setNodes(nds => {
      const updatedNodes = nds.map(node => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...partialData } } : node
      );

      const targetNode = updatedNodes.find(n => n.id === nodeId);
      if (!targetNode || targetNode.type === 'swimlane') return updatedNodes;

      // Sync badges if needed
      const pairs = targetNode.data.regulatoryPairs || (targetNode.data.regulatoryData ? [targetNode.data.regulatoryData] : []);
      const riskIds = Array.from(new Set(pairs.map((p: any) => p.riskId).filter(Boolean)));
      const controlIds = Array.from(new Set(pairs.map((p: any) => p.controlId).filter(Boolean)));

      const badgeId = `badge_${nodeId}`;
      let finalNodes = [...updatedNodes];

      if (riskIds.length > 0 || controlIds.length > 0) {
        const existingBadgeIdx = finalNodes.findIndex(n => n.id === badgeId);
        const badgeData = { riskIds, controlIds, label: 'RCM' };
        if (existingBadgeIdx > -1) {
          finalNodes[existingBadgeIdx] = { ...finalNodes[existingBadgeIdx], data: badgeData };
        } else {
          finalNodes.push({
            id: badgeId, type: 'risk-control-badge', parentId: nodeId, extent: 'parent', draggable: false,
            position: { x: targetNode.type === 'decision' ? 85 : 140, y: -10 }, data: badgeData
          });
        }
      } else {
        finalNodes = finalNodes.filter(n => n.id !== badgeId);
      }

      return finalNodes;
    });
  }, [setNodes]);

  useEffect(() => {
    if (diagram) {
      const initialNodesWithHandlers = (diagram.nodes?.length > 0 ? diagram.nodes : localizedInitialNodes).map((node: any) => {
        if (node.type === 'swimlane') {
          return {
            ...node,
            data: {
              ...node.data,
              onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
              onChangeFunction: (v: string) => updateNodeData(node.id, { function: v })
            }
          };
        }
        return node;
      });
      setNodes(initialNodesWithHandlers);
      setEdges((diagram.edges || []).map((edge: any) => ({
        ...edge,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#0f172a'
        },
        style: { strokeWidth: 2, stroke: '#0f172a' }
      })));
    }
  }, [diagram, setNodes, setEdges, localizedInitialNodes, updateNodeData]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const createActivityNode = useCallback((type: string) => {
    const id = `node_${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type,
      position: { x: 100, y: 100 },
      data: {
        label: t(`bpm:editor.nodes.${type.replace('-', '')}` as any) || type,
        role: t('bpm:editor.roles.default'),
        regulatoryPairs: []
      }
    }]);
  }, [setNodes, t]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/bpm-diagrams/${diagramId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t('common:notifications.success'));
      resetDirty();
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    }
  });

  const logExportMutation = useMutation({
    mutationFn: (filename: string) => api('/api/bpm-exports', {
      method: 'POST',
      body: JSON.stringify({ diagramId, filename })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-exports'] });
    }
  });

  const exportToImage = async () => {
    if (!rfInstance) return;

    // Capture the entire document canvas
    const element = document.getElementById('bpm-document-canvas') as HTMLElement;
    if (!element) return;

    setIsExporting(true);
    const toastId = toast.loading(t('bpm:export.generating'));

    try {
      // 1. Force immediate fitView to ensure all nodes are within the diagram div bounds
      rfInstance.fitView({ padding: 0.15, duration: 0 });
      
      // Wait for React Flow and potential logo images to be ready
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Capture snapshot with FULL scroll dimensions
      const width = element.scrollWidth;
      const height = element.scrollHeight;

      // We use a lower pixelRatio (2 instead of 3) to avoid reaching browser canvas size limits
      // while still maintaining high-fidelity (retina quality).
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 2, 
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: 'none',
          margin: '0',
          padding: '0', // Dimensions already include padding via scrollWidth
        }
      });

      // 3. Prepare PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaling to fit BOTH width and height of A4
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
      
      const pdfWidth = imgProps.width * ratio;
      const pdfHeight = imgProps.height * ratio;

      // Center the image on the A4 page
      const xPos = (pageWidth - pdfWidth) / 2;
      const yPos = (pageHeight - pdfHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', xPos, yPos, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const filename = `BPM_${subProcess.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(filename);

      // 4. Audit Log
      await logExportMutation.mutateAsync(filename);
      
      toast.success(t('bpm:export.success', { filename }), { id: toastId });

      // 5. Global Notification
      if (diagram) {
        await api('/api/notifications', {
          method: 'POST',
          body: JSON.stringify({
            organizationId: diagram.organizationId,
            userId: diagram.createdBy,
            message: `BPM Exported: ${filename}`,
            type: 'success'
          })
        });
      }

    } catch (err) {
      console.error('Export Error:', err);
      toast.error(t('bpm:export.error'), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const onNodesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) toast.info(`Deleted ${deleted.length} node(s)`);
  }, []);

  const onEdgesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) toast.info(`Deleted ${deleted.length} connection(s)`);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type || !rfInstance) {
      return;
    }

    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = rfInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    try {
      const parsedData = JSON.parse(type);
      const newNodeId = `node_${Date.now()}`;
      
      const newNode = {
        id: newNodeId,
        type: 'activity',
        position,
        data: { 
          label: parsedData.mappedControlName || parsedData.riskDescription || t('bpm:editor.nodes.activity'),
          role: t('bpm:editor.roles.default'),
          regulatoryPairs: [{ 
             riskId: parsedData.rcmId || parsedData.riskId || parsedData.mappingId?.split(':')[0], 
             riskDescription: parsedData.riskDescription,
             isFraudRelated: parsedData.isFraudRelated,
             riskRating: parsedData.riskRating,
             controlId: parsedData.controlId,
             controlDescription: parsedData.mappedControlDescription || parsedData.baseControlDescription,
             isKeyControl: parsedData.isKeyControl,
             classification: parsedData.controlType || 'TLC',
             ipoC: parsedData.ipoC, ipoA: parsedData.ipoA, ipoV: parsedData.ipoV, ipoRa: parsedData.ipoRa,
             cosoPrinciples: parsedData.cosoPrinciples,
             itgcDomain: parsedData.itgcDomain,
             itgcAssertions: parsedData.itgcAssertions
          }]
        },
      };
      
      setNodes((nds) => {
         const updated = nds.concat(newNode);
         // Instantly add the badge
         return updated.concat({
            id: `badge_${newNodeId}`, type: 'risk-control-badge', parentId: newNodeId, extent: 'parent', draggable: false,
            position: { x: 140, y: -10 }, 
            data: { 
               riskIds: [parsedData.rcmId || parsedData.riskId || parsedData.mappingId?.split(':')[0]].filter(Boolean), 
               controlIds: [parsedData.controlId].filter(Boolean), 
               label: 'RCM' 
            }
         });
      });
      
      setDirty(true);
      toast.success(t('rcm:migration.backlog.mapped_success', { defaultValue: 'Successfully mapped control to canvas' }));
    } catch (e) {
      console.error("Failed to parse dropped data", e);
    }
  }, [rfInstance, setNodes, setDirty, t]);

  if (isDiagramLoading) return <div className="flex h-full items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden print:p-0">
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {documentView ? (
          <div className="bg-slate-100 p-8 overflow-y-auto print:p-0 h-full">
             <div id="bpm-document-canvas" className="max-w-5xl mx-auto border-2 border-slate-300 p-8 shadow-2xl bg-white print:border-none print:shadow-none min-h-screen">
                <BPMCanvasHeader 
                  subProcess={subProcess} 
                  year={workingYear} 
                  isDraft={isDirty} 
                  fsliName={diagram?.fsliName || "N/A"}
                />
                
                <div className="h-[800px] border-2 border-slate-100 rounded-lg relative overflow-hidden">
                   <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onInit={(instance) => {
                         setRfInstance(instance);
                         // Auto fit on load
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

                <BPMCanvasFooter />
             </div>
             
             <div className="fixed bottom-8 right-8 flex gap-2 print:hidden">
                <Button size="lg" className="shadow-2xl gap-2" onClick={() => setDocumentView(false)}>
                   <Workflow className="h-5 w-5" /> Back to Editor
                </Button>
                <Button size="lg" variant="secondary" className="shadow-2xl gap-2" onClick={exportToImage}>
                   <FileText className="h-5 w-5" /> Print / Export PDF
                </Button>
             </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setRfInstance}
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={isLocked ? undefined : onEdgesChange}
            onNodesDelete={isLocked ? undefined : onNodesDelete}
            onEdgesDelete={isLocked ? undefined : onEdgesDelete}
            deleteKeyCode={isLocked ? null : ["Delete", "Backspace"]}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={true}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onConnect={isLocked ? undefined : (params) => setEdges((eds) => addEdge({ 
              ...params, 
              markerEnd: { 
                type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#0f172a'
              },
              style: { strokeWidth: 2, stroke: '#0f172a' }
            }, eds))}
            onNodeClick={(_, node) => {
              if (node.type === 'swimlane') return;
              if (node.type !== 'risk-control-badge') {
                setSelectedNodeId(node.id);
              }
            }}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} size={1} color="hsl(var(--border))" />
            <Controls />
            <MiniMap />
            
            <Panel position="top-right" className="flex gap-3 print:hidden">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
                onClick={() => setDocumentView(true)}
              >
                <Layout className="h-3.5 w-3.5 text-indigo-500" />
                {t('bpm:editor.actions.documentView')}
              </Button>

              {isLocked && (
                <Badge variant="outline" className="h-9 bg-amber-50 text-amber-700 border-amber-200 gap-2 px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('bpm:editor.actions.locked')}
                </Badge>
              )}
              <Button 
                size="sm" 
                className="h-9 gap-2 bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest px-6 rounded-xl" 
                onClick={() => saveMutation.mutate({ 
                  nodes, edges, name: `Flow: ${subProcess}`, subProcess, year: diagram?.year || parseInt(workingYear) 
                })} 
                disabled={saveMutation.isPending || isLocked}
              >
                {saveMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saveMutation.isPending ? t('bpm:editor.actions.saving') : t('bpm:editor.actions.save')}
              </Button>
            </Panel>

            <Panel position="top-left" className="bg-white/95 backdrop-blur-md p-5 rounded-[1.5rem] border border-slate-200 shadow-xl flex flex-col gap-5 max-w-[280px]">
               <div className="flex flex-col border-b border-slate-100 pb-4">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('bpm:modal.title')}</span>
                 <span className="text-sm font-display font-bold text-slate-900 leading-tight">{subProcess}</span>
               </div>
               
               {!isLocked && (
                 <div className="space-y-5">
                    <div className="space-y-3">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Flow Controls</p>
                       <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-10 w-10 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm" title={t('bpm:editor.nodes.start')} onClick={() => {
                            const id = `start_${Date.now()}`;
                            setNodes(nds => [...nds, { id, type: 'start', position: { x: 250, y: 0 }, data: { label: t('bpm:editor.nodes.start'), type: 'start' } }]);
                          }}><PlayCircle className="h-5 w-5 text-emerald-600" /></Button>
                          <Button variant="outline" size="icon" className="h-10 w-10 border-rose-200 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-all shadow-sm" title={t('bpm:editor.nodes.end')} onClick={() => {
                            const id = `end_${Date.now()}`;
                            setNodes(nds => [...nds, { id, type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } }]);
                          }}><StopCircle className="h-5 w-5 text-rose-600" /></Button>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Process Elements</p>
                       <div className="grid grid-cols-4 gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.activity')} onClick={() => createActivityNode('activity')}><Activity className="h-4 w-4 text-slate-600" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.manualInput')} onClick={() => createActivityNode('manual-input')}><Workflow className="h-4 w-4 text-slate-600" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 border-slate-200" title={t('bpm:editor.nodes.automated')} onClick={() => createActivityNode('automated-activity')}><Database className="h-4 w-4 text-slate-700" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.decision')} onClick={() => createActivityNode('decision')}><GitCommit className="h-4 w-4 text-slate-600 rotate-90" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.output')} onClick={() => createActivityNode('output')}><LayoutDashboard className="h-4 w-4 text-slate-600" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.physical')} onClick={() => createActivityNode('document')}><FileText className="h-4 w-4 text-slate-600" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100" title={t('bpm:editor.nodes.archive')} onClick={() => createActivityNode('archive')}><Trash2 className="h-4 w-4 text-slate-600" /></Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 border-slate-200" title={t('bpm:editor.nodes.dataMedia')} onClick={() => createActivityNode('data-media')}><Database className="h-4 w-4 text-slate-700" /></Button>
                       </div>
                    </div>

                    {/* Migration Backlog Section */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                       <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest px-1 flex items-center gap-2">
                          <RefreshCw className="h-3 w-3" /> {t('rcm:migration.backlog.title')}
                       </p>
                       <ScrollArea className="h-[120px] pr-2">
                          <div className="space-y-2">
                             {unmappedControls.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic text-center py-4">No pending items</p>
                             ) : (
                                unmappedControls.map(ctrl => (
                                   <div 
                                      key={ctrl.mappingId}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('application/reactflow', JSON.stringify(ctrl));
                                        e.dataTransfer.effectAllowed = 'move';
                                      }}
                                      className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[10px] font-bold text-indigo-700 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors group"
                                      title={ctrl.mappedControlDescription || ctrl.riskDescription}
                                   >
                                      <GripVertical className="h-3 w-3 text-indigo-300 group-hover:text-indigo-500 shrink-0" />
                                      <span className="truncate">[{ctrl.controlCode || 'N/A'}] {ctrl.mappedControlName || ctrl.riskDescription}</span>
                                   </div>
                                ))
                             )}
                          </div>
                       </ScrollArea>
                       <p className="text-[8px] text-slate-400 italic">{t('rcm:migration.backlog.drag_hint')}</p>
                    </div>

                    <div className="pt-2">
                      <Button variant="secondary" className="w-full h-10 gap-2 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-sm transition-all" onClick={() => {
                        const id = `lane_${Date.now()}`;
                        setNodes(nds => [...nds, { 
                          id, type: 'swimlane', position: { x: 0, y: 0 }, zIndex: -1,
                          style: { width: 400, height: 1000 },
                          data: { 
                            label: t('bpm:editor.swimlane.defaults.lane'), 
                            department: t('bpm:editor.swimlane.defaults.dept'), 
                            function: t('bpm:editor.swimlane.defaults.func'),
                            onChangeDepartment: (v: string) => updateNodeData(id, { department: v }),
                            onChangeFunction: (v: string) => updateNodeData(id, { function: v })
                          } 
                        }]);
                      }}>
                        <GripVertical className="h-3.5 w-3.5" /> {t('bpm:swimlane.add')}
                      </Button>
                    </div>
                 </div>
               )}
            </Panel>
          </ReactFlow>
        )}

        <RegulatoryPropertySheet
          selectedNode={selectedNode}
          isOpen={!!selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdateNodeData={updateNodeData}
          onDeleteNode={(id) => {
            setNodes(nds => nds.filter(n => n.id !== id && n.parentId !== id));
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
            setSelectedNodeId(null);
          }}
          onSave={() => saveMutation.mutate({ 
            nodes, edges, name: `Flow: ${subProcess}`, subProcess, year: diagram?.year || parseInt(workingYear) 
          })}
          isSaving={saveMutation.isPending}
          isDirty={isDirty}
        />

        <AlertDialog open={!!impactData} onOpenChange={(open) => !open && setImpactData(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">{t('bpm:modal.deleteTitle', { type: impactData?.type })}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-3">
                  <div dangerouslySetInnerHTML={{ __html: t('bpm:modal.usedInCount', { count: impactData?.count }) }} />
                  <p className="text-red-700 font-medium">{t('bpm:modal.undoWarning')}</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
              <Button variant="destructive" onClick={() => impactData && queryClient.invalidateQueries({ queryKey: [impactData.type === 'Risk' ? 'rcm' : 'controls'] })} disabled={saveMutation.isPending}>
                {t('common:actions.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm">
              <div className="relative">
                 <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin" />
                 <FileText className="absolute inset-0 m-auto h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('bpm:export.title')}</h3>
                <p className="text-sm text-slate-500">{t('bpm:export.generating')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
