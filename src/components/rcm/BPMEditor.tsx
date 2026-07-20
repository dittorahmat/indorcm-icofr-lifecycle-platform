import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Layout, Layers, Hexagon, Monitor, Clock, HardDrive, Columns, CreditCard, Sliders, ArrowUp, ArrowDown, HelpCircle, Hash, Upload
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
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { RegulatoryPropertySheet } from './properties/RegulatoryPropertySheet';

import { useActiveSimulation, useSimulationSnapshot } from '@/hooks/use-bpm';
import { MultiSelect } from '@/components/ui/multi-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { 
  StartEndNode, ActivityNode, ManualInputNode, ExternalProcessNode, 
  AutomatedActivityNode, DecisionNode, DocumentNode, ArchiveNode, 
  DataMediaNode, OffPageRefNode, ReferenceNode, RiskControlBadge, SwimlaneNode,
  AlternateProcessNode, DataNode, PredefinedProcessNode, InternalStorageNode,
  MultiDocumentNode, PreparationNode, ManualOperationNode, CardNode,
  PunchedTapeNode, SummingJunctionNode, OrNode, CollateNode, SortNode,
  ExtractNode, MergeNode, StoredDataNode, DelayNode, SequentialAccessNode,
  DirectAccessNode, DisplayNode, LoopLimitNode, AnnotationNode
} from './nodes/BPMCustomNodes';
import { BPMCanvasHeader, BPMCanvasFooter } from './nodes/BPMCanvasLayout';
import { BridgeEdge } from './edges/BridgeEdge';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";



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
  'alternate-process': AlternateProcessNode,
  data: DataNode,
  'predefined-process': PredefinedProcessNode,
  'internal-storage': InternalStorageNode,
  'multi-document': MultiDocumentNode,
  preparation: PreparationNode,
  'manual-operation': ManualOperationNode,
  card: CardNode,
  'punched-tape': PunchedTapeNode,
  'summing-junction': SummingJunctionNode,
  or: OrNode,
  collate: CollateNode,
  sort: SortNode,
  extract: ExtractNode,
  merge: MergeNode,
  'stored-data': StoredDataNode,
  delay: DelayNode,
  'sequential-access': SequentialAccessNode,
  'direct-access': DirectAccessNode,
  display: DisplayNode,
  'loop-limit': LoopLimitNode,
  annotation: AnnotationNode,
  // Legacy / Helper types
  system: AutomatedActivityNode,
  'docked-risk': RiskControlBadge,
  'docked-control': RiskControlBadge,
};

const edgeTypes = {
  bridge: BridgeEdge,
};

const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', type: 'start' } },
];

interface BPMEditorProps {
  diagramId: string;
  subProcess: string;
  workingYear: string;
  currentGL?: string;
}

export function BPMEditor({ diagramId, subProcess, workingYear, currentGL }: BPMEditorProps) {
  const { t } = useTranslation(['risklibrary', 'common', 'bpm']);
  const [searchParams, setSearchParams] = useSearchParams();
  const [documentView, setDocumentView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [parsedDiagram, setParsedDiagram] = useState<{ nodes: any[]; edges: any[] } | null>(null);


  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<{ id: string, type: 'Risk' | 'Control', count: number, usage: any[] } | null>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const { setDirty, resetDirty } = useUnsavedChangesContext();

  // --- OCR Diagram Handlers ---
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrFile(file);

    try {
      setIsProcessingOcr(true);
      let base64Image = "";
      if (file.type === "application/pdf") {
        const { renderPdfPageToImage } = await import('@/utils/diagram-parser');
        base64Image = await renderPdfPageToImage(file, 1);
      } else {
        const { compressAndScaleImage } = await import('@/utils/diagram-parser');
        base64Image = await compressAndScaleImage(file, 2048);
      }
      setOcrPreviewUrl(base64Image);
    } catch (err: any) {
      toast.error(t('bpm:ocr.toast.fileError', { message: err.message }));
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleStartOcr = async () => {
    if (!ocrPreviewUrl) return;

    try {
      setIsProcessingOcr(true);
      const res = await api<{ nodes: any[]; edges: any[] }>('/api/bpm-diagrams/ocr', {
        method: 'POST',
        body: JSON.stringify({ image: ocrPreviewUrl }),
      });
      setParsedDiagram(res);
      toast.success(t('bpm:ocr.toast.ocrSuccess'));
    } catch (err: any) {
      toast.error(t('bpm:ocr.toast.ocrError', { message: err.message }));
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleApplyOcr = () => {
    if (!parsedDiagram) return;

    // 1. Separate swimlanes and regular shape nodes from OCR result
    const rawSwimlanes = parsedDiagram.nodes.filter((n: any) => n.type === 'swimlane');
    const rawShapes = parsedDiagram.nodes.filter((n: any) => n.type !== 'swimlane');

    // 2. Preserve existing swimlanes from current state
    const existingSwimlanes = nodes.filter((n: any) => n.type === 'swimlane');

    // 3. Map new OCR swimlanes
    const mappedSwimlanes = rawSwimlanes.map((lane: any) => ({
      id: lane.id,
      type: 'swimlane',
      position: { x: lane.position.x, y: lane.position.y },
      zIndex: -1,
      style: { width: lane.width || 400, height: lane.height || 1000 },
      data: {
        label: lane.label || 'Lane',
        department: lane.department || 'Dept',
        function: lane.function || 'Func',
        isLocked: false,
      }
    }));

    // Combine all swimlanes to search for parent matches
    const allSwimlanes = [...existingSwimlanes, ...mappedSwimlanes];

    // 4. Map shapes, translating coordinates relative to parent swimlane if matched
    const mappedShapes = rawShapes.map((n: any) => {
      const parentLane = allSwimlanes.find((lane: any) => lane.id === n.parentId);
      let posX = n.position.x;
      let posY = n.position.y;
      
      if (parentLane) {
        posX = Math.max(10, n.position.x - parentLane.position.x);
        posY = Math.max(80, n.position.y - parentLane.position.y);
      }

      return {
        id: n.id,
        type: n.type,
        parentId: n.parentId || undefined,
        extent: n.parentId ? 'parent' : undefined,
        position: { x: posX, y: posY },
        data: {
          label: n.label,
          type: n.type,
        }
      };
    });

    // 5. Build final nodes list merging all swimlanes and new shapes
    const combinedNodes = [...allSwimlanes, ...mappedShapes];

    // 6. Inject event handlers
    const finalNodes = combinedNodes.map((node: any) => {
      const isSwimlane = node.type === 'swimlane';
      const isNodeLocked = !!node.data?.isLocked;
      const baseNode = {
        ...node,
        draggable: !isLocked && !isNodeLocked,
        zIndex: isSwimlane ? -1 : (node.zIndex ?? (node.id.startsWith('badge_') ? 20 : 10)),
        dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
      };

      if (isSwimlane) {
        baseNode.data = {
          ...node.data,
          onToggleLock: () => toggleNodeLock(node.id),
          onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
          onChangeFunction: (v: string) => updateNodeData(node.id, { function: v })
        };
      } else {
        baseNode.data = {
          ...node.data,
          onToggleLock: () => toggleNodeLock(node.id)
        };
      }
      return baseNode;
    });

    const standardEdges = parsedDiagram.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || '',
      type: 'bridge',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#0f172a'
      },
      style: { strokeWidth: 2, stroke: '#0f172a' }
    }));

    setNodes(finalNodes);
    setEdges(standardEdges);
    setDirty(true);

    // Reset and close
    setParsedDiagram(null);
    setOcrFile(null);
    setOcrPreviewUrl(null);
    setIsOcrDialogOpen(false);

    toast.success(t('bpm:ocr.toast.applySuccess'));
  };

  // 1. Fetch Diagram Data
  const { data: diagram, isLoading: isDiagramLoading } = useQuery({
    queryKey: ['bpm-diagrams', diagramId, currentGL],
    queryFn: () => api<any>(`/api/bpm-diagrams/${diagramId}${currentGL ? `?noGL=${currentGL}` : ''}`),
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

  const { data: users } = useQuery({
    queryKey: ['users-for-workflow'],
    queryFn: () => api<{ items: { id: string, name: string, role: string }[] }>('/api/users'),
  });

  const [signatures, setSignatures] = useState({
    lini1Name: '',
    lini1Date: '',
    lini2Name: '',
    lini2Date: '',
    cfoName: '',
    cfoDate: ''
  });

  const getUserName = useCallback((userId: string) => {
    if (!users?.items || !userId) return userId;
    const found = users.items.find(u => u.id === userId);
    return found ? found.name : userId;
  }, [users]);

  // Hybrid default & override loading logic for signatures
  useEffect(() => {
    if (diagram) {
      const savedSigs = diagram.metadata?.signatures || {};
      
      const history = bpmProcess?.workflowHistory || [];
      const submitAction = history.find((h: any) => h.action === 'Submit');
      const reviewAction = history.find((h: any) => h.action === 'Review');
      const approveAction = history.find((h: any) => h.action === 'Approve');
      
      const formatTimestamp = (ts: number) => {
        try {
          return format(new Date(ts), 'dd/MM/yyyy');
        } catch {
          return '';
        }
      };

      setSignatures({
        lini1Name: savedSigs.lini1Name !== undefined ? savedSigs.lini1Name : (submitAction?.userId ? getUserName(submitAction.userId) : getUserName(diagram.createdBy || '')),
        lini1Date: savedSigs.lini1Date !== undefined ? savedSigs.lini1Date : (submitAction ? formatTimestamp(submitAction.timestamp) : ''),
        lini2Name: savedSigs.lini2Name !== undefined ? savedSigs.lini2Name : (reviewAction?.userId ? getUserName(reviewAction.userId) : ''),
        lini2Date: savedSigs.lini2Date !== undefined ? savedSigs.lini2Date : (reviewAction ? formatTimestamp(reviewAction.timestamp) : ''),
        cfoName: savedSigs.cfoName !== undefined ? savedSigs.cfoName : (approveAction?.userId ? getUserName(approveAction.userId) : ''),
        cfoDate: savedSigs.cfoDate !== undefined ? savedSigs.cfoDate : (approveAction ? formatTimestamp(approveAction.timestamp) : '')
      });
    }
  }, [diagram, bpmProcess, users, getUserName]);

  const { data: activeSim } = useActiveSimulation(workingYear);
  const { data: activeSnap } = useSimulationSnapshot(activeSim?.glSnapshotId);

  const [selectedGLs, setSelectedGLs] = useState<string[]>([]);
  const [globalScale, setGlobalScale] = useState<number>(100);

  useEffect(() => {
    if (diagram) {
      if (diagram.metadata?.globalScale) {
        setGlobalScale(diagram.metadata.globalScale);
      }
      if (diagram.noGLs && diagram.noGLs.length > 0) {
        setSelectedGLs(diagram.noGLs);
      } else if (currentGL) {
        setSelectedGLs([currentGL]);
      }
    }
  }, [diagram, currentGL]);

  const glOptions = useMemo(() => {
    if (!activeSnap || !activeSnap.rows) return [];
    const accounts: { label: string, value: string, isCurrentFsli: boolean }[] = [];
    const seen = new Set<string>();
    const targetFsli = bpmProcess?.fsliName ? bpmProcess.fsliName.trim().toLowerCase() : "";

    activeSnap.rows.forEach((r: any) => {
      const key = r.noGL;
      if (key && !seen.has(key)) {
        seen.add(key);
        const rFsli = r.fsliName ? r.fsliName.trim().toLowerCase() : "";
        const isCurrentFsli = targetFsli !== "" && rFsli === targetFsli;
        accounts.push({
          label: `${r.noGL} • ${r.glDesc || 'No Description'}`,
          value: r.noGL,
          isCurrentFsli
        });
      }
    });

    return accounts.sort((a, b) => {
      if (a.isCurrentFsli && !b.isCurrentFsli) return -1;
      if (!a.isCurrentFsli && b.isCurrentFsli) return 1;
      return a.value.localeCompare(b.value);
    });
  }, [activeSnap, bpmProcess?.fsliName]);

  // Manage dirty state for GLs
  useEffect(() => {
    if (diagram) {
      const dbGLs = diagram.noGLs || (currentGL ? [currentGL] : []);
      const isGLDirty = selectedGLs.length !== dbGLs.length || !selectedGLs.every(g => dbGLs.includes(g));
      if (isGLDirty) {
        setDirty(true);
      }
    }
  }, [selectedGLs, diagram, currentGL, setDirty]);

  // Fetch matrix data for the dynamic backlog
  const { data: matrixData } = useQuery({
    queryKey: ['rcm-matrix-tlc', bpmProcess?.id, workingYear, currentGL],
    queryFn: async () => {
      let url = `/api/rcm-matrix/tlc?year=${workingYear}`;
      if (bpmProcess?.id) url += `&bpmProcessId=${bpmProcess.id}`;
      if (currentGL) url += `&noGL=${currentGL}`;
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
    
    // Compare signatures with what would be resolved initially
    const savedSigs = diagram.metadata?.signatures || {};
    const history = bpmProcess?.workflowHistory || [];
    const submitAction = history.find((h: any) => h.action === 'Submit');
    const reviewAction = history.find((h: any) => h.action === 'Review');
    const approveAction = history.find((h: any) => h.action === 'Approve');
    
    const formatTimestamp = (ts: number) => {
      try {
        return format(new Date(ts), 'dd/MM/yyyy');
      } catch {
        return '';
      }
    };

    const initialLini1Name = savedSigs.lini1Name !== undefined ? savedSigs.lini1Name : (submitAction?.userId ? getUserName(submitAction.userId) : getUserName(diagram.createdBy || ''));
    const initialLini1Date = savedSigs.lini1Date !== undefined ? savedSigs.lini1Date : (submitAction ? formatTimestamp(submitAction.timestamp) : '');
    const initialLini2Name = savedSigs.lini2Name !== undefined ? savedSigs.lini2Name : (reviewAction?.userId ? getUserName(reviewAction.userId) : '');
    const initialLini2Date = savedSigs.lini2Date !== undefined ? savedSigs.lini2Date : (reviewAction ? formatTimestamp(reviewAction.timestamp) : '');
    const initialCfoName = savedSigs.cfoName !== undefined ? savedSigs.cfoName : (approveAction?.userId ? getUserName(approveAction.userId) : '');
    const initialCfoDate = savedSigs.cfoDate !== undefined ? savedSigs.cfoDate : (approveAction ? formatTimestamp(approveAction.timestamp) : '');

    const sigsChanged = signatures.lini1Name !== initialLini1Name ||
                        signatures.lini1Date !== initialLini1Date ||
                        signatures.lini2Name !== initialLini2Name ||
                        signatures.lini2Date !== initialLini2Date ||
                        signatures.cfoName !== initialCfoName ||
                        signatures.cfoDate !== initialCfoDate;

    const savedScale = diagram.metadata?.globalScale || 100;
    const scaleChanged = globalScale !== savedScale;

    return currentNodes !== originalNodes || currentEdges !== originalEdges || sigsChanged || scaleChanged;
  }, [nodes, edges, diagram, isLocked, localizedInitialNodes, signatures, bpmProcess, getUserName, globalScale]);

  // Sync isDirty with global context using the unique ID hook
  useUnsavedChanges(isDirty || isExporting);

  const handleSwitchGLContext = useCallback((targetGL: string) => {
    if (targetGL === currentGL) return;
    
    if (isDirty) {
      if (!window.confirm(t('common:unsavedChanges.description'))) {
        return;
      }
    }

    const matchedRow = activeSnap?.rows?.find((r: any) => r.noGL === targetGL);
    const glDesc = matchedRow?.glDesc || 'No Description';

    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('noGL', targetGL);
      next.set('glDesc', glDesc);
      return next;
    });

    toast.success(t('bpm:editor.toast.contextSwitched', { defaultValue: `Switched context to ${targetGL}` }));
  }, [currentGL, isDirty, activeSnap, setSearchParams, t]);

  const toggleNodeLock = useCallback((nodeId: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        const nextLocked = !node.data?.isLocked;
        return {
          ...node,
          draggable: !isLocked && !nextLocked,
          data: {
            ...node.data,
            isLocked: nextLocked
          }
        };
      }
      return node;
    }));
    setDirty(true);
  }, [setNodes, setDirty, isLocked]);

  const updateNodeData = useCallback((nodeId: string, partialData: any) => {
    setNodes(nds => {
      const updatedNodes = nds.map(node => {
        if (node.id === nodeId) {
          const isLockedNode = partialData.isLocked !== undefined ? partialData.isLocked : !!node.data?.isLocked;
          return {
            ...node,
            draggable: !isLocked && !isLockedNode,
            data: { ...node.data, ...partialData }
          };
        }
        return node;
      });

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
  }, [setNodes, isLocked]);

  useEffect(() => {
    if (diagram) {
      const initialNodesWithHandlers = (diagram.nodes?.length > 0 ? diagram.nodes : localizedInitialNodes).map((node: any) => {
        const isSwimlane = node.type === 'swimlane';
        const isNodeLocked = !!node.data?.isLocked;
        
        const baseNode = {
          ...node,
          draggable: !isLocked && !isNodeLocked,
          zIndex: isSwimlane ? -1 : (node.zIndex ?? (node.id.startsWith('badge_') ? 20 : 10)),
          dragHandle: isSwimlane ? '.swimlane-drag-handle' : undefined,
        };

        if (isSwimlane) {
          baseNode.data = {
            ...node.data,
            onToggleLock: () => toggleNodeLock(node.id),
            onChangeDepartment: (v: string) => updateNodeData(node.id, { department: v }),
            onChangeFunction: (v: string) => updateNodeData(node.id, { function: v })
          };
        } else {
          baseNode.data = {
            ...node.data,
            onToggleLock: () => toggleNodeLock(node.id)
          };
        }
        return baseNode;
      });
      setNodes(initialNodesWithHandlers);
      setEdges((diagram.edges || []).map((edge: any) => ({
        ...edge,
        type: 'bridge',
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#0f172a'
        },
        style: { strokeWidth: 2, stroke: '#0f172a' }
      })));
    }
  }, [diagram, setNodes, setEdges, localizedInitialNodes, updateNodeData, toggleNodeLock, isLocked]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const createActivityNode = useCallback((type: string) => {
    const id = `node_${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type,
      position: { x: 100, y: 100 },
      draggable: !isLocked,
      zIndex: 10,
      data: {
        label: t(`bpm:editor.nodes.${type.replace('-', '')}` as any) || type,
        role: t('bpm:editor.roles.default'),
        regulatoryPairs: [],
        isLocked: false,
        onToggleLock: () => toggleNodeLock(id)
      }
    }]);
  }, [setNodes, t, isLocked, toggleNodeLock]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api(`/api/bpm-diagrams/${diagramId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t('common:notifications.success'));
      resetDirty();
      queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
    },
    onError: (err: any) => {
      toast.error(err.message || t('common:notifications.error', { defaultValue: 'Failed to save diagram changes' }));
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
        draggable: !isLocked,
        zIndex: 10,
        data: { 
          label: parsedData.mappedControlName || parsedData.riskDescription || t('bpm:editor.nodes.activity'),
          role: t('bpm:editor.roles.default'),
          isLocked: false,
          onToggleLock: () => toggleNodeLock(newNodeId),
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
  }, [rfInstance, setNodes, setDirty, t, isLocked, toggleNodeLock]);

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
                      style={{ 
                        '--bpm-global-width-scale': globalScale / 100, 
                        '--bpm-global-font-scale': globalScale / 100 
                      } as React.CSSProperties}
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

                 <BPMCanvasFooter 
                    signatures={signatures} 
                    onChangeSignature={(key, val) => setSignatures(prev => ({ ...prev, [key]: val }))}
                    isLocked={isLocked}
                 />
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
            style={{ 
              '--bpm-global-width-scale': globalScale / 100, 
              '--bpm-global-font-scale': globalScale / 100 
            } as React.CSSProperties}
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
              type: 'bridge',
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
            edgeTypes={edgeTypes}
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
                  >
                    <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
                    Linked GLs ({selectedGLs.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Link GL Codes</h4>
                      <p className="text-[10px] text-slate-400">Pilih akun GL yang menggunakan diagram alur proses ini.</p>
                    </div>

                    {selectedGLs.length > 0 && (
                      <div className="space-y-1.5 border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Switch Context</span>
                        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                          {selectedGLs.map(glCode => {
                            const opt = glOptions.find(o => o.value === glCode);
                            const label = opt ? opt.label : glCode;
                            const isActive = glCode === currentGL;
                            return (
                              <button
                                key={glCode}
                                type="button"
                                onClick={() => handleSwitchGLContext(glCode)}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between font-medium",
                                  isActive 
                                    ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100" 
                                    : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                )}
                              >
                                <span className="truncate flex-1 pr-2">{label}</span>
                                {isActive ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                ) : (
                                  <LinkIcon className="h-3 w-3 text-slate-400 hover:text-indigo-500 transition-colors shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manage Link GLs</span>
                      <MultiSelect
                        options={glOptions}
                        selected={selectedGLs}
                        onChange={setSelectedGLs}
                        placeholder="Search and select GLs..."
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 h-9 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Scale:</span>
                <Select value={String(globalScale)} onValueChange={(val) => setGlobalScale(Number(val))}>
                  <SelectTrigger className="h-7 w-[75px] text-xs font-bold border-none bg-transparent focus:ring-0 p-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80" className="text-xs">80%</SelectItem>
                    <SelectItem value="100" className="text-xs">100%</SelectItem>
                    <SelectItem value="120" className="text-xs">120%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isLocked && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
                  onClick={() => setIsOcrDialogOpen(true)}
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-500" />
                  {t('bpm:ocr.importButton')}
                </Button>
              )}

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
                  nodes, edges, name: `Flow: ${subProcess}`, subProcess, year: diagram?.year || parseInt(workingYear), noGLs: selectedGLs,
                  metadata: { ...diagram?.metadata, signatures, globalScale }
                })} 
                disabled={saveMutation.isPending || isLocked}
              >
                {saveMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saveMutation.isPending ? t('bpm:editor.actions.saving') : t('bpm:editor.actions.save')}
              </Button>
            </Panel>

            <Panel position="top-left" className="bg-white/95 backdrop-blur-md p-5 rounded-[1.5rem] border border-slate-200 shadow-xl flex flex-col gap-5 max-w-[280px] max-h-[85vh] overflow-y-auto scrollbar-thin">
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
                        <ScrollArea className="h-[200px] pr-2 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                           <div className="grid grid-cols-4 gap-2">
                              {/* Row 1 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.activity')} onClick={() => createActivityNode('activity')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="5" width="20" height="14" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.alternateProcess')} onClick={() => createActivityNode('alternate-process')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="5" width="20" height="14" rx="4" ry="4" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.decision')} onClick={() => createActivityNode('decision')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 2 L22 12 L12 22 L2 12 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.data')} onClick={() => createActivityNode('data')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 5 L22 5 L19 19 L2 19 Z" /></svg>
                              </Button>

                              {/* Row 2 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.predefinedProcess')} onClick={() => createActivityNode('predefined-process')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="5" width="20" height="14" /><line x1="6" y1="5" x2="6" y2="19" /><line x1="18" y1="5" x2="18" y2="19" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.internalStorage')} onClick={() => createActivityNode('internal-storage')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="5" width="20" height="14" /><line x1="6" y1="5" x2="6" y2="19" /><line x1="2" y1="9" x2="22" y2="9" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.physical')} onClick={() => createActivityNode('document')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 4 L22 4 L22 16 Q18 20 15 16 T8 16 T2 16 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.multiDocument')} onClick={() => createActivityNode('multi-document')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 2 L21 2 L21 11 Q18 14 16 11 T11 11 T5 11 Z" stroke="#94a3b8" /><path d="M3 5 L19 5 L19 14 Q16 17 14 14 T9 14 T3 14 Z" stroke="#64748b" /><path d="M1 8 L17 8 L17 17 Q14 20 12 17 T7 17 T1 17 Z" /></svg>
                              </Button>

                              {/* Row 3 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.preparation')} onClick={() => createActivityNode('preparation')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 5 L18 5 L22 12 L18 19 L6 19 L2 12 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.manualInput')} onClick={() => createActivityNode('manual-input')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 8 L22 4 L22 19 L2 19 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.manualOperation')} onClick={() => createActivityNode('manual-operation')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 5 L22 5 L18 19 L6 19 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.reference')} onClick={() => createActivityNode('reference')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="8" /></svg>
                              </Button>

                              {/* Row 4 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.offPageRef')} onClick={() => createActivityNode('off-page-ref')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 4 L22 4 L22 13 L12 20 L2 13 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.card')} onClick={() => createActivityNode('card')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 5 L22 5 L22 19 L2 19 L2 9 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.punchedTape')} onClick={() => createActivityNode('punched-tape')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 7 Q7 4 12 7 T22 7 L22 17 Q17 20 12 17 T2 17 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.summingJunction')} onClick={() => createActivityNode('summing-junction')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="8" /><line x1="6.5" y1="6.5" x2="17.5" y2="17.5" /><line x1="6.5" y1="17.5" x2="17.5" y2="6.5" /></svg>
                              </Button>

                              {/* Row 5 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.or')} onClick={() => createActivityNode('or')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="8" /><line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.collate')} onClick={() => createActivityNode('collate')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 5 L20 5 L4 19 L20 19 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.sort')} onClick={() => createActivityNode('sort')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 5 L20 5 L4 19 L20 19 Z" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.extract')} onClick={() => createActivityNode('extract')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 4 L21 19 L3 19 Z" /></svg>
                              </Button>

                              {/* Row 6 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.merge')} onClick={() => createActivityNode('merge')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 5 L21 5 L12 20 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.storedData')} onClick={() => createActivityNode('stored-data')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 5 L17 5 A 3 7 0 0 1 17 19 L4 19 A 3 7 0 0 1 4 5 Z" /><path d="M4 5 A 3 7 0 0 0 4 19" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.delay')} onClick={() => createActivityNode('delay')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 5 L13 5 A 7 7 0 0 1 13 19 L3 19 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.sequentialAccess')} onClick={() => createActivityNode('sequential-access')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="10" cy="11" r="6" /><line x1="10" y1="17" x2="20" y2="17" /></svg>
                              </Button>

                              {/* Row 7 */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.directAccess')} onClick={() => createActivityNode('direct-access')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 5 L16 5 A 3 7 0 0 1 16 19 L2 19 A 3 7 0 0 1 2 5 Z" /><ellipse cx="16" cy="12" rx="3" ry="7" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.display')} onClick={() => createActivityNode('display')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 5 L4 5 L2 12 L4 19 L18 19 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.loopLimit')} onClick={() => createActivityNode('loop-limit')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 5 L19 5 L22 9 L22 19 L2 19 L2 9 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.annotation')} onClick={() => createActivityNode('annotation')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeDasharray="2 2"><path d="M12 4 L4 4 L4 20 L12 20" /></svg>
                              </Button>

                              {/* Standard System & Archive nodes */}
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" title={t('bpm:editor.nodes.automated')} onClick={() => createActivityNode('automated-activity')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.archive')} onClick={() => createActivityNode('archive')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M2 5 L22 5 L12 20 Z" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" title={t('bpm:editor.nodes.dataMedia')} onClick={() => createActivityNode('data-media')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><ellipse cx="12" cy="7" rx="8" ry="3" /><path d="M4 7 L4 17 A 8 3 0 0 0 20 17 L20 7" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800" title={t('bpm:editor.nodes.output')} onClick={() => createActivityNode('output')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect x="2" y="4" width="20" height="11" /><rect x="6" y="15" width="12" height="5" /></svg>
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700" title={t('bpm:swimlane.add')} onClick={() => {
                                const id = `lane_${Date.now()}`;
                                setNodes(nds => [...nds, { 
                                  id, 
                                  type: 'swimlane', 
                                  position: { x: 0, y: 0 }, 
                                  zIndex: -1,
                                  draggable: !isLocked,
                                  dragHandle: '.swimlane-drag-handle',
                                  style: { width: 400, height: 1000 },
                                  data: { 
                                    label: t('bpm:editor.swimlane.defaults.lane'), 
                                    department: t('bpm:editor.swimlane.defaults.dept'), 
                                    function: t('bpm:editor.swimlane.defaults.func'),
                                    isLocked: false,
                                    onToggleLock: () => toggleNodeLock(id),
                                    onChangeDepartment: (v: string) => updateNodeData(id, { department: v }),
                                    onChangeFunction: (v: string) => updateNodeData(id, { function: v })
                                  } 
                                }]);
                              }}>
                                <Columns className="h-4 w-4" />
                              </Button>
                           </div>
                        </ScrollArea>
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
            nodes, edges, name: `Flow: ${subProcess}`, subProcess, year: diagram?.year || parseInt(workingYear), noGLs: selectedGLs,
            metadata: { ...diagram?.metadata, signatures, globalScale }
          })}
          isSaving={saveMutation.isPending}
          isDirty={isDirty}
          isLocked={isLocked}
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

      {/* --- OCR Diagram Import & Review Dialog --- */}
      <Dialog open={isOcrDialogOpen} onOpenChange={(open) => !isProcessingOcr && setIsOcrDialogOpen(open)}>
        <DialogContent className={cn("max-w-md transition-all duration-300", parsedDiagram && "max-w-4xl")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Upload className="h-5 w-5 text-emerald-600" />
              {parsedDiagram ? t('bpm:ocr.reviewTitle') : t('bpm:ocr.importTitle')}
            </DialogTitle>
          </DialogHeader>

          {parsedDiagram ? (
            <div className="grid grid-cols-2 gap-6 h-[500px] mt-4">
              {/* Left Column: Source image preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-4 relative shadow-inner">
                <span className="absolute top-2 left-2 bg-slate-900/75 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">{t('bpm:ocr.originalImage')}</span>
                <img src={ocrPreviewUrl || ''} className="max-h-full max-w-full object-contain shadow-sm rounded-lg" alt="Source Diagram" />
              </div>

              {/* Right Column: parsed nodes edit table */}
              <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{t('bpm:ocr.shapeDetection')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t('bpm:ocr.nodesCount', { count: parsedDiagram.nodes.length })} • {t('bpm:ocr.edgesCount', { count: parsedDiagram.edges.length })}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-400 italic">{t('bpm:ocr.adjustmentInstructions')}</p>
                    <div className="space-y-3">
                      {parsedDiagram.nodes.map((node, index) => {
                        let shapeName = t('bpm:ocr.shapes.activity');
                        let iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-md";

                        if (node.type === 'start') {
                          shapeName = t('bpm:ocr.shapes.start');
                          iconBg = "bg-emerald-50 border-emerald-300 text-emerald-700 rounded-full";
                        } else if (node.type === 'end') {
                          shapeName = t('bpm:ocr.shapes.end');
                          iconBg = "bg-rose-50 border-rose-300 text-rose-700 rounded-full";
                        } else if (node.type === 'automated-activity') {
                          shapeName = t('bpm:ocr.shapes.system');
                          iconBg = "bg-blue-50 border-blue-300 text-blue-700 rounded-md";
                        } else if (node.type === 'decision') {
                          shapeName = t('bpm:ocr.shapes.decision');
                          iconBg = "bg-amber-50 border-amber-300 text-amber-700 rotate-45 transform w-7 h-7";
                        } else if (node.type === 'archive') {
                          shapeName = t('bpm:ocr.shapes.archive');
                          iconBg = "bg-slate-50 border-slate-800 text-slate-700 [clip-path:polygon(0%_0%,100%_0%,50%_100%)] w-8 h-8";
                        } else if (node.type === 'data-media') {
                          shapeName = t('bpm:ocr.shapes.dataMedia');
                          iconBg = "bg-sky-50 border-sky-300 text-sky-700 rounded-t-lg rounded-b-lg";
                        } else if (node.type === 'document') {
                          shapeName = t('bpm:ocr.shapes.document');
                          iconBg = "bg-slate-50 border-slate-400 text-slate-600 rounded-b-xl";
                        } else if (node.type === 'alternate-process') {
                          shapeName = t('bpm:ocr.shapes.alternateProcess');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-lg";
                        } else if (node.type === 'data') {
                          shapeName = t('bpm:ocr.shapes.data');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-sm";
                        } else if (node.type === 'predefined-process') {
                          shapeName = t('bpm:ocr.shapes.predefinedProcess');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 border-l-4 border-r-4";
                        } else if (node.type === 'internal-storage') {
                          shapeName = t('bpm:ocr.shapes.internalStorage');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'multi-document') {
                          shapeName = t('bpm:ocr.shapes.multiDocument');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 shadow-sm";
                        } else if (node.type === 'preparation') {
                          shapeName = t('bpm:ocr.shapes.preparation');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-[50%]";
                        } else if (node.type === 'manual-operation') {
                          shapeName = t('bpm:ocr.shapes.manualOperation');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'card') {
                          shapeName = t('bpm:ocr.shapes.card');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-tl-none";
                        } else if (node.type === 'punched-tape') {
                          shapeName = t('bpm:ocr.shapes.punchedTape');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'summing-junction') {
                          shapeName = t('bpm:ocr.shapes.summingJunction');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-full";
                        } else if (node.type === 'or') {
                          shapeName = t('bpm:ocr.shapes.or');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-full";
                        } else if (node.type === 'collate') {
                          shapeName = t('bpm:ocr.shapes.collate');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'sort') {
                          shapeName = t('bpm:ocr.shapes.sort');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'extract') {
                          shapeName = t('bpm:ocr.shapes.extract');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'merge') {
                          shapeName = t('bpm:ocr.shapes.merge');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'stored-data') {
                          shapeName = t('bpm:ocr.shapes.storedData');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-r-full";
                        } else if (node.type === 'delay') {
                          shapeName = t('bpm:ocr.shapes.delay');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-r-full";
                        } else if (node.type === 'sequential-access') {
                          shapeName = t('bpm:ocr.shapes.sequentialAccess');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-full";
                        } else if (node.type === 'direct-access') {
                          shapeName = t('bpm:ocr.shapes.directAccess');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-r-full";
                        } else if (node.type === 'display') {
                          shapeName = t('bpm:ocr.shapes.display');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 rounded-l-full";
                        } else if (node.type === 'loop-limit') {
                          shapeName = t('bpm:ocr.shapes.loopLimit');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700";
                        } else if (node.type === 'annotation') {
                          shapeName = t('bpm:ocr.shapes.annotation');
                          iconBg = "bg-slate-50 border-slate-300 text-slate-700 border-dashed";
                        }

                        return (
                          <div key={node.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all">
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                              <div className={cn("w-full h-full border-2 flex items-center justify-center font-bold text-[8px] uppercase tracking-tighter shadow-sm", iconBg)}>
                                {node.type === 'decision' ? <span className="-rotate-45">DEC</span> : (node.type === 'archive' ? <span className="text-[7px]">ARS</span> : node.type.substring(0, 3))}
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{shapeName}</span>
                                <select 
                                  value={node.type} 
                                  onChange={(e) => {
                                    const updated = [...parsedDiagram.nodes];
                                    updated[index].type = e.target.value;
                                    setParsedDiagram({ ...parsedDiagram, nodes: updated });
                                  }}
                                  className="text-[10px] border border-slate-200 bg-white rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                                >
                                  <option value="start">{t('bpm:ocr.options.start')}</option>
                                  <option value="end">{t('bpm:ocr.options.end')}</option>
                                  <option value="activity">{t('bpm:ocr.options.activity')}</option>
                                  <option value="automated-activity">{t('bpm:ocr.options.system')}</option>
                                  <option value="decision">{t('bpm:ocr.options.decision')}</option>
                                  <option value="archive">{t('bpm:ocr.options.archive')}</option>
                                  <option value="data-media">{t('bpm:ocr.options.dataMedia')}</option>
                                  <option value="document">{t('bpm:ocr.options.document')}</option>
                                  <option value="alternate-process">{t('bpm:ocr.options.alternate-process')}</option>
                                  <option value="data">{t('bpm:ocr.options.data')}</option>
                                  <option value="predefined-process">{t('bpm:ocr.options.predefined-process')}</option>
                                  <option value="internal-storage">{t('bpm:ocr.options.internal-storage')}</option>
                                  <option value="multi-document">{t('bpm:ocr.options.multi-document')}</option>
                                  <option value="preparation">{t('bpm:ocr.options.preparation')}</option>
                                  <option value="manual-operation">{t('bpm:ocr.options.manual-operation')}</option>
                                  <option value="card">{t('bpm:ocr.options.card')}</option>
                                  <option value="punched-tape">{t('bpm:ocr.options.punched-tape')}</option>
                                  <option value="summing-junction">{t('bpm:ocr.options.summing-junction')}</option>
                                  <option value="or">{t('bpm:ocr.options.or')}</option>
                                  <option value="collate">{t('bpm:ocr.options.collate')}</option>
                                  <option value="sort">{t('bpm:ocr.options.sort')}</option>
                                  <option value="extract">{t('bpm:ocr.options.extract')}</option>
                                  <option value="merge">{t('bpm:ocr.options.merge')}</option>
                                  <option value="stored-data">{t('bpm:ocr.options.stored-data')}</option>
                                  <option value="delay">{t('bpm:ocr.options.delay')}</option>
                                  <option value="sequential-access">{t('bpm:ocr.options.sequential-access')}</option>
                                  <option value="direct-access">{t('bpm:ocr.options.direct-access')}</option>
                                  <option value="display">{t('bpm:ocr.options.display')}</option>
                                  <option value="loop-limit">{t('bpm:ocr.options.loop-limit')}</option>
                                  <option value="annotation">{t('bpm:ocr.options.annotation')}</option>
                                </select>
                              </div>
                              <Input 
                                value={node.label} 
                                onChange={(e) => {
                                  const updated = [...parsedDiagram.nodes];
                                  updated[index].label = e.target.value;
                                  setParsedDiagram({ ...parsedDiagram, nodes: updated });
                                }}
                                className="h-8 text-xs font-semibold focus-visible:ring-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50/50 hover:bg-slate-50/80 transition-all gap-4 min-h-[300px] relative mt-4">
              {isProcessingOcr ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-700">{t('bpm:ocr.analyzing')}</p>
                  <p className="text-xs text-slate-400">{t('bpm:ocr.aiMapping')}</p>
                </div>
              ) : ocrPreviewUrl ? (
                <div className="flex flex-col items-center w-full gap-4">
                  <div className="border border-slate-200 rounded-xl p-2 max-w-md bg-white shadow-sm overflow-hidden flex justify-center items-center h-48 w-full">
                    <img src={ocrPreviewUrl} className="max-h-full max-w-full object-contain rounded" alt="Preview" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setOcrFile(null); setOcrPreviewUrl(null); }} className="rounded-xl">{t('bpm:ocr.buttons.retry')}</Button>
                    <Button onClick={handleStartOcr} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold text-xs uppercase tracking-wider">
                      <RefreshCw className="h-4 w-4" /> {t('bpm:ocr.buttons.process')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                    <Upload className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">{t('bpm:ocr.uploadTitle')}</h3>
                    <p className="text-xs text-slate-400 max-w-sm">{t('bpm:ocr.uploadDesc')}</p>
                  </div>
                  <label className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all uppercase tracking-wider shadow-sm">
                    {t('bpm:ocr.buttons.chooseFile')}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleOcrFileChange} />
                  </label>
                </>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setIsOcrDialogOpen(false)} disabled={isProcessingOcr} className="rounded-xl">
              {t('bpm:ocr.buttons.cancel')}
            </Button>
            {parsedDiagram && (
              <Button onClick={handleApplyOcr} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider">
                {t('bpm:ocr.buttons.saveApply')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
