import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, Network, History, Printer, XCircle, 
  Database, ListChecks, ShieldCheck, FileText, Workflow as WorkflowIcon,
  LayoutDashboard, Activity
} from 'lucide-react';
import { BPMWorksheet } from './BPMWorksheet';
import { Lampiran6LogView } from './Lampiran6LogView';
import { CSATabContent } from './CSATabContent';
import { TransactionSamplingTab } from './TransactionSamplingTab';
import { RCMELCPage } from '@/pages/rcm/RCMELCPage';
import { RCMTLCPage } from '@/pages/rcm/RCMTLCPage';
import { RCMITGCPage } from '@/pages/rcm/RCMITGCPage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control, User, TransactionDetail } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';

interface BPMModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noGL: string;
  glDesc: string;
  fsliName: string;
  bpmProcessId?: string;
  subProcessName?: string;
  year: string;
  scheduleId?: string; // New: link to task schedule
}

export function BPMModal({ 
  isOpen, 
  onOpenChange, 
  noGL, 
  glDesc, 
  fsliName,
  bpmProcessId,
  subProcessName,
  year,
  scheduleId
}: BPMModalProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const [activeTab, setActiveTab] = React.useState(scheduleId ? "csa" : "worksheet");
  const [selectedSamples, setSelectedSamples] = React.useState<TransactionDetail[]>([]);

  // Auto-switch to CSA tab if opening from a schedule
  React.useEffect(() => {
    if (isOpen && scheduleId) {
      setActiveTab("csa");
    }
  }, [isOpen, scheduleId]);

  // Safety guard for modal closing
  const blocker = useUnsavedChanges(isOpen && selectedSamples.length > 0 && activeTab === 'sampling');

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const { data: controls } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>('/api/controls');
      return all.items.filter(c => {
        const cSub = (c.subProcess || "").toLowerCase().trim();
        const targetSub = (subProcessName || "").toLowerCase().trim();

        // Match 1: Hard ID link (Primary)
        if (bpmProcessId && c.bpmProcessId === bpmProcessId) return true;
        
        // Match 2: Name link (Reliable Fallback)
        if (targetSub && cSub === targetSub) return true;
        
        // Match 3: Orphan link (Fallback for data missing process metadata but linked to GL)
        if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
        
        return false;
      });
    },
    enabled: isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1600px] h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 border-b bg-indigo-900 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <span className="text-yellow-400">Execution Hub:</span>
                  {subProcessName || glDesc}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5 opacity-80">
                  <Badge className="bg-white/20 text-white border-none font-mono text-[10px]">
                    BPM-REF: {noGL}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold tracking-widest">{fsliName}</span>
                  {subProcessName && glDesc && (
                    <>
                      <div className="h-3 w-[1px] bg-white/30 mx-1" />
                      <span className="text-[10px] uppercase font-medium text-indigo-200 tracking-tight italic">
                        Account: {glDesc}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Export Appendix 11
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10">
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b bg-white shrink-0 shadow-sm z-10">
              <TabsList className="h-14 bg-transparent gap-8 p-0">
                <TabsTrigger value="worksheet" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-[11px] uppercase text-slate-500 tracking-wider">
                  <FileSpreadsheet className="h-4 w-4" /> Worksheet
                </TabsTrigger>
                <TabsTrigger value="sampling" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-[11px] uppercase text-slate-500 tracking-wider">
                  <Database className="h-4 w-4" /> Detail Transaksi
                </TabsTrigger>
                <TabsTrigger value="csa" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-[11px] uppercase text-slate-500 tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> CSA Assessment
                </TabsTrigger>
                <TabsTrigger value="rcm" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-[11px] uppercase text-slate-500 tracking-wider">
                  <ListChecks className="h-4 w-4" /> RCM Matrix (5a,b,c)
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-[11px] uppercase text-slate-500 tracking-wider">
                  <History className="h-4 w-4" /> Log Perubahan
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="worksheet" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <BPMWorksheet 
                  noGL={noGL} 
                  fsliName={fsliName} 
                  bpmProcessId={bpmProcessId || ""} 
                  subProcessName={subProcessName}
                  workingYear={year}
                />
              </TabsContent>

              <TabsContent value="sampling" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <TransactionSamplingTab 
                  noGL={noGL} 
                  onSamplesSelected={(samples) => {
                    setSelectedSamples(samples);
                    setActiveTab("csa");
                  }} 
                />
              </TabsContent>

              <TabsContent value="csa" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <CSATabContent 
                  noGL={noGL} 
                  controls={controls || []} 
                  initialSamples={selectedSamples}
                  bpmProcessId={bpmProcessId}
                  subProcessName={subProcessName}
                  scheduleId={scheduleId}
                />
              </TabsContent>

              <TabsContent value="rcm" className="m-0 focus-visible:ring-0 h-full overflow-auto p-4">
                <div className="space-y-8 max-w-full">
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-indigo-50 p-3 border-b font-bold text-indigo-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.b - TLC Matrix
                      </div>
                      <RCMTLCPage embedded={true} filterBpmId={bpmProcessId} />
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-slate-50 p-3 border-b font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.a - ELC Matrix
                      </div>
                      <RCMELCPage embedded={true} />
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-blue-50 p-3 border-b font-bold text-blue-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.c - ITGC Matrix
                      </div>
                      <RCMITGCPage embedded={true} filterBpmId={bpmProcessId} />
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="m-0 focus-visible:ring-0 h-full overflow-auto p-6">
                <Lampiran6LogView entityId={noGL} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <UnsavedChangesDialog blocker={blocker} />
      </DialogContent>
    </Dialog>
  );
}
