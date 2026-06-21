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
import { X, ShieldAlert, ShieldCheck, Database, Trash2, PlusCircle, AlertTriangle, RefreshCw, History, Layout, AlertCircle, Lock, Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import type { QualitativeLevel, ControlLevel, ChangeLog } from '@shared/types';

import { TLCForm } from './TLCForm';
import { ELCForm } from './ELCForm';
import { ITGCForm } from './ITGCForm';

interface RegulatoryPropertySheetProps {
  selectedNode: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNodeData: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

function EntityHistoryList({ entityId }: { entityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['changelogs', entityId],
    queryFn: () => api<{ items: ChangeLog[] }>(`/api/changelogs?entityId=${entityId}`),
    enabled: !!entityId
  });

  if (isLoading) return <div className="p-8 text-center"><RefreshCw className="h-4 w-4 animate-spin mx-auto text-slate-300" /></div>;
  if (!data?.items?.length) return <div className="p-12 text-center text-slate-400 italic text-xs border-2 border-dashed rounded-xl">Belum ada riwayat perubahan regulasi untuk entitas ini.</div>;

  return (
    <div className="space-y-3 p-1">
      {data.items.map((log) => (
        <div key={log.id} className="border rounded-xl p-3 bg-white shadow-sm text-xs space-y-2 border-slate-100">
           <div className="flex justify-between items-center">
              <span className="font-black text-indigo-600 uppercase tracking-tight">{log.userId.split('@')[0]}</span>
              <span className="text-slate-400 font-medium">{format(log.timestamp, 'dd MMM yyyy HH:mm')}</span>
           </div>
           <div className="text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
             <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs h-4 bg-white uppercase">{log.entityType}</Badge>
                <span className="text-slate-400">Changed mapping/metadata:</span>
             </div>
             <p className="font-medium text-slate-800 italic">"{log.descriptionAfter}"</p>
             {log.descriptionBefore && (
               <p className="text-xs text-slate-400 mt-1 line-through decoration-red-200">Before: {log.descriptionBefore}</p>
             )}
           </div>
        </div>
      ))}
    </div>
  );
}

export function RegulatoryPropertySheet({
  selectedNode,
  isOpen,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
  onSave,
  isSaving = false,
  isDirty = false
}: RegulatoryPropertySheetProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common', 'risklibrary']);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ type: 'risk' | 'control', id?: string, index?: number } | null>(null);

  const canHaveRcm = useMemo(() => {
    if (!selectedNode) return false;
    const skipTypes = ['start', 'end', 'reference', 'swimlane'];
    return !skipTypes.includes(selectedNode.type);
  }, [selectedNode]);

  // SUPPORT MULTIPLE PAIRS: Convert single legacy object or hydrated array
  const pairs = useMemo(() => {
    return selectedNode?.data?.regulatoryPairs || 
           (selectedNode?.data?.regulatoryData ? [selectedNode?.data?.regulatoryData] : []);
  }, [selectedNode?.data?.regulatoryPairs, selectedNode?.data?.regulatoryData]);

  // --- Grouping Logic ---
  const groupedRisks = useMemo(() => {
    if (!selectedNode) return [];
    const groups: Record<string, { risk: any, controls: { data: any, index: number }[] }> = {};
    
    pairs.forEach((p: any, index: number) => {
      // Use temporary internal ID for grouping if riskId is not yet assigned
      const rId = p.riskId || p._tempRiskId || 'R-PENDING';
      if (!groups[rId]) {
        groups[rId] = { risk: p, controls: [] };
      }
      groups[rId].controls.push({ data: p, index });
    });
    
    return Object.values(groups);
  }, [pairs, selectedNode]);

  const handleClose = () => {
    if (isDirty) {
       setIsConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  };

  if (!selectedNode) return null;

  // --- Update Handlers ---
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

  const addNewRisk = () => {
    const tempId = `R-${crypto.randomUUID().substring(0, 8)}`;
    const ctrlId = `C-${crypto.randomUUID().substring(0, 8)}`;
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
      ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N'
    }];
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const addControlToRisk = (riskKey: string) => {
    const template = pairs.find((p: any) => (p.riskId === riskKey || p._tempRiskId === riskKey));
    const ctrlId = `C-${crypto.randomUUID().substring(0, 8)}`;
    const nextPairs = [...pairs, {
      ...template,
      controlId: ctrlId,
      _tempControlId: ctrlId,
      controlDescription: '',
      isKeyControl: false,
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
          <div className="flex items-center justify-between">
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
          <div className="px-6 border-b bg-white">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger value="properties" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2">
                <Layout className="h-4 w-4" /> Properties
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2">
                <History className="h-4 w-4" /> Change Log (Lampiran 6)
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="properties" className="m-0 p-6 space-y-10 pb-20 focus-visible:outline-none">
              {/* 1. Visual Info */}
              <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <Label className="text-xs font-semibold uppercase text-slate-600 tracking-wide mb-3 block">{t('rcm:matrix.properties.visual_diagram_info')}</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700 uppercase">{t('rcm:matrix.properties.label')}</Label>
                      <Input value={selectedNode.data.label} onChange={(e) => onUpdateNodeData(selectedNode.id, { label: e.target.value })} className="h-10 text-sm bg-white" />
                    </div>
                    {canHaveRcm && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700 uppercase">{t('rcm:matrix.properties.pelaksana')}</Label>
                        <Input value={selectedNode.data.role || ''} onChange={(e) => onUpdateNodeData(selectedNode.id, { role: e.target.value })} className="h-10 text-sm bg-white" />
                      </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <Label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                      {selectedNode.data.isLocked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      {t('bpm:editor.lockPosition')}
                    </Label>
                    <span className="text-[10px] text-slate-400">
                      {selectedNode.data.isLocked 
                        ? t('bpm:editor.positionLocked') 
                        : t('bpm:editor.lockPositionDesc')}
                    </span>
                  </div>
                  <Switch 
                    checked={!!selectedNode.data.isLocked} 
                    onCheckedChange={(checked) => onUpdateNodeData(selectedNode.id, { isLocked: checked })} 
                  />
                </div>
              </section>

              {canHaveRcm && (
                <div className="space-y-16">
                  {groupedRisks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 italic mb-4">{t('bpm:noSubProcesses')}</p>
                      <Button onClick={addNewRisk} className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="h-4 w-4 mr-2" /> {t('rcm:matrix.properties.tambah_risiko_baru')}
                      </Button>
                    </div>
                  )}

                  {groupedRisks.map((group, gIdx) => (
                    <div key={group.risk.riskId || group.risk._tempRiskId} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      {/* RISK HEADER CARD */}
                      <div className="bg-red-50/30 border-2 border-red-100 rounded-2xl overflow-hidden shadow-sm shadow-red-50">
                        <div className="bg-red-600 px-4 py-2 flex justify-between items-center text-white">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest">{t('rcm:matrix.properties.id_risiko')} #{gIdx + 1}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-800 text-xs font-mono border-none">{group.risk.riskId || 'PENDING ID'}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-200 hover:text-white hover:bg-red-700" onClick={() => setDeleteConfirm({ type: 'risk', id: group.risk.riskId || group.risk._tempRiskId })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.deskripsi_risiko')}</Label>
                            <Textarea 
                              value={group.risk.riskDescription || ''} 
                              onChange={(e) => updateAllPairsForRisk(group.risk.riskId || group.risk._tempRiskId, 'riskDescription', e.target.value)}
                              className="min-h-[80px] text-sm border-red-200 bg-white focus-visible:ring-red-500"
                              placeholder={t('common:placeholders.description')}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.terkait_fraud')}</Label>
                              <Select value={group.risk.isFraudRelated ? 'Yes' : 'No'} onValueChange={(v) => updateAllPairsForRisk(group.risk.riskId || group.risk._tempRiskId, 'isFraudRelated', v === 'Yes')}>
                                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">{t('common:yes')}</SelectItem>
                                  <SelectItem value="No">{t('common:no')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.risk_rating_label')}</Label>
                              <Select value={group.risk.riskRating || 'Low'} onValueChange={(v: QualitativeLevel) => updateAllPairsForRisk(group.risk.riskId || group.risk._tempRiskId, 'riskRating', v)}>
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
                              variant="outline" 
                              className="w-full h-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs gap-2" 
                              onClick={() => addControlToRisk(group.risk.riskId || group.risk._tempRiskId)}
                            >
                              <PlusCircle className="h-4 w-4" /> {t('rcm:matrix.properties.add_control')}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* CONTROLS LIST (Nested) */}
                      <Accordion type="single" collapsible className="ml-8 space-y-4">
                        {group.controls.map((ctrl, cIdx) => (
                          <AccordionItem key={ctrl.data.controlId || ctrl.data._tempControlId} value={ctrl.data.controlId || ctrl.data._tempControlId} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Select value={ctrl.data.classification || 'TLC'} onValueChange={(v: ControlLevel) => updateSpecificControl(ctrl.index, 'classification', v)}>
                                          <SelectTrigger className="h-7 w-[80px] text-xs font-bold uppercase shadow-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="TLC" className="text-xs">TLC</SelectItem>
                                            <SelectItem value="ELC" className="text-xs">ELC</SelectItem>
                                            <SelectItem value="ITGC" className="text-xs">ITGC</SelectItem>
                                          </SelectContent>
                                      </Select>
                                      <span className="text-xs font-bold text-slate-700">Kontrol #{cIdx + 1}</span>
                                      <Badge variant="outline" className="text-xs font-mono border-slate-200 bg-slate-50 text-slate-500 uppercase">{ctrl.data.controlId || 'PENDING'}</Badge>
                                    </div>
                                </div>
                                <Button 
                                  variant="ghost" size="sm" 
                                  className="h-7 w-7 text-slate-400 hover:text-rose-600 p-0 mr-2" 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'control', index: ctrl.index }); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AccordionTrigger>
                              <AccordionContent className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-slate-600">Deskripsi Prosedur Kontrol</Label>
                                  <Textarea 
                                    value={ctrl.data.controlDescription || ''} 
                                    onChange={(e) => updateSpecificControl(ctrl.index, 'controlDescription', e.target.value)}
                                    className="min-h-[80px] text-sm"
                                    placeholder="Apa tindakan mitigasinya?"
                                  />
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-600">Key Control?</Label>
                                    <Select value={ctrl.data.isKeyControl ? 'Yes' : 'No'} onValueChange={(v) => updateSpecificControl(ctrl.index, 'isKeyControl', v === 'Yes')}>
                                        <SelectTrigger className="h-9 text-sm w-[100px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Yes">Yes</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    {(!ctrl.data.classification || ctrl.data.classification === 'TLC') && (
                                      <TLCForm data={ctrl.data} onChange={(f, v) => updateSpecificControl(ctrl.index, f, v)} />
                                    )}
                                    {ctrl.data.classification === 'ELC' && (
                                      <ELCForm data={ctrl.data} onChange={(f, v) => updateSpecificControl(ctrl.index, f, v)} />
                                    )}
                                    {ctrl.data.classification === 'ITGC' && (
                                      <ITGCForm data={ctrl.data} onChange={(f, v) => updateSpecificControl(ctrl.index, f, v)} />
                                    )}
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full h-14 border-dashed border-2 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 gap-2 font-black uppercase tracking-widest text-xs" onClick={addNewRisk}>
                    <PlusCircle className="h-5 w-5" /> {t('rcm:matrix.properties.tambah_risiko_baru')}
                  </Button>
                </div>
              )}

              {/* Removed Remove Node button from here as it's now in the sticky footer */}
            </TabsContent>

            <TabsContent value="history" className="m-0 p-6 focus-visible:outline-none">
               <div className="space-y-4">
                  <div className="flex flex-col gap-1 mb-6">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <History className="h-3 w-3" /> Audit Trail (Lampiran 6)
                    </h4>
                    <p className="text-xs text-slate-500 italic">Riwayat perubahan regulasi untuk seluruh risiko/kontrol pada node ini.</p>
                  </div>

                  {/* Show history for each control in pairs */}
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

        {/* STICKY FOOTER */}
        <div className="p-4 border-t bg-slate-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between">
           <Button 
             variant="outline" 
             className="text-red-600 border-red-200 hover:bg-red-50 font-medium text-sm"
             onClick={() => onDeleteNode(selectedNode.id)}
           >
             <Trash2 className="h-4 w-4 mr-2" /> {t('rcm:matrix.properties.remove_node')}
           </Button>

           <div className="flex items-center gap-3">
             <span className={cn("text-xs font-medium flex items-center gap-1.5", isDirty ? "text-amber-600" : "text-emerald-600")}>
               <div className={cn("h-2 w-2 rounded-full", isDirty ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
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
