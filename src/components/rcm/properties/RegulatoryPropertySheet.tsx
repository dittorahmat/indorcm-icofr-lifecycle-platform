import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Node } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, ShieldAlert, ShieldCheck, Database, Trash2, PlusCircle, AlertTriangle, RefreshCw, History, Layout, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <div key={log.id} className="border rounded-xl p-3 bg-white shadow-sm text-[10px] space-y-2 border-slate-100">
           <div className="flex justify-between items-center">
              <span className="font-black text-indigo-600 uppercase tracking-tight">{log.userId.split('@')[0]}</span>
              <span className="text-slate-400 font-medium">{format(log.timestamp, 'dd MMM yyyy HH:mm')}</span>
           </div>
           <div className="text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
             <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[8px] h-4 bg-white uppercase">{log.entityType}</Badge>
                <span className="text-slate-400">Changed mapping/metadata:</span>
             </div>
             <p className="font-medium text-slate-800 italic">"{log.descriptionAfter}"</p>
             {log.descriptionBefore && (
               <p className="text-[9px] text-slate-400 mt-1 line-through decoration-red-200">Before: {log.descriptionBefore}</p>
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
      if (window.confirm(t('rcm:matrix.properties.warnings.unsaved_changes'))) {
        onClose();
      }
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
      
      // SMART ID ASSIGNMENT: If this was a pending risk and user entered description
      if (!updated.riskId && field === 'riskDescription' && value.trim().length > 0) {
        updated.riskId = `R-${Date.now()}`;
        // delete updated._tempRiskId; // Keep it for grouping continuity until re-render
      }
      
      return updated;
    });
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const updateSpecificControl = (pairIndex: number, field: string, value: any) => {
    const nextPairs = [...pairs];
    const updated = { ...nextPairs[pairIndex], [field]: value };

    // SMART ID ASSIGNMENT for Control
    if (!updated.controlId && field === 'controlDescription' && value.trim().length > 0) {
        updated.controlId = `C-${Date.now()}`;
    }

    nextPairs[pairIndex] = updated;
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const addNewRisk = () => {
    const tempId = `temp_${Date.now()}`;
    const nextPairs = [...pairs, {
      _tempRiskId: tempId,
      _tempControlId: `c_${tempId}`,
      riskId: null,
      controlId: null,
      riskDescription: '',
      controlDescription: '',
      isFraudRelated: false,
      riskRating: 'Low',
      isKeyControl: false,
      classification: 'TLC'
    }];
    onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
  };

  const addControlToRisk = (riskKey: string) => {
    const template = pairs.find((p: any) => (p.riskId === riskKey || p._tempRiskId === riskKey));
    const nextPairs = [...pairs, {
      ...template,
      controlId: null,
      _tempControlId: `c_${Date.now()}`,
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

  const removeRisk = (riskKey: string) => {
    if (window.confirm(t('rcm:matrix.properties.warnings.delete_risk_confirm'))) {
      const nextPairs = pairs.filter((p: any) => (p.riskId !== riskKey && p._tempRiskId !== riskKey));
      onUpdateNodeData(selectedNode.id, { regulatoryPairs: nextPairs });
    }
  };

  const removeSpecificPair = (index: number) => {
    if (window.confirm(t('rcm:matrix.properties.warnings.delete_control_confirm'))) {
      removePair(index);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[850px] overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <SheetTitle className="flex items-center gap-2 text-xl">
                {canHaveRcm ? <ShieldAlert className="h-5 w-5 text-indigo-600" /> : <Database className="h-5 w-5" />}
                {selectedNode.data.label}
              </SheetTitle>
              <SheetDescription className="font-mono text-[10px] flex gap-2">
                <span className="bg-slate-200 px-1 rounded">ID: {selectedNode.id}</span>
                <span className="bg-slate-200 px-1 rounded uppercase">Type: {selectedNode.type}</span>
              </SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

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
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Visual Diagram Info</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-500 uppercase">Label</Label>
                      <Input value={selectedNode.data.label} onChange={(e) => onUpdateNodeData(selectedNode.id, { label: e.target.value })} className="h-8 text-xs bg-white" />
                    </div>
                    {canHaveRcm && (
                      <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Pelaksana (Role)</Label>
                        <Input value={selectedNode.data.role || ''} onChange={(e) => onUpdateNodeData(selectedNode.id, { role: e.target.value })} className="h-8 text-xs bg-white" />
                      </div>
                    )}
                </div>
              </section>

              {canHaveRcm && (
                <div className="space-y-16">
                  {groupedRisks.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 italic mb-4">Belum ada identifikasi Risiko & Kontrol.</p>
                      <Button onClick={addNewRisk} className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="h-4 w-4 mr-2" /> Mulai Identifikasi
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
                            <h3 className="text-xs font-black uppercase tracking-widest">Risiko #{gIdx + 1}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-800 text-[9px] font-mono border-none">{group.risk.riskId || 'PENDING ID'}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-200 hover:text-white hover:bg-red-700" onClick={() => removeRisk(group.risk.riskId || group.risk._tempRiskId)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-red-900/50">Deskripsi Risiko Aktivitas</Label>
                            <Textarea 
                              value={group.risk.riskDescription || ''} 
                              onChange={(e) => updateAllPairsForRisk(group.risk.riskId || group.risk._tempRiskId, 'riskDescription', e.target.value)}
                              className="min-h-[80px] text-sm border-red-200 bg-white focus-visible:ring-red-500"
                              placeholder="Apa yang bisa salah?"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-red-900/50">Terkait Fraud?</Label>
                              <Select value={group.risk.isFraudRelated ? 'Yes' : 'No'} onValueChange={(v) => updateAllPairsForRisk(group.risk.riskId || group.risk._tempRiskId, 'isFraudRelated', v === 'Yes')}>
                                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">{t('common:yes')}</SelectItem>
                                  <SelectItem value="No">{t('common:no')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-red-900/50">Risk Rating</Label>
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
                          
                          <div className="pt-2 flex justify-end">
                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-red-200 text-red-700 hover:bg-red-50 gap-1.5" onClick={() => addControlToRisk(group.risk.riskId || group.risk._tempRiskId)}>
                              <PlusCircle className="h-3 w-3" /> Tambah Kontrol untuk Risiko Ini
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* CONTROLS LIST (Nested) */}
                      <div className="ml-8 space-y-6 relative border-l-2 border-dashed border-slate-200 pl-8">
                        {group.controls.map((ctrl, cIdx) => (
                          <div key={ctrl.data.controlId || ctrl.data._tempControlId} className="bg-white border rounded-xl shadow-sm overflow-hidden group/ctrl relative">
                              {/* Connector Line */}
                              <div className="absolute -left-8 top-1/2 w-8 h-px bg-dashed border-t-2 border-dashed border-slate-200" />
                              
                              <div className="bg-slate-50 px-4 py-1.5 flex justify-between items-center border-b">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">Kontrol #{cIdx + 1}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono text-[9px] h-5 border-slate-200 text-slate-400">{ctrl.data.controlId || 'PENDING'}</Badge>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-rose-600" onClick={() => removeSpecificPair(ctrl.index)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                </div>
                              </div>

                              <div className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-bold uppercase text-slate-400">Deskripsi Prosedur Kontrol</Label>
                                  <Textarea 
                                    value={ctrl.data.controlDescription || ''} 
                                    onChange={(e) => updateSpecificControl(ctrl.index, 'controlDescription', e.target.value)}
                                    className="min-h-[60px] text-xs bg-slate-50/30"
                                    placeholder="Apa tindakan mitigasinya?"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400">Key Control?</Label>
                                    <Select value={ctrl.data.isKeyControl ? 'Yes' : 'No'} onValueChange={(v) => updateSpecificControl(ctrl.index, 'isKeyControl', v === 'Yes')}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Yes">Yes</SelectItem>
                                          <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] font-bold uppercase text-slate-400">Klasifikasi</Label>
                                    <Select value={ctrl.data.classification || 'TLC'} onValueChange={(v: ControlLevel) => updateSpecificControl(ctrl.index, 'classification', v)}>
                                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="TLC">TLC</SelectItem>
                                          <SelectItem value="ELC">ELC</SelectItem>
                                          <SelectItem value="ITGC">ITGC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Dynamic Compliance Form */}
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
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full h-14 border-dashed border-2 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 gap-2 font-black uppercase tracking-widest text-xs" onClick={addNewRisk}>
                    <PlusCircle className="h-5 w-5" /> Identifikasi Risiko Baru
                  </Button>
                </div>
              )}

              <div className="pt-12 border-t">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full gap-2 text-[10px] h-10 font-black uppercase tracking-widest shadow-lg shadow-red-100" 
                  onClick={() => onDeleteNode(selectedNode.id)}
                >
                  <Trash2 className="h-4 w-4" /> Remove Node {canHaveRcm ? '& ALL Linked Data' : ''}
                </Button>
                <p className="text-[9px] text-center text-slate-400 mt-4 italic">
                  {selectedNode.type === 'swimlane' 
                    ? "Menghapus Swimlane tidak akan menghapus node di dalamnya, namun akan melepas pengelompokannya."
                    : "Tindakan ini akan menghapus node dari diagram dan seluruh relasi RCM-nya di database (jika ada)."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 p-6 focus-visible:outline-none">
               <div className="space-y-4">
                  <div className="flex flex-col gap-1 mb-6">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <History className="h-3 w-3" /> Audit Trail (Lampiran 6)
                    </h4>
                    <p className="text-[10px] text-slate-500 italic">Riwayat perubahan regulasi untuk seluruh risiko/kontrol pada node ini.</p>
                  </div>
                  
                  {/* Show history for each control in pairs */}
                  {Array.from(new Set(pairs.map((p: any) => p.controlId))).map((cId: any) => (
                    <div key={cId} className="space-y-3">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-500 font-mono">Entity: {cId}</span>
                       </div>
                       <EntityHistoryList entityId={cId} />
                    </div>
                  ))}
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* STICKY FOOTER */}
        <div className="p-4 border-t bg-slate-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
           <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Status</span>
                  <span className={cn("text-[11px] font-bold flex items-center gap-1.5 mt-1", isDirty ? "text-amber-600" : "text-emerald-600")}>
                    <div className={cn("h-2 w-2 rounded-full", isDirty ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
                    {isDirty ? 'Pending Sync' : 'Synced to Matrix'}
                  </span>
              </div>
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-2 rounded-lg max-w-[400px]">
                 <AlertCircle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                 <p className="text-[9px] text-rose-700 leading-tight italic">
                    {t('rcm:matrix.properties.warnings.hard_delete_notice')}
                 </p>
              </div>
           </div>
           
           <Button 
             onClick={onSave} 
             disabled={isSaving || !isDirty}
             className={cn(
               "w-full text-white font-black uppercase tracking-widest text-[10px] h-10 gap-2 shadow-lg transition-all",
               isDirty ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" : "bg-slate-300 shadow-none cursor-not-allowed"
             )}
           >
             {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
             {isSaving ? 'Saving...' : (isDirty ? 'Save & Sync to Matrix' : 'Changes Synced')}
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
