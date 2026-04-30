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
import type { RCM, Control, QualitativeLevel, Settings, BPMNode } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { useTranslation } from 'react-i18next';
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

  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<{ id: string, type: 'Risk' | 'Control', count: number, usage: any[] } | null>(null);

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}`),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings')
  });

  const isLocked = React.useMemo(() => {
    if (!diagram || !workingYear) return false;
    const diagramYear = diagram.year || parseInt(workingYear);
    return diagramYear < parseInt(workingYear) || settings?.isPeriodLocked === true;
  }, [diagram, workingYear, settings?.isPeriodLocked]);

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

  const blocker = useUnsavedChanges(isDirty);

  useEffect(() => {
    if (diagram) {
      setNodes(diagram.nodes?.length > 0 ? diagram.nodes : localizedInitialNodes);
      setEdges((diagram.edges || []).map((edge: any) => ({
        ...edge,
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#1e293b'
        },
        style: { strokeWidth: 2, stroke: '#1e293b' }
      })));
    }
  }, [diagram, setNodes, setEdges, localizedInitialNodes]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

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
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    }
  });

  const exportToImage = async () => {
    toast.info("Exporting diagram...");
    window.print();
  };

  const onNodesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) toast.info(`Deleted ${deleted.length} node(s)`);
  }, []);

  const onEdgesDelete = useCallback((deleted: any[]) => {
    if (deleted.length > 0) toast.info(`Deleted ${deleted.length} connection(s)`);
  }, []);

  if (isDiagramLoading) return <div className="flex h-full items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden print:p-0">
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        {documentView ? (
          <div className="bg-slate-100 p-8 overflow-y-auto print:p-0 h-full">
             <div className="max-w-5xl mx-auto border-2 border-slate-300 p-8 shadow-2xl bg-white print:border-none print:shadow-none min-h-screen">
                <BPMCanvasHeader 
                  subProcess={subProcess} 
                  year={workingYear} 
                  isDraft={isDirty} 
                />
                
                <div className="h-[800px] border-2 border-slate-100 rounded-lg relative overflow-hidden">
                   <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      fitView
                      nodesDraggable={false}
                      nodesConnectable={false}
                      zoomOnScroll={false}
                      panOnDrag={false}
                   >
                      <Background variant={BackgroundVariant.Dots} gap={20} color="#f1f5f9" />
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
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={isLocked ? undefined : onEdgesChange}
            onNodesDelete={isLocked ? undefined : onNodesDelete}
            onEdgesDelete={isLocked ? undefined : onEdgesDelete}
            deleteKeyCode={isLocked ? null : ["Delete", "Backspace"]}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={true}
            onConnect={isLocked ? undefined : (params) => setEdges((eds) => addEdge({ 
              ...params, 
              markerEnd: { 
                type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#1e293b'
              },
              style: { strokeWidth: 2, stroke: '#1e293b' }
            }, eds))}
            onNodeClick={(_, node) => node.type !== 'risk-control-badge' && setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} size={1} color="#cbd5e1" />
            <Controls />
            <MiniMap />
            
            <Panel position="top-right" className="flex gap-2 print:hidden">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 gap-2 bg-white border-slate-200"
                onClick={() => setDocumentView(true)}
              >
                <Layout className="h-3.5 w-3.5" />
                Document View
              </Button>

              {isLocked && (
                <Badge variant="outline" className="h-8 bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-3">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('bpm:editor.actions.locked')} ({t('bpm:editor.actions.auditBaseline')} {diagram?.year || workingYear})
                </Badge>
              )}
              <Button 
                size="sm" 
                variant="default" 
                className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" 
                onClick={() => saveMutation.mutate({ 
                  nodes, edges, name: `Flow: ${subProcess}`, subProcess, year: diagram?.year || parseInt(workingYear) 
                })} 
                disabled={saveMutation.isPending || isLocked}
              >
                {saveMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saveMutation.isPending ? t('bpm:editor.actions.saving') : t('bpm:editor.actions.save')}
              </Button>
            </Panel>

            <Panel position="top-left" className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm flex flex-col gap-2">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{t('bpm:modal.title')}</span>
                 <span className="text-xs font-bold text-slate-700">{subProcess}</span>
               </div>
               {!isLocked && (
                 <div className="flex gap-1 pt-1 flex-wrap max-w-[220px]">
                    <Button variant="outline" size="icon" className="h-7 w-7 border-green-600" title={t('bpm:editor.nodes.start')} onClick={() => {
                      const id = `start_${Date.now()}`;
                      setNodes(nds => [...nds, { id, type: 'start', position: { x: 250, y: 0 }, data: { label: t('bpm:editor.nodes.start'), type: 'start' } }]);
                    }}><PlayCircle className="h-3.5 w-3.5 text-green-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 border-red-600" title={t('bpm:editor.nodes.end')} onClick={() => {
                      const id = `end_${Date.now()}`;
                      setNodes(nds => [...nds, { id, type: 'end', position: { x: 250, y: 500 }, data: { label: t('bpm:editor.nodes.end'), type: 'end' } }]);
                    }}><StopCircle className="h-3.5 w-3.5 text-red-600" /></Button>
                    <Separator orientation="vertical" className="h-7 mx-1" />
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.activity')} onClick={() => createActivityNode('activity')}><Activity className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.manualInput')} onClick={() => createActivityNode('manual-input')}><Workflow className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-blue-50" title={t('bpm:editor.nodes.automated')} onClick={() => createActivityNode('automated-activity')}><Database className="h-3.5 w-3.5 text-blue-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.decision')} onClick={() => createActivityNode('decision')}><GitCommit className="h-3.5 w-3.5 text-slate-600 rotate-90" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.output')} onClick={() => createActivityNode('output')}><LayoutDashboard className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.physical')} onClick={() => createActivityNode('document')}><FileText className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.archive')} onClick={() => createActivityNode('archive')}><Trash2 className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.dataMedia')} onClick={() => createActivityNode('data-media')}><Database className="h-3.5 w-3.5 text-blue-800" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.offPageRef')} onClick={() => createActivityNode('off-page-ref')}><ChevronRight className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" title={t('bpm:editor.nodes.reference')} onClick={() => createActivityNode('reference')}><LinkIcon className="h-3.5 w-3.5 text-slate-600" /></Button>
                    <Separator orientation="vertical" className="h-7 mx-1" />
                    <Button variant="secondary" size="sm" className="h-7 px-2 gap-1 text-[9px] font-bold uppercase tracking-tighter" onClick={() => {
                      const id = `lane_${Date.now()}`;
                      setNodes(nds => [...nds, { 
                        id, type: 'swimlane', position: { x: 0, y: 0 }, zIndex: -1,
                        style: { width: 350, height: 800 },
                        data: { 
                          label: 'New Swimlane', department: 'New Department', function: 'New Function',
                          onChangeDepartment: (v: string) => updateNodeData(id, { department: v }),
                          onChangeFunction: (v: string) => updateNodeData(id, { function: v })
                        } 
                      }]);
                    }}>
                      <GripVertical className="h-3 w-3" /> {t('bpm:swimlane.add')}
                    </Button>
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
              <AlertDialogTitle className="text-red-600">Delete {impactData?.type}?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>Used in <strong>{impactData?.count}</strong> places.</p>
                  <p className="text-red-700 font-medium">This cannot be undone.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={() => impactData && queryClient.invalidateQueries({ queryKey: [impactData.type === 'Risk' ? 'rcm' : 'controls'] })} disabled={saveMutation.isPending}>
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}
