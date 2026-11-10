import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api-client';
import { useScopingEditor } from '../hooks/useScopingPage';
import { isJustificationComplete } from '../services/materiality-justification';
import { ScopingEditorHeader } from './ScopingEditorHeader';
import { ScopingEditorContent } from './ScopingEditorContent';
import { MaterialityParamsCard } from './MaterialityParamsCard';
import type { MaterialitySimulation } from '@shared/types';
import { isSimulationStatus, resolveSimulationStatus, simulationStatusColumns, simulationTimeline } from '@shared/scoping-simulation-status';

interface ScopingEditorProps {
  simulation: MaterialitySimulation;
  onBack: () => void;
}

/**
 * Materiality editor shell: header stats + parameters card + GL matrix, and the
 * workflow dialog. Kept out of ScopingPage so the page stays a thin orchestrator
 * (LOC gate) and the submit guard lives next to the save it depends on.
 */
export function ScopingEditor({ simulation, onBack }: ScopingEditorProps) {
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
    draftOmPercentage, setDraftOmPercentage,
    draftHaircutPercentage, setDraftHaircutPercentage, isRecalculating, handleRecalculate
  } = useScopingEditor(simulation);

  const handleOwnerAcceptanceChange = async (noGL: string, acceptance: "Accepted" | "Rejected") => {
    if (isLocked) return;
    try {
      await api(`/api/gl-rows/${noGL}/owner-acceptance`, { method: 'PUT', body: JSON.stringify({ ownerAcceptance: acceptance }) });
      toast.success(t('intake.notifications.ownerUpdated', { acceptance }));
    } catch {
      toast.error(t('intake.notifications.ownerUpdateFailed'));
    }
  };

  /**
   * The worksheet (intake) is where an application is created; this view keeps
   * the affordance but only tells the user where the flow lives.
   */
  const handleQuickAddApp = async () => {
    toast.info(t('editor.quickAddAppUnavailable'));
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
                isLocked={isLocked}
                onClose={() => {
                  hasUserToggledRef.current = true;
                  setIsParamsOpen(false);
                }}
                draftOmPercentage={draftOmPercentage}
                setDraftOmPercentage={setDraftOmPercentage}
                draftHaircutPercentage={draftHaircutPercentage}
                setDraftHaircutPercentage={setDraftHaircutPercentage}
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
              title={t('params.show')}
              aria-label={t('params.show')}
              aria-expanded={false}
            >
              <Settings2 className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-200 shrink-0" />
              <span
                className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-indigo-600 transition-colors duration-200 md:[writing-mode:vertical-rl]"
              >
                {t('params.title')}
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
             <DialogTitle className="sr-only">{t('editor.workflowActionsTitle')}</DialogTitle>
             <DialogDescription className="sr-only">
               {t('editor.workflowActionsDesc')}
             </DialogDescription>
             <WorkflowPanel
                entityType="SCOPING"
                entityId={simulation.id}
                currentStatus={resolveSimulationStatus(simState)}
                history={simulationTimeline(simState)}
                className="w-full border-none shadow-2xl"
                isDirty={isDirty}
                beforeAction={async (actionId) => {
                  if (actionId === 'Submit') {
                    if (!isJustificationComplete(simState.materialityJustification)) {
                      toast.error(t('scoping:justification.incompleteAlertTitle'), {
                        description: t('scoping:justification.incompleteAlertDesc')
                      });
                      setIsWorkflowOpen(false);
                      setIsParamsOpen(true);
                      return false;
                    }
                  }
                  // A submit must persist the derived materiality first, else the
                  // record reaches CFO review with a stale (0) PM.
                  if (actionId === 'Submit') {
                    try {
                      await mutations.save.mutateAsync(simState);
                    } catch {
                      toast.error(t('editor.saveBeforeSubmitFailed'));
                      return false;
                    }
                  }
                  return true;
                }}
                onStatusChange={(newStatus) => {
                  queryClient.invalidateQueries({ queryKey: ['simulations'] });
                  if (isSimulationStatus(newStatus)) {
                    setSimState(prev => ({ ...prev, ...simulationStatusColumns(newStatus) }));
                  }
                  setIsWorkflowOpen(false);
                }}
              />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
