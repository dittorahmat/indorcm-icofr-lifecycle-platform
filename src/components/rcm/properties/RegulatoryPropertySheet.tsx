import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Node } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, ShieldAlert, ShieldCheck, Database, Trash2, PlusCircle, AlertTriangle, RefreshCw, History, Layout, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

import { EntityHistoryList } from './EntityHistoryList';
import { NodeVisualProperties } from './NodeVisualProperties';
import { RiskGroupCard } from './RiskGroupCard';
import { BPM_NON_SYNC_NODE_TYPES } from '@shared/control-linkage';
import type { AiSuggestionContext } from './AiSuggestionPopover';
import { useRegulatoryPairs } from './useRegulatoryPairs';
import type { PairSequenceData } from './useRegulatoryPairs';

interface RegulatoryPropertySheetProps {
  selectedNode: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNodeData: (id: string, data: Record<string, unknown>) => void;
  onDeleteNode: (id: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  isLocked?: boolean;
  bpmProcessId?: string;
  nodes?: Node[];
  suggestionBase?: Omit<AiSuggestionContext, 'nodeLabel' | 'riskDescription'>;
}

export function RegulatoryPropertySheet({
  selectedNode,
  isOpen,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
  onSave,
  isSaving = false,
  isDirty = false,
  isLocked = false,
  bpmProcessId,
  nodes = [],
  suggestionBase,
}: RegulatoryPropertySheetProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common', 'risklibrary']);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'risk' | 'control', id?: string, index?: number } | null>(null);

  const canHaveRcm = useMemo(() => {
    if (!selectedNode) return false;
    return !BPM_NON_SYNC_NODE_TYPES.includes(selectedNode.type);
  }, [selectedNode]);

  const { data: sequenceData } = useQuery({
    queryKey: ['bpm-next-sequences', bpmProcessId],
    queryFn: () => api<PairSequenceData>(`/api/bpm-processes/${bpmProcessId}/next-sequences`),
    enabled: !!bpmProcessId
  });

  const linkage = useRegulatoryPairs({
    nodeId: selectedNode?.id ?? '',
    nodeData: selectedNode?.data,
    nodes,
    sequenceData,
    onUpdateNodeData,
  });
  const {
    pairs,
    groupedRisks,
    duplicateRiskIds,
    duplicateControlIds,
    updateAllPairsForRisk,
    updateSpecificControl,
    applyRiskDescription,
    addNewRisk,
    addControlToRisk,
    removePairAt,
    removeRisk,
  } = linkage;

  const handleClose = () => {
    if (isDirty) {
       setIsConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  };

  if (!selectedNode) return null;

  const riskSuggestBase = linkage.suggestBaseFor(suggestionBase, selectedNode?.data?.label || '');

  const executeRemoveRisk = (riskKey: string) => {
    removeRisk(riskKey);
    setDeleteConfirm(null);
  };

  const executeRemoveControl = (index: number) => {
    removePairAt(index);
    setDeleteConfirm(null);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[1000px] h-[90dvh] sm:h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2 min-w-0 max-w-full">
            <div className="flex flex-col gap-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {canHaveRcm ? <ShieldAlert className="h-5 w-5 text-indigo-600" /> : <Database className="h-5 w-5" />}
                {selectedNode.data.label}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs flex gap-2">
                <span className="bg-slate-200 px-1 rounded">ID: {selectedNode.id}</span>
                <span className="bg-slate-200 px-1 rounded uppercase">Type: {selectedNode.type}</span>
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="properties" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 border-b bg-white max-w-full overflow-x-auto touch-pan-x overscroll-x-contain no-scrollbar">
            <TabsList className="bg-transparent h-auto min-h-12 gap-4 sm:gap-6 flex w-max min-w-full">
              <TabsTrigger value="properties" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2">
                <Layout className="h-4 w-4" /> {t('rcm:matrix.properties.tabs.properties')}
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2">
                <History className="h-4 w-4" /> {t('rcm:matrix.properties.tabs.changelog')}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="properties" className="m-0 p-4 sm:p-6 space-y-6 sm:space-y-10 pb-20 focus-visible:outline-none">
              {isLocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-xs items-start">
                  <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-wider text-xs">{t('bpm:editor.actions.locked', { defaultValue: 'READ-ONLY MODE' })}</p>
                    <p className="text-slate-600">{t('bpm:editor.lockedWarning', { defaultValue: 'Diagram ini terkunci karena status alur kerja (workflow) atau periode telah dikunci. Perubahan tidak dapat disimpan.' })}</p>
                  </div>
                </div>
              )}

              <NodeVisualProperties
                selectedNode={selectedNode}
                isLocked={isLocked}
                canHaveRcm={canHaveRcm}
                onUpdateNodeData={onUpdateNodeData}
              />

              {canHaveRcm && (
                <div className="space-y-16">
                  {groupedRisks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-4">{t('bpm:noSubProcesses')}</p>
                      <Button disabled={isLocked} onClick={addNewRisk} className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="h-4 w-4 mr-2" /> {t('rcm:matrix.properties.tambah_risiko_baru')}
                      </Button>
                    </div>
                  )}

                  {groupedRisks.map((group, gIdx) => (
                    <RiskGroupCard
                      key={group.risk._tempRiskId || group.risk.riskId || `g-${gIdx}`}
                      group={group}
                      gIdx={gIdx}
                      isLocked={isLocked}
                      isDuplicateRiskId={duplicateRiskIds.has(group.risk.riskId?.trim() ?? '')}
                      duplicateControlIds={duplicateControlIds}
                      pairs={pairs}
                      riskSuggestBase={riskSuggestBase}
                      selectedNodeId={selectedNode.id}
                      nodeLabel={selectedNode.data?.label || ''}
                      onUpdateRiskField={updateAllPairsForRisk}
                      onApplyRiskDescription={applyRiskDescription}
                      onAddControl={addControlToRisk}
                      onUpdateSpecificControl={updateSpecificControl}
                      onDeleteControl={(idx) => setDeleteConfirm({ type: 'control', index: idx })}
                      onRequestDeleteRisk={(id) => setDeleteConfirm({ type: 'risk', id })}
                      onUpdateNodeData={onUpdateNodeData}
                    />
                  ))}

                  <Button disabled={isLocked} variant="outline" className="w-full h-14 border-dashed border-2 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 gap-2 font-black uppercase tracking-widest text-xs" onClick={addNewRisk}>
                    <PlusCircle className="h-5 w-5" /> {t('rcm:matrix.properties.tambah_risiko_baru')}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0 p-6 focus-visible:outline-none">
               <div className="space-y-4">
                  <div className="flex flex-col gap-1 mb-6">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <History className="h-3 w-3" /> {t('rcm:matrix.properties.audit_trail')}
                    </h4>
                    <p className="text-xs text-slate-500">{t('rcm:matrix.properties.audit_trail_desc')}</p>
                  </div>

                  {Array.from(new Set(pairs.map((p) => (typeof p.controlId === 'string' ? p.controlId : '')))).map((cId) => (
                    <div key={cId} className="space-y-3">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span className="text-xs font-bold text-slate-500 font-mono">{t('rcm:matrix.properties.history.entity', { id: cId })}</span>
                       </div>
                       <EntityHistoryList entityId={cId} />
                    </div>
                  ))}
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t bg-slate-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between flex-wrap gap-2">
           <Button 
             disabled={isLocked}
             variant="outline" 
             className="text-red-600 border-red-200 hover:bg-red-50 font-medium text-sm"
             onClick={() => onDeleteNode(selectedNode.id)}
           >
             <Trash2 className="h-4 w-4 mr-2" /> {t('rcm:matrix.properties.remove_node')}
           </Button>

           <div className="flex items-center gap-3">
             <span className={cn("text-xs font-medium flex items-center gap-1.5", isDirty ? "text-amber-600" : "text-emerald-600")}>
               <div className={cn("h-2 w-2 rounded-full", isDirty ? "bg-amber-400" : "bg-emerald-500")} />
               {isDirty ? t('rcm:matrix.properties.pending_sync') : t('rcm:matrix.properties.synced')}
             </span>
             <Button 
               onClick={onSave} 
               disabled={isSaving || !isDirty}
               className={cn(
                 "text-white font-medium text-sm h-10 px-6 gap-2 shadow-sm transition-all",
                 isDirty ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"
               )}
             >
               {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
               {t('rcm:matrix.properties.save_changes')}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            {deleteConfirm?.type === 'risk' ? t('rcm:matrix.properties.warnings.delete_risk_confirm') : t('rcm:matrix.properties.warnings.delete_control_confirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirm?.type === 'risk'
              ? t('rcm:matrix.properties.warnings.delete_risk_desc')
              : t('rcm:matrix.properties.warnings.delete_control_desc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setDeleteConfirm(null)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center"> {t('common:actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              if (!deleteConfirm) return;
              if (deleteConfirm.type === 'risk' && deleteConfirm.id !== undefined) executeRemoveRisk(deleteConfirm.id);
              else if (deleteConfirm.type === 'control' && deleteConfirm.index !== undefined) executeRemoveControl(deleteConfirm.index);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center"
          >
            {t('common:actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isConfirmDiscardOpen} onOpenChange={setIsConfirmDiscardOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common:unsavedChanges.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common:unsavedChanges.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setIsConfirmDiscardOpen(false)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center">
            {t('common:unsavedChanges.stay')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setIsConfirmDiscardOpen(false);
              onClose();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center"
          >
            {t('common:unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
