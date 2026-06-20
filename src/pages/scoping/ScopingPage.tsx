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
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

// New Components
import { SmartImportWizard } from '@/components/scoping/SmartImportWizard';

// New Decomposed Parts
import { useScopingPage, useScopingEditor } from './hooks/useScopingPage';
import { parseGLFile } from './services/gl-parser';
import { MaterialityParamsCard } from './components/MaterialityParamsCard';
import { ScopingSimulationForm } from './components/ScopingSimulationForm';
import { ScopingEditorHeader } from './components/ScopingEditorHeader';
import { ScopingEditorContent } from './components/ScopingEditorContent';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel";

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

  const [isImportWizardOpen, setIsImportWizardOpen] = React.useState(false);

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
              "gap-1.5 font-bold uppercase tracking-wider text-[10px] transition-all px-2.5 py-1 shadow-sm ring-1 ring-slate-200/50",
              activeSnapshot.status === 'Mapped' 
                ? "bg-white text-emerald-700 border-emerald-200" 
                : "bg-white text-amber-700 border-amber-200"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", activeSnapshot.status === 'Mapped' ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse")} />
              {activeSnapshot.filename}
            </Badge>
          )}
        >
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
                onClick={() => setIsImportWizardOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" /> {t('scoping:uploadButton')}
              </Button>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="h-10 gap-2 bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-md shadow-blue-100 transition-all font-bold text-xs uppercase tracking-wider border-none" 
                disabled={!activeSnapshot || activeSnapshot.status !== 'Mapped'}
              >
                <Plus className="h-3.5 w-3.5" /> {t('scoping:simulation.createNew')}
              </Button>
            </div>
            {!activeSnapshot && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.1em]">{t('scoping:emptyState')}</p>}
          </div>
        </PageHeader>

        <Tabs defaultValue="simulations" className="w-full">
          <TabsList className="grid w-full max-w-[440px] grid-cols-2 mb-8 bg-slate-100/50 p-1 border border-slate-200 rounded-xl shadow-inner">
            <TabsTrigger value="simulations" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2">
              <LayoutGrid className="h-4 w-4" /> {t('scoping:simulation.title')}
            </TabsTrigger>
            <TabsTrigger value="master-gl" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest py-2">
              <Database className="h-4 w-4" /> {t('scoping:masterDataTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulations">
            <motion.div variants={itemVariants}>
              <SimulationListTable 
                data={simulations} 
                onSelect={(id) => setSearchParams({ id })} 
                onDelete={mutations.deleteSim.mutate} 
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="master-gl">
            <motion.div variants={itemVariants}>
              <div className="flex justify-end mb-4">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="gap-2 h-8 font-bold text-[10px] uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all shadow-none rounded-md"
                  onClick={() => {
                    if (confirm(t('scoping:purgeConfirm'))) {
                      api('/api/dev/purge-scoping', { method: 'DELETE' }).then(() => {
                        queryClient.invalidateQueries();
                        toast.success(t('common:notifications.purged'));
                      });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t('scoping:resetDataButton')}
                </Button>
              </div>
              <GLSourceTable 
                data={snapshots} 
                onSetActive={mutations.setActiveSnap.mutate}
                onSetBenchmark={setBenchmarkModalSnap}
                onDelete={mutations.deleteSnap.mutate}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl rounded-2xl overflow-hidden p-0 ring-1 ring-primary/20">
            <div className="bg-mancity-pattern p-6 text-primary-foreground">
              <DialogHeader>
                <DialogTitle className="font-display font-extrabold text-2xl tracking-tight uppercase">{t('scoping:simulation.createNew')}</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider">
                  {t('scoping:simulation.basisDescription', { filename: activeSnapshot?.filename })}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
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
      </motion.div>
    </AppLayout>
  );
}

function ScopingEditor({ simulation, onBack }: { simulation: MaterialitySimulation, onBack: () => void }) {
  const { t } = useTranslation('scoping');
  const queryClient = useQueryClient();
  const [isParamsOpen, setIsParamsOpen] = React.useState(true);
  const [isWorkflowOpen, setIsWorkflowOpen] = React.useState(false);

  const {
    simState, setSimState, mergedGlData, entityHierarchy, selectedEntityCodes, setSelectedEntityCodes,
    omValue, pmValue, multiplier, benchmarkValue,
    departments, applications, localAppMappings, isLocked, mutations, handlers, isDirty
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
      <div className="flex flex-col flex-1 min-h-0 min-w-0 p-4 md:p-6 space-y-4 overflow-hidden">
        <div className="shrink-0">
          <ScopingEditorHeader 
            simState={simState}
            isLocked={isLocked}
            onBack={onBack}
            onSave={() => mutations.save.mutate(simState)}
            isSaving={mutations.save.isPending}
            omValue={omValue}
            pmValue={pmValue}
            isParamsOpen={isParamsOpen}
            onToggleParams={() => setIsParamsOpen(!isParamsOpen)}
          />
        </div>

        <div className="flex flex-row flex-1 min-h-0 min-w-0 gap-4 overflow-hidden w-full">
          {isParamsOpen ? (
            <div className="w-[280px] shrink-0 min-h-0">
              <MaterialityParamsCard 
                simState={simState}
                setSimState={setSimState}
                multiplier={multiplier}
                benchmarkValue={benchmarkValue}
                omValue={omValue}
                pmValue={pmValue}
                isLocked={isLocked}
                onClose={() => setIsParamsOpen(false)}
              />
            </div>
          ) : (
            <div 
              className="w-8 shrink-0 flex flex-col items-center py-6 border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md group min-h-0 justify-start gap-4 select-none"
              onClick={() => setIsParamsOpen(true)}
              title={t('params.show', 'Show Parameters')}
            >
              <Settings2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors duration-200" />
              <span 
                className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors duration-200" 
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                {t('params.title', 'Parameters')}
              </span>
            </div>
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
            />
          </div>
        </div>

        <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 border-none overflow-hidden bg-transparent">
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
