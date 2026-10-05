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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { QualitativeLevel } from '@shared/types';

import { EntityHistoryList } from './EntityHistoryList';
import { NodeVisualProperties } from './NodeVisualProperties';
import { ControlAccordionItem } from './ControlAccordionItem';

interface RegulatoryPropertySheetProps {
  selectedNode: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNodeData: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  isLocked?: boolean;
  bpmProcessId?: string;
  nodes?: Node[];
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
  nodes = []
}: RegulatoryPropertySheetProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common', 'risklibrary']);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'risk' | 'control', id?: string, index?: number } | null>(null);

  const canHaveRcm = useMemo(() => {
    if (!selectedNode) return false;
    const skipTypes = ['start', 'end', 'reference', 'swimlane'];
    return !skipTypes.includes(selectedNode.type);
  }, [selectedNode]);

  const { data: sequenceData } = useQuery({
    queryKey: ['bpm-next-sequences', bpmProcessId],
    queryFn: () => api<{nextRiskSeq: number, nextControlSeq: number, bpmCode: string}>(`/api/bpm-processes/${bpmProcessId}/next-sequences`),
    enabled: !!bpmProcessId
  });

  const pairs = useMemo(() => {
    return selectedNode?.data?.regulatoryPairs || 
           (selectedNode?.data?.regulatoryData ? [selectedNode?.data?.regulatoryData] : []);
  }, [selectedNode?.data?.regulatoryPairs, selectedNode?.data?.regulatoryData]);

  const groupedRisks = useMemo(() => {
    if (!selectedNode) return [];
    const groups: Record<string, { risk: any, controls: { data: any, index: number }[] }> = {};
    
    pairs.forEach((p: any, index: number) => {
      const rId = p._tempRiskId || p.riskId || `R-GROUP-${index}`;
      if (!groups[rId]) {
        groups[rId] = { risk: p, controls: [] };
      }
      groups[rId].controls.push({ data: p, index });
    });
    
    return Object.values(groups);
  }, [pairs, selectedNode]);

  const duplicateRiskIds = useMemo(() => {
    const riskIds: string[] = pairs.map((p: any) => p.riskId?.trim()).filter(Boolean);
    return new Set<string>(riskIds.filter((id: string, idx: number) => riskIds.indexOf(id) !== idx));
  }, [pairs]);

  const duplicateControlIds = useMemo(() => {
    const ctrlIds: string[] = pairs.map((p: any) => p.controlId?.trim()).filter(Boolean);
    return new Set<string>(ctrlIds.filter((id: string, idx: number) => ctrlIds.indexOf(id) !== idx));
  }, [pairs]);

  const handleClose = () => {
    if (isDirty) {
       setIsConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  };

  if (!selectedNode) return null;

  const updateAllPairsForRisk = (riskKey: string, field: string, value: any) => {
    const nextPairs = pairs.map((p: any) => {
      const match = (p.riskId === riskKey) || (p._tempRiskId === riskKey);
      if (!match) return p;

      const updated = { ...p, [field]: value };
      return updated;
    });
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const updateSpecificControl = (pairIndex: number, field: string, value: any) => {
    const nextPairs = [...pairs];
    const updated = { ...nextPairs[pairIndex], [field]: value };
    nextPairs[pairIndex] = updated;
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const generateNewIds = (type: 'risk' | 'control', offset: number = 0) => {
    if (!sequenceData || !sequenceData.bpmCode) {
       return `${type === 'risk' ? 'R' : 'C'}-${crypto.randomUUID().substring(0, 8)}`;
    }
    const bpmCode = sequenceData.bpmCode;
    let maxVal = type === 'risk' ? sequenceData.nextRiskSeq - 1 : sequenceData.nextControlSeq - 1;

    nodes.forEach(node => {
        const nodePairs = node.data?.regulatoryPairs || (node.data?.regulatoryData ? [node.data.regulatoryData] : []);
        nodePairs.forEach((p: any) => {
           const id = type === 'risk' ? (p.riskId || p._tempRiskId) : (p.controlId || p._tempControlId);
           if (id && typeof id === 'string' && id.startsWith(`${type === 'risk' ? 'R' : 'C'}-${bpmCode}-`)) {
              const parts = id.split('-');
              const seq = parseInt(parts[2], 10);
              if (!isNaN(seq) && seq > maxVal) maxVal = seq;
           }
        });
    });

    return `${type === 'risk' ? 'R' : 'C'}-${bpmCode}-${(maxVal + 1 + offset).toString().padStart(4, '0')}`;
  };

  const addNewRisk = () => {
    const tempId = generateNewIds('risk');
    const ctrlId = generateNewIds('control');
    const nextPairs = [...pairs, {
      _tempRiskId: tempId,
      _tempControlId: ctrlId,
      riskId: tempId,
      controlId: ctrlId,
      riskDescription: '',
      controlDescription: '',
      isFraudRelated: false,
      riskRating: 'Low',
      isKeyControl: false,
      classification: 'TLC',
      controlType: 'Preventif',
      controlNature: 'Manual',
      frequency: 'Bulanan',
      ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N'
    }];
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const addControlToRisk = (riskKey: string) => {
    const template = pairs.find((p: any) => (p.riskId === riskKey || p._tempRiskId === riskKey));
    const ctrlId = generateNewIds('control');
    const nextPairs = [...pairs, {
      ...template,
      controlId: ctrlId,
      _tempControlId: ctrlId,
      controlDescription: '',
      isKeyControl: false,
      controlType: 'Preventif',
      controlNature: 'Manual',
      frequency: 'Bulanan',
      ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N',
      cosoPrinciples: [],
      itgcAssertions: {}
    }];
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const removePair = (index: number) => {
    const nextPairs = pairs.filter((_: any, i: number) => i !== index);
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const executeRemoveRisk = (riskKey: string) => {
    const nextPairs = pairs.filter((p: any) => (p.riskId !== riskKey && p._tempRiskId !== riskKey));
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
    setDeleteConfirm(null);
  };

  const executeRemoveControl = (index: number) => {
    removePair(index);
    setDeleteConfirm(null);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[1000px] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
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
                <Layout className="h-4 w-4" /> Properties
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2">
                <History className="h-4 w-4" /> Change Log (Lampiran 6)
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
                    <div key={group.risk._tempRiskId || group.risk.riskId || `g-${gIdx}`} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-red-50/30 border-2 border-red-100 rounded-lg overflow-hidden shadow-sm shadow-red-50">
                        <div className="bg-red-600 px-4 py-2 flex justify-between items-center text-white flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest">{t('rcm:matrix.properties.id_risiko')} #{gIdx + 1}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {duplicateRiskIds.has(group.risk.riskId?.trim()) && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-xs font-semibold uppercase">
                                  Duplikat ID!
                                </Badge>
                              )}
                              <Input 
                                disabled={isLocked}
                                className={cn(
                                  "h-7 w-40 bg-red-800 border-none text-xs font-mono text-white focus-visible:ring-red-400 placeholder:text-red-400",
                                  duplicateRiskIds.has(group.risk.riskId?.trim()) && "ring-2 ring-amber-300 bg-red-950 font-black"
                                )}
                                value={group.risk.riskId || ''} 
                                onChange={(e) => updateAllPairsForRisk(group.risk._tempRiskId || group.risk.riskId, 'riskId', e.target.value)}
                                placeholder="PENDING ID"
                              />
                            </div>
                            <Button disabled={isLocked} variant="ghost" size="icon" className="h-6 w-6 text-red-200 hover:text-white hover:bg-red-700" onClick={() => setDeleteConfirm({ type: 'risk', id: group.risk._tempRiskId || group.risk.riskId })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.deskripsi_risiko')}</Label>
                            <Textarea 
                              disabled={isLocked}
                              value={group.risk.riskDescription || ''} 
                              onChange={(e) => updateAllPairsForRisk(group.risk._tempRiskId || group.risk.riskId, 'riskDescription', e.target.value)}
                              className="min-h-[80px] text-sm border-red-200 bg-white focus-visible:ring-red-500"
                              placeholder={t('common:placeholders.description')}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.terkait_fraud')}</Label>
                              <Select disabled={isLocked} value={group.risk.isFraudRelated ? 'Yes' : 'No'} onValueChange={(v) => updateAllPairsForRisk(group.risk._tempRiskId || group.risk.riskId, 'isFraudRelated', v === 'Yes')}>
                                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">{t('common:yes')}</SelectItem>
                                  <SelectItem value="No">{t('common:no')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.risk_rating_label')}</Label>
                              <Select disabled={isLocked} value={group.risk.riskRating || 'Low'} onValueChange={(v: QualitativeLevel) => updateAllPairsForRisk(group.risk._tempRiskId || group.risk.riskId, 'riskRating', v)}>
                                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button 
                              disabled={isLocked}
                              variant="outline" 
                              className="w-full h-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs gap-2" 
                              onClick={() => addControlToRisk(group.risk._tempRiskId || group.risk.riskId)}
                            >
                              <PlusCircle className="h-4 w-4" /> {t('rcm:matrix.properties.add_control')}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="ml-8 space-y-4">
                        {group.controls.map((ctrl, cIdx) => (
                          <ControlAccordionItem
                            key={ctrl.data._tempControlId || `ctrl-${ctrl.index}`}
                            ctrl={ctrl}
                            cIdx={cIdx}
                            isLocked={isLocked}
                            duplicateControlIds={duplicateControlIds}
                            pairs={pairs}
                            onUpdateSpecificControl={updateSpecificControl}
                            onDeleteControl={(idx) => setDeleteConfirm({ type: 'control', index: idx })}
                            onUpdateNodeData={onUpdateNodeData}
                            selectedNodeId={selectedNode.id}
                          />
                        ))}
                      </Accordion>
                    </div>
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
                      <History className="h-3 w-3" /> Audit Trail (Lampiran 6)
                    </h4>
                    <p className="text-xs text-slate-500">Riwayat perubahan regulasi untuk seluruh risiko/kontrol pada node ini.</p>
                  </div>

                  {Array.from(new Set(pairs.map((p: any) => p.controlId))).map((cId: any) => (
                    <div key={cId} className="space-y-3">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span className="text-xs font-bold text-slate-500 font-mono">Entity: {cId}</span>
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
              ? "WARNING: Deleting this risk will delete ALL control data under it. This data will be PERMANENTLY removed from the RCM database when you press 'Save & Sync'." 
              : "Delete this Risk-Control mapping row? Data associated with this row will be lost from the TLC Matrix permanently after sync."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>{t('common:actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteConfirm?.type === 'risk' ? executeRemoveRisk(deleteConfirm.id!) : executeRemoveControl(deleteConfirm!.index!)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmDiscardOpen(false)}>
            {t('common:unsavedChanges.stay')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setIsConfirmDiscardOpen(false);
              onClose();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {t('common:unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
