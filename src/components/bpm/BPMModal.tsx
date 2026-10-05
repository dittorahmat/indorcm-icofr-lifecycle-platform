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
  LayoutDashboard, Activity, ClipboardCheck
} from 'lucide-react';
import { BPMWorksheet } from './BPMWorksheet';
import { Lampiran6LogView } from './Lampiran6LogView';
import { CSATabContent } from './CSATabContent';
import { TransactionSamplingTab } from './TransactionSamplingTab';
import { RCMELCPage } from '@/pages/rcm/RCMELCPage';
import { RCMTLCPage } from '@/pages/rcm/RCMTLCPage';
import { RCMITGCPage } from '@/pages/rcm/RCMITGCPage';
import { VerificationDesignPage } from '@/pages/rcm/VerificationDesignPage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control, User, TransactionDetail, BPMProcess } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { WorkflowPanel } from '../workflow/WorkflowPanel';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { isFieldLini1 } from '@/lib/field-lini1';

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
  initialTab?: string;
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
  scheduleId,
  initialTab = "worksheet"
}: BPMModalProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const { isDirty: globalDirty } = useUnsavedChangesContext();
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [selectedSamples, setSelectedSamples] = React.useState<TransactionDetail[]>([]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSelectedSamples([]);
      setActiveTab(initialTab);
    }
    onOpenChange(open);
  }, [initialTab, onOpenChange]);

  const { data: processData } = useQuery({
    queryKey: ['bpm-process', bpmProcessId],
    queryFn: async () => {
      const res = await api<{ items: BPMProcess[] }>(`/api/bpm-processes?id=${bpmProcessId}`);
      return res.items[0];
    },
    enabled: !!bpmProcessId && isOpen
  });

  // Maintain tab sync if opened/re-opened with a schedule or initialTab
  React.useEffect(() => {
    if (isOpen) {
      if (scheduleId) {
        setActiveTab("csa");
      } else if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      setSelectedSamples([]);
      setActiveTab(initialTab);
    }
  }, [isOpen, scheduleId, initialTab]);

  // Safety guard for modal closing
  useUnsavedChanges(isOpen && (selectedSamples.length > 0 && activeTab === 'sampling' || globalDirty));

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const fieldMode = isFieldLini1(
    (currentUser as unknown as { role?: unknown })?.role ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('mockRole') : null),
    scheduleId,
  );

  const { data: controls } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName, year],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>(`/api/controls?year=${year}`);
      return all.items.filter(c => {
        if (c.year && year && c.year.toString() !== year.toString()) {
          return false;
        }

        const cSub = (c.subProcess || "").toLowerCase().trim();
        const targetSub = (subProcessName || "").toLowerCase().trim();

        // Match 1: Hard ID link (Primary & Strict)
        if (bpmProcessId && c.bpmProcessId === bpmProcessId) {
          // If GL is specified, verify control belongs to this GL or has no GL restriction
          if (noGL && c.fsliCodes && c.fsliCodes.length > 0) {
            return c.fsliCodes.includes(noGL);
          }
          return true;
        }
        
        // Match 2: Name link (Secondary Fallback - MUST also match GL)
        if (targetSub && cSub === targetSub) {
          if (noGL && c.fsliCodes && c.fsliCodes.length > 0) {
            return c.fsliCodes.includes(noGL);
          }
          return !noGL;
        }
        
        return false;
      });
    },
    enabled: isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full sm:max-w-[98vw] h-[95dvh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-lg">
        <DialogHeader className="p-3 sm:p-4 border-b bg-mancity-pattern text-primary-foreground shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="bg-primary-foreground/10 p-2 rounded-lg shrink-0">
                <Network className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-xl font-black tracking-tight flex items-center gap-2 min-w-0">
                  <span className="text-indigo-900 shrink-0">Execution Hub:</span>
                  <span className="truncate">{subProcessName || glDesc}</span>
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 opacity-80">
                  <Badge className="bg-primary-foreground/10 text-primary-foreground border-none font-mono text-xs">
                    BPM-REF: {noGL}
                  </Badge>
                  <span className="text-xs uppercase font-bold tracking-widest">{fsliName}</span>
                  {subProcessName && glDesc && (
                    <>
                      <div className="h-3 w-[1px] bg-primary-foreground/20 mx-1" />
                      <span className="text-xs uppercase font-medium text-primary-foreground/70 tracking-tight">
                        Account: {glDesc}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 min-h-[44px] sm:min-h-0 text-xs font-bold bg-primary-foreground/5 border-primary-foreground/10 hover:bg-primary-foreground/10 text-primary-foreground">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> {t('common:actions.printPdf')}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} aria-label={t('common:actions.close', { defaultValue: 'Close' })} className="text-primary-foreground hover:bg-primary-foreground/5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8">
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0 overflow-hidden bg-slate-50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-3 sm:px-6 border-b bg-white shrink-0 shadow-sm z-10 max-w-full">
              <TabsList className="h-14 bg-transparent gap-4 sm:gap-8 p-0 max-w-full overflow-x-auto no-scrollbar">
                {!fieldMode && (
                  <TabsTrigger value="worksheet" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                    <FileSpreadsheet className="h-4 w-4" /> {t('modal.tabs.worksheet')}
                  </TabsTrigger>
                )}
                {!fieldMode && (
                  <TabsTrigger value="sampling" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                    <Database className="h-4 w-4" /> {t('modal.tabs.sampling')}
                  </TabsTrigger>
                )}
                {!fieldMode && (
                  <TabsTrigger value="rcm" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                    <ListChecks className="h-4 w-4" /> {t('modal.tabs.rcm')}
                  </TabsTrigger>
                )}
                <TabsTrigger value="csa" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> {t('modal.tabs.csa')}
                </TabsTrigger>
                {!fieldMode && (
                  <TabsTrigger value="verification" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                    <ClipboardCheck className="h-4 w-4" /> {t('modal.tabs.verification')}
                  </TabsTrigger>
                )}
                {!fieldMode && (
                  <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-black text-xs uppercase text-slate-500 tracking-wider">
                    <History className="h-4 w-4" /> {t('modal.tabs.logs')}
                  </TabsTrigger>
                )}
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
                  bpmProcessId={bpmProcessId}
                  year={year}
                  onSamplesSelected={(samples) => {
                    setSelectedSamples(samples);
                    setActiveTab("csa");
                  }} 
                />
              </TabsContent>

              <TabsContent value="rcm" className="m-0 focus-visible:ring-0 h-full overflow-auto p-4">
                <div className="space-y-8 max-w-full">
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-indigo-50 p-3 border-b font-bold text-indigo-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.b - TLC Matrix
                      </div>
                      <RCMTLCPage embedded={true} filterBpmId={bpmProcessId} workingYearOverride={year} noGLFilter={noGL} />
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-slate-50 p-3 border-b font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.a - ELC Matrix
                      </div>
                      <RCMELCPage embedded={true} workingYearOverride={year} relevantFsli={fsliName} />
                   </div>
                   <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-blue-50 p-3 border-b font-bold text-blue-900 text-xs uppercase tracking-widest flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Lampiran 5.c - ITGC Matrix
                      </div>
                      <RCMITGCPage embedded={true} filterBpmId={bpmProcessId} workingYearOverride={year} />
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="csa" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <CSATabContent
                  noGL={noGL}
                  controls={controls || []}
                  initialSamples={selectedSamples}
                  bpmProcessId={bpmProcessId}
                  subProcessName={subProcessName}
                  scheduleId={scheduleId}
                  fieldMode={fieldMode}
                />
              </TabsContent>

              <TabsContent value="verification" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <VerificationDesignPage 
                  embedded={true} 
                  filterBpmId={bpmProcessId} 
                  workingYear={year}
                  noGLFilter={noGL}
                />
              </TabsContent>

              <TabsContent value="logs" className="m-0 focus-visible:ring-0 h-full overflow-auto p-4 sm:p-6">
                <Lampiran6LogView 
                  bpmProcessId={bpmProcessId} 
                  subProcessName={subProcessName} 
                  year={year} 
                  entityId={noGL} 
                />
              </TabsContent>
            </div>
          </Tabs>

        </div>
      </DialogContent>
    </Dialog>
  );
}
