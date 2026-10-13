import React from 'react';
import { motion, Variants } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, Database, LayoutGrid, Settings2 } from 'lucide-react';
import { GLSourceTable } from '@/components/scoping/GLSourceTable';
import { SimulationListTable } from '@/components/scoping/SimulationListTable';
import { SetBenchmarkModal } from '@/components/scoping/SetBenchmarkModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from '@/hooks/use-confirm';
import { usePurgeScoping } from './use-purge-scoping';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useIsMobile } from '@/hooks/use-mobile';

import { SmartImportWizard } from '@/components/scoping/SmartImportWizard';
import { RolloverPrompt } from '@/components/layout/RolloverPrompt';

// New Decomposed Parts
import { useScopingPage, useScopingEditor } from './hooks/useScopingPage';
import { parseGLFile } from './services/gl-parser';
import { MaterialityParamsCard } from './components/MaterialityParamsCard';
import { ScopingSimulationForm } from './components/ScopingSimulationForm';
import { ScopingEditorHeader } from './components/ScopingEditorHeader';
import { ScopingEditorContent } from './components/ScopingEditorContent';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel";
import { Card, CardContent } from '@/components/ui/card';
import { isJustificationComplete } from './services/materiality-justification';

import type { MaterialitySimulation } from '@shared/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] // ease-out-expo
    }
  }
};

export function ScopingPage() {
  const { t } = useTranslation(['scoping', 'common']);
  const { workingYear } = useFiscalYearStore();
  const queryClient = useQueryClient();
  const {
    selectedSimId, setSearchParams,
    isCreating, setIsCreating, benchmarkModalSnap, setBenchmarkModalSnap,
    simulations, snapshots, activeSnapshot, isLoading,
    mutations
  } = useScopingPage();

  const confirm = useConfirm();
  const { purgeScoping } = usePurgeScoping();
  const [isImportWizardOpen, setIsImportWizardOpen] = React.useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = React.useState(false);

  const handleDeleteSim = async (id: string) => {
    const sim = simulations.find(s => s.id === id);
    if (!sim) return;

    if (sim.status === 'Approved') {
      const ok = await confirm({
        title: t('scoping:delete.requestDeletionTitle'),
        description: t('scoping:delete.requestDeletionDesc', { name: sim.name }),
        variant: 'destructive',
        confirmText: t('common:actions.submit', { defaultValue: 'Submit Request' }),
      });
      if (ok) mutations.requestDeleteSim.mutate(id);
      return;
    }

    const ok = await confirm({
      title: t('scoping:delete.simTitle'),
      description: t('scoping:delete.simDesc', { name: sim.name }),
      variant: 'destructive'
    });
    if (ok) mutations.deleteSim.mutate(id);
  };

  const handleDeleteSnap = async (id: string) => {
    const snap = snapshots.find(s => s.id === id);
    const ok = await confirm({
      title: t('scoping:delete.snapTitle'),
      description: t('scoping:delete.snapDesc', { name: snap?.filename || '' }),
      variant: 'destructive'
    });
    if (ok) mutations.deleteSnap.mutate(id);
  };

  const filterYear = workingYear;

  const currentYear = new Date().getFullYear();
  const dynamicYears = React.useMemo(() => {
    const years = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) years.push(y.toString());
    return years;
  }, [currentYear]);

  if (selectedSimId) {
    const sim = simulations.find(s => s.id === selectedSimId);
    if (sim) return <ScopingEditor simulation={sim} onBack={() => setSearchParams({})} />;
  }

  return (
    <AppLayout container>
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <PageHeader 
          title={<span className="font-display font-extrabold tracking-tight text-slate-900">{t('scoping:title')}</span>} 
          description={t('scoping:description')}
          badge={activeSnapshot && (
            <Badge variant="outline" className={cn(
              "gap-1.5 font-bold uppercase tracking-wider text-xs transition-all px-2.5 py-1 shadow-sm ring-1 ring-slate-200/50",
              activeSnapshot.status === 'Mapped' 
                ? "bg-white text-emerald-700 border-emerald-200" 
                : "bg-white text-amber-700 border-amber-200"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", activeSnapshot.status === 'Mapped' ? "bg-emerald-500" : "bg-amber-500")} />
              {activeSnapshot.filename}
            </Badge>
          )}
        >
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-col min-[380px]:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
                onClick={() => setIsImportWizardOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> {t('scoping:uploadButton')}
              </Button>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="h-11 sm:h-10 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center gap-2 bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-md shadow-blue-100 transition-all font-bold text-xs uppercase tracking-wider border-none" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped'}
              >
                <Plus className="h-3.5 w-3.5" /> {t('scoping:simulation.createNew')}
              </Button>
            </div>
            {!activeSnapshot && <p className="text-xs font-bold text-rose-500 uppercase tracking-[0.1em]">{t('scoping:emptyState')}</p>}
          </div>
        </PageHeader>

        {simulations.length === 0 && snapshots.length === 0 && !isLoading && (
          <motion.div variants={itemVariants}>
            <Card className="bg-teal-50/50 border-teal-200/60 shadow-sm rounded-lg overflow-hidden">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap min-w-0">
                <div className="flex gap-3">
                  <div className="bg-teal-500/10 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center text-teal-600 shrink-0">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-900 text-sm">{t('scoping:rollover.title')}</h3>
                    <p className="text-xs text-teal-700/80 mt-1 max-w-2xl leading-relaxed">
                      {t('scoping:rollover.description', { year: workingYear, prevYear: (parseInt(workingYear) - 1).toString() })}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsRolloverOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 h-11 sm:h-10 min-h-[44px] w-full sm:w-auto justify-center rounded-lg shrink-0"
                >
                  {t('scoping:rollover.confirm')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="simulations" className="w-full">
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1 mb-8">
          <TabsList className="flex sm:grid w-max min-w-full sm:w-full sm:max-w-[440px] sm:grid-cols-2 bg-slate-100/50 p-1 border border-slate-200 rounded-lg shadow-inner min-h-[44px] gap-1">
            <TabsTrigger value="simulations" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2 px-4 min-h-[44px] flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap min-w-[160px] sm:min-w-0">
              <LayoutGrid className="h-4 w-4" /> {t('scoping:simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2 px-4 min-h-[44px] flex items-center justify-center flex-1 sm:flex-none whitespace-nowrap min-w-[160px] sm:min-w-0">
              <Database className="h-4 w-4" /> {t('scoping:masterDataTab')}
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="simulations">
            <motion.div variants={itemVariants}>
              <SimulationListTable 
                data={simulations} 
                onSelect={(id) => setSearchParams({ id })} 
                onDelete={handleDeleteSim} 
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="master-gl">
            <motion.div variants={itemVariants}>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mb-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-auto font-bold text-xs uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shadow-none rounded-md"
                  onClick={() => void purgeScoping()}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t('scoping:resetDataButton')}
                </Button>
              </div>
              <GLSourceTable 
                data={snapshots} 
                onSetActive={mutations.setActiveSnap.mutate}
                onSetBenchmark={setBenchmarkModalSnap}
                onDelete={handleDeleteSnap}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px] w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto border-none shadow-2xl rounded-lg p-0 ring-1 ring-primary/20">
            <div className="bg-mancity-pattern p-4 sm:p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="font-display font-extrabold text-2xl tracking-tight uppercase">{t('scoping:simulation.createNew')}</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider">
                  {t('scoping:simulation.basisDescription', { filename: activeSnapshot?.filename })}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-4 sm:p-6">
              <ScopingSimulationForm 
                activeSnap={activeSnapshot || null}
                onSubmit={(data) => mutations.createSim.mutate({ ...data, glSnapshotId: activeSnapshot?.id })} 
                isPending={mutations.createSim.isPending}
                defaultYear={workingYear}
              />
            </div>
          </DialogContent>
        </Dialog>

        <SetBenchmarkModal 
          snapshot={benchmarkModalSnap} 
          isOpen={!!benchmarkModalSnap} 
          onOpenChange={(open) => !open && setBenchmarkModalSnap(null)} 
        />

        <SmartImportWizard 
          isOpen={isImportWizardOpen} 
          onOpenChange={setIsImportWizardOpen}
          onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['simulations'] });
              queryClient.invalidateQueries({ queryKey: ['gl-snapshots'] });
          }}
        />

        <RolloverPrompt 
          isOpen={isRolloverOpen}
          onClose={() => setIsRolloverOpen(false)}
          onConfirm={() => {
            mutations.rollover.mutate({
              sourceYear: (parseInt(workingYear) - 1).toString(),
              targetYear: workingYear
            }, {
              onSuccess: () => {
                setIsRolloverOpen(false);
              }
            });
          }}
          year={workingYear}
          prevYear={(parseInt(workingYear) - 1).toString()}
          isLoading={mutations.rollover.isPending}
        />

      </motion.div>
    </AppLayout>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const { t } = useTranslation('scoping');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isParamsOpen, setIsParamsOpen] = React.useState(!isMobile);
  const [isWorkflowOpen, setIsWorkflowOpen] = React.useState(false);

  // Sync initial state when isMobile resolves if user hasn't explicitly toggled
  const hasUserToggledRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasUserToggledRef.current) {
      setIsParamsOpen(!isMobile);
    }
  }, [isMobile]);

  const handleToggleParams = React.useCallback(() => {
    hasUserToggledRef.current = true;
    setIsParamsOpen(prev => !prev);
  }, []);

  const {
    simState, setSimState, mergedGlData, entityHierarchy, selectedEntityCodes, setSelectedEntityCodes,
    omValue, pmValue, multiplier, benchmarkValue, scopingCompliance,
    departments, applications, localAppMappings, isLocked, mutations, handlers, isDirty,
    draftBasis, setDraftBasis, draftOmPercentage, setDraftOmPercentage,
    draftHaircutPercentage, setDraftHaircutPercentage, isStale, isRecalculating, handleRecalculate
  } = useScopingEditor(simulation);

  const handleOwnerAcceptanceChange = async (noGL: string, acceptance: "Accepted" | "Rejected") => {
    if (isLocked) return;
    try {
      await api(`/api/gl-rows/${noGL}/owner-acceptance`, { method: 'PUT', body: JSON.stringify({ ownerAcceptance: acceptance }) });
      toast.success(t('intake.notifications.ownerUpdated', { acceptance }));
    } catch (error) {
      toast.error(t('intake.notifications.ownerUpdateFailed'));
    }
  };

  const handleQuickAddApp = async (name: string, accountCode: string) => {
     // For now, delegate to existing logic if any, or implement simple version
     toast.info("Add application functionality extracted to component props");
  };

  return (
    <AppLayout container={false} noScroll className="bg-slate-100/30">
      <div className="flex flex-col flex-1 min-h-0 min-w-0 p-4 md:p-6 space-y-4 overflow-y-auto md:overflow-hidden">
        <div>
          <ScopingEditorHeader 
            simState={simState}
            isLocked={isLocked}
            onBack={onBack}
            onSave={() => mutations.save.mutate(simState)}
            isSaving={mutations.save.isPending}
            omValue={omValue}
            pmValue={pmValue}
            isParamsOpen={isParamsOpen}
            onToggleParams={handleToggleParams}
          />
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 min-w-0 gap-4 overflow-y-auto md:overflow-hidden w-full max-w-full pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {isParamsOpen ? (
            <div className="w-full md:w-[280px] shrink-0 min-h-0">
              <div className="max-h-[42vh] overflow-y-auto md:max-h-none md:overflow-visible rounded-xl">
              <MaterialityParamsCard 
                simState={simState}
                setSimState={setSimState}
                multiplier={multiplier}
                benchmarkValue={benchmarkValue}
                omValue={omValue}
                pmValue={pmValue}
                isLocked={isLocked}
                onClose={() => {
                  hasUserToggledRef.current = true;
                  setIsParamsOpen(false);
                }}
                draftBasis={draftBasis}
                setDraftBasis={setDraftBasis}
                draftOmPercentage={draftOmPercentage}
                setDraftOmPercentage={setDraftOmPercentage}
                draftHaircutPercentage={draftHaircutPercentage}
                setDraftHaircutPercentage={setDraftHaircutPercentage}
                isStale={isStale}
                isRecalculating={isRecalculating}
                handleRecalculate={handleRecalculate}
                onSaveJustification={(justification) => {
                  mutations.save.mutate({
                    ...simState,
                    materialityJustification: justification
                  });
                }}
              />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full md:w-8 shrink-0 flex flex-row md:flex-col items-center justify-center md:justify-start py-3 md:py-6 px-4 md:px-0 border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md group min-h-[44px] gap-2 md:gap-4 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              onClick={handleToggleParams}
              title={t('params.show', { defaultValue: 'Show Parameters' })}
              aria-label={t('params.show', { defaultValue: 'Show Parameters' })}
              aria-expanded={false}
            >
              <Settings2 className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-200 shrink-0" />
              <span 
                className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-indigo-600 transition-colors duration-200 md:[writing-mode:vertical-rl]" 
              >
                {t('params.title', { defaultValue: 'Parameters' })}
              </span>
            </button>
          )}

          <div className="flex-grow min-h-0 min-w-0 flex flex-col">
            <ScopingEditorContent 
              simState={simState}
              mergedGlData={mergedGlData}
              entityHierarchy={entityHierarchy}
              selectedEntityCodes={selectedEntityCodes}
              onEntitySelectionChange={setSelectedEntityCodes}
              omValue={omValue}
              pmValue={pmValue}
              isLocked={isLocked}
              departments={departments}
              applications={applications}
              selectedApps={localAppMappings}
              onAssessmentChange={handlers.onAssessmentChange}
              onOwnerAcceptanceChange={handleOwnerAcceptanceChange}
              onAssignDepartments={handlers.onAssignDepartments}
              onAppsChange={handlers.onAppsChange}
              onQuickAddApp={handleQuickAddApp}
              onOpenWorkflow={() => setIsWorkflowOpen(true)}
              scopingCompliance={scopingCompliance}
              isRecalculating={isRecalculating}
            />
          </div>
        </div>

        <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
          <DialogContent className="sm:max-w-[500px] w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto p-0 border-none bg-transparent">
             <DialogTitle className="sr-only">Workflow Actions</DialogTitle>
             <DialogDescription className="sr-only">
               Manage simulation lifecycle states and approvals.
             </DialogDescription>
             <WorkflowPanel 
                entityType="SCOPING"
                entityId={simulation.id}
                currentStatus={simState.workflowStatus || 'Draft'}
                history={simState.workflowHistory || []}
                className="w-full border-none shadow-2xl"
                isDirty={isDirty}
                beforeAction={(actionId) => {
                  if (actionId === 'Submit' || actionId === 'Approve') {
                    if (!isJustificationComplete(simState.materialityJustification)) {
                      toast.error(t('scoping:justification.incompleteAlertTitle'), {
                        description: t('scoping:justification.incompleteAlertDesc')
                      });
                      setIsWorkflowOpen(false);
                      setIsParamsOpen(true);
                      return false;
                    }
                  }
                  return true;
                }}
                onStatusChange={(newStatus) => {
                  queryClient.invalidateQueries({ queryKey: ['simulations'] });
                  setSimState(prev => ({ ...prev, workflowStatus: newStatus as any }));
                  setIsWorkflowOpen(false);
                }}
              />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
