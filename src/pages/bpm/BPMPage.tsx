import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Loader2, ArrowRight,
  Workflow as WorkflowIcon, ShieldCheck,
  AlertTriangle, Target, PlusCircle, X as XIcon
} from 'lucide-react';
import { BPMModal } from '@/components/bpm/BPMModal';
import { CSAModal } from '@/components/bpm/CSAModal';
import { BPMEditor } from '@/components/rcm/BPMEditor';
import { BPMAccountAssertion } from '@/components/bpm/BPMAccountAssertion';
import { BPMDiagramList } from '@/components/bpm/BPMDiagramList';
import { BPMScopingFilters } from '@/components/bpm/BPMScopingFilters';
import { BPMStatusBanner } from '@/components/bpm/BPMStatusBanner';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { motion, Variants } from 'framer-motion';
import { useConfirm } from '@/hooks/use-confirm';

import { PageHeader } from '@/components/layout/PageHeader';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel";
import { useBPMPage } from './hooks/useBPMPage';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export function BPMPage() {
  const confirm = useConfirm();
  const {
    t,
    viewYear,
    selectedFsli,
    setSelectedFsli,
    selectedAccountKey,
    setSelectedAccountKey,
    selectedBpmId,
    setSelectedBpmId,
    isModalOpen,
    setIsModalOpen,
    isCsaModalOpen,
    setIsCsaModalOpen,
    selectedBpmName,
    setSelectedBpmName,
    isBpmEditorOpen,
    selectedDiagramId,
    currentSubProcess,
    currentBpmProcessId,
    isCreatingBPM,
    setIsCreatingBPM,
    bpmName,
    setBpmName,
    bpmCode,
    setBpmCode,
    searchTerm,
    setSearchTerm,
    selectedProcess,
    setSelectedProcess,
    localAssertion,
    handleOpenDiagram,
    handleCloseDiagram,
    queryClient,

    // Queries
    activeSim,
    activeSnap,
    snapLoading,
    simLoading,
    settings,
    assertionLoading,
    bpmLoading,
    diagrams,

    // Derived properties
    significantFsliNames,
    glNumbers,
    selectedGLRow,
    departmentName,
    hasAccess,
    filteredBpmProcesses,
    isAssertionDirty,

    // Mutations
    updateAssertionMutation,
    createDiagramMutation,
    createBPMMutation,
    deleteBPMMutation,

    // Actions
    handleAssertionChange,
    handleSaveAssertions,
  } = useBPMPage();

  return (
    <AppLayout container>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 pb-10"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={<span className="font-display tracking-tight text-slate-900 font-extrabold">{t('title')}</span>} 
            description={t('description')}
            badge={
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1.5 py-1 px-3 font-bold uppercase tracking-widest text-[10px] rounded-md shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('common:cycles.cycleLabel', { year: viewYear })}
              </Badge>
            }
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <BPMScopingFilters
            selectedFsli={selectedFsli}
            setSelectedFsli={setSelectedFsli}
            selectedAccountKey={selectedAccountKey}
            setSelectedAccountKey={setSelectedAccountKey}
            setSelectedBpmId={setSelectedBpmId}
            snapLoading={snapLoading}
            simLoading={simLoading}
            significantFsliNames={significantFsliNames}
            glNumbers={glNumbers}
            selectedGLRow={selectedGLRow}
            isAssertionDirty={isAssertionDirty}
          />
        </motion.div>

        <BPMStatusBanner
          activeSim={activeSim}
          activeSnap={activeSnap}
          snapLoading={snapLoading}
          viewYear={viewYear}
        />

        {!activeSim ? null : !selectedAccountKey ? (
          <motion.div 
            variants={itemVariants}
            className="py-24 text-center border-2 border-dashed rounded-2xl bg-white border-slate-200 shadow-sm"
          >
            <div className="h-20 w-20 bg-indigo-50/50 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/30">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tight mb-2">Ready to Map Process</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium leading-relaxed">
              Select an FSLI and GL Account from the selection panel above to begin mapping business processes, risks, and controls.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">1</div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">2</div>
            </div>
          </motion.div>
        ) : !hasAccess ? (
          <motion.div 
            variants={itemVariants}
            className="py-12 text-center border-2 border-rose-100 rounded-2xl bg-rose-50/30"
          >
            <div className="h-14 w-14 bg-rose-100 text-rose-300 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-display font-bold text-rose-900">{t('common:access.restricted')}</h3>
            <p className="text-rose-700/70 text-xs max-w-md mx-auto mt-2 leading-relaxed font-medium px-6">
              {t('common:access.assignedTo')} <strong className="text-rose-900 underline decoration-rose-200">{departmentName || "Departemen Lain"}</strong>. 
              {t('common:access.lini1Restricted')}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants}>
              <BPMAccountAssertion 
                localAssertion={localAssertion}
                assertionLoading={assertionLoading}
                isAssertionDirty={isAssertionDirty}
                onAssertionChange={handleAssertionChange}
                onSave={handleSaveAssertions}
                isSaving={updateAssertionMutation.isPending}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 w-full md:max-w-md relative group">
                  <Label htmlFor="bpm-search" className="sr-only">Search BPM Processes</Label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    id="bpm-search"
                    placeholder={t('searchPlaceholder')} 
                    className="pl-10 h-10 bg-slate-50 border-slate-200 text-sm font-medium rounded-lg focus:bg-white transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t('bpm:modal.owner')}</p>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                      <Target className="h-3 w-3 text-indigo-500" />
                      {departmentName || "Finance & Accounting"}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-100" />
                  <Button onClick={() => setIsCreatingBPM(true)} className="h-10 gap-2 bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest px-6 rounded-lg">
                    <PlusCircle className="h-3.5 w-3.5" /> {t('createProcessButton')}
                  </Button>
                </div>
              </div>

              <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border border-slate-200 rounded-[2.5rem] bg-white overflow-hidden shadow-xl shadow-slate-100">
                <ResizablePanel defaultSize={selectedProcess ? 70 : 100} minSize={30}>
                  <BPMDiagramList 
                    bpmLoading={bpmLoading}
                    filteredBpmProcesses={filteredBpmProcesses}
                    diagrams={diagrams}
                    settings={settings}
                    selectedGLRow={selectedGLRow}
                    onOpenDiagram={handleOpenDiagram}
                    onCreateDiagram={(name) => createDiagramMutation.mutate(name)}
                    onOpenWorksheet={(id, name) => {
                      setSelectedBpmId(id);
                      setSelectedBpmName(name);
                      setIsModalOpen(true);
                    }}
                    onDeleteProcess={async (id, name) => {
                      const ok = await confirm({
                        title: t('common:actions.deletePermanently'),
                        description: t('bpm:deleteConfirm', { name }),
                        variant: 'destructive'
                      });
                      if (ok) {
                        deleteBPMMutation.mutate(id);
                      }
                    }}
                    onSelectProcess={setSelectedProcess}
                    selectedProcessId={selectedProcess?.id}
                    searchTerm={searchTerm}
                  />
                </ResizablePanel>
                
                {selectedProcess && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={30} minSize={20} className="bg-slate-50/30">
                      <div className="h-full flex flex-col">
                        <div className="p-4 border-b bg-white flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Process</span>
                              <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{selectedProcess.name}</span>
                           </div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedProcess(null)}>
                              <XIcon className="h-4 w-4" />
                           </Button>
                        </div>
                        <WorkflowPanel 
                           entityType="BPM"
                           entityId={selectedProcess.id}
                           currentStatus={selectedProcess.workflowStatus || 'Draft'}
                           history={selectedProcess.workflowHistory || []}
                           className="flex-1 border-none shadow-none rounded-none"
                           onStatusChange={(newStatus) => {
                             queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
                             setSelectedProcess(prev => prev ? { ...prev, workflowStatus: newStatus as any } : null);
                           }}
                        />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </motion.div>
          </motion.div>
        )}

        {selectedGLRow && (
          <BPMModal 
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            noGL={selectedGLRow.noGL}
            glDesc={selectedGLRow.glDesc}
            fsliName={selectedFsli}
            bpmProcessId={selectedBpmId || undefined}
            subProcessName={selectedBpmName}
            year={viewYear}
          />
        )}

        <Dialog open={isBpmEditorOpen} onOpenChange={(open) => !open && handleCloseDiagram()}>
          <DialogContent className="max-w-[98vw] w-[1600px] h-[98vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <DialogTitle className="sr-only">BPM Workflow Editor: {currentSubProcess}</DialogTitle>
            <DialogDescription className="sr-only">Visual editor for BPM workflow processes</DialogDescription>
            <div className="bg-mancity-pattern p-6 flex justify-between items-center text-primary-foreground">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-primary-foreground border border-white/30">
                    <WorkflowIcon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-primary-foreground">BPM Workflow Editor: {currentSubProcess}</h2>
                </div>
                <p className="text-primary-foreground/60 text-[10px] font-medium uppercase tracking-[0.2em] ml-[48px]">Mapping business processes, risks, and controls visually.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseDiagram} className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 rounded-full h-10 w-10">
                 <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 bg-slate-50">
              {selectedDiagramId && (
                <BPMEditor 
                  diagramId={selectedDiagramId} 
                  subProcess={currentSubProcess} 
                  workingYear={viewYear} 
                  currentGL={selectedGLRow?.noGL}
                  bpmProcessId={currentBpmProcessId || selectedProcess?.id || undefined}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreatingBPM} onOpenChange={setIsCreatingBPM}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl rounded-xl overflow-hidden p-0">
            <div className="bg-mancity-pattern p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="font-display text-xl tracking-tight text-primary-foreground">{t('bpm:createModalTitle')}</DialogTitle>
                <DialogDescription className="text-primary-foreground/60 text-[10px] uppercase tracking-wider mt-1">
                  Define a major process heading for <strong>{selectedGLRow?.noGL}</strong>.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">{t('bpm:processNameLabel')}</Label>
                <Input 
                  placeholder="e.g. Penerimaan setoran tunai" 
                  value={bpmName} 
                  onChange={e => setBpmName(e.target.value)} 
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">BPM Code</Label>
                <Input 
                  placeholder="e.g. FIN-01" 
                  value={bpmCode} 
                  onChange={e => setBpmCode(e.target.value.toUpperCase())} 
                  className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-bold uppercase"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsCreatingBPM(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">{t('common:actions.cancel')}</Button>
                <Button 
                  disabled={!bpmName || !bpmCode || createBPMMutation.isPending} 
                  onClick={() => createBPMMutation.mutate({ 
                    name: bpmName, 
                    bpmCode,
                    noGL: selectedGLRow?.noGL || "", 
                    fsliName: selectedFsli,
                    year: parseInt(viewYear)
                  })}
                  className="h-10 px-6 bg-mancity-pattern hover:opacity-90 shadow-sm rounded-lg font-bold text-[10px] uppercase tracking-widest text-primary-foreground"
                >
                  {createBPMMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  {t('bpm:createProcessButton')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {selectedGLRow && (
          <CSAModal
            isOpen={isCsaModalOpen}
            onOpenChange={setIsCsaModalOpen}
            noGL={selectedGLRow.noGL}
            subProcessName={selectedBpmName}
            bpmProcessId={selectedBpmId || undefined}
          />
        )}
      </motion.div>
    </AppLayout>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
