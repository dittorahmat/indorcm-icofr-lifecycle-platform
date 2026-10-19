import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { AlertTriangle, ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { CollapsibleFilterCard } from '@/components/layout/CollapsibleFilterCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { BPMAccountAssertion } from '@/components/bpm/BPMAccountAssertion';
import { BPMMigrationModal } from '@/components/bpm/BPMMigrationModal';
import { BPMModal } from '@/components/bpm/BPMModal';
import { BPMScopingFilters } from '@/components/bpm/BPMScopingFilters';
import { BPMStatusBanner } from '@/components/bpm/BPMStatusBanner';
import { CSAModal } from '@/components/bpm/CSAModal';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useConfirm } from '@/hooks/use-confirm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { BpmEditorDialog } from './components/BpmEditorDialog';
import { BpmProcessToolbar } from './components/BpmProcessToolbar';
import { BpmProcessWorkspace } from './components/BpmProcessWorkspace';
import { CreateProcessDialog } from './components/CreateProcessDialog';
import { useBpmProcessHierarchy } from './hooks/useBpmProcessHierarchy';
import { useBpmProcessMutations } from './hooks/useBpmProcessMutations';
import { useBpmScopingSelection } from './hooks/useBpmScopingSelection';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

/**
 * BPM workspace orchestrator: composes the scoping-selection, process-hierarchy
 * and mutation hooks with the workspace components. Holds only the dialog
 * plumbing and the diagram deep-link.
 */
export function BPMPage() {
  const { t } = useTranslation(['bpm', 'common', 'rcm']);
  const confirm = useConfirm();
  const isMobile = useIsMobile();
  const { workingYear: viewYear } = useFiscalYearStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDirty } = useUnsavedChangesContext();

  const [selectedBpmId, setSelectedBpmId] = useState<string | null>(null);
  const [selectedBpmName, setSelectedBpmName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsaModalOpen, setIsCsaModalOpen] = useState(false);

  const scoping = useBpmScopingSelection({
    viewYear,
    searchParams,
    departmentFallback: t('ownerFallback'),
    unassignedLabel: t('unassignedDepartment'),
  });
  const hierarchy = useBpmProcessHierarchy({
    viewYear,
    selectedAccountKey: scoping.selectedAccountKey,
  });

  const selectedDiagramId = searchParams.get('diagramId');
  const currentSubProcess = searchParams.get('subProcess') || '';

  const handleOpenDiagram = (diagramId: string, subProcess: string, bpmProcessId?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('diagramId', diagramId);
      next.set('subProcess', subProcess);
      if (bpmProcessId) next.set('bpmProcessId', bpmProcessId);
      next.set('year', viewYear);
      return next;
    });
  };

  const handleCloseDiagram = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: t('common:unsavedChanges.title'),
        description: t('common:unsavedChanges.description'),
        confirmText: t('common:unsavedChanges.discard'),
        cancelText: t('common:unsavedChanges.stay'),
        variant: 'destructive',
      });
      if (!ok) return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('diagramId');
      next.delete('subProcess');
      next.delete('bpmProcessId');
      return next;
    });
  };

  const mutations = useBpmProcessMutations({
    viewYear,
    bpmProcesses: hierarchy.bpmProcesses,
    onOpenDiagram: handleOpenDiagram,
    onDeleteSuccess: (id) => {
      setSelectedBpmId(null);
      hierarchy.setSelectedProcessIds((prev) => prev.filter((itemId) => itemId !== id));
    },
    onReorganizeSuccess: () => {
      hierarchy.setSelectedProcessIds([]);
      hierarchy.setIsMigrationModalOpen(false);
    },
  });

  const handleDeleteProcess = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('common:actions.deletePermanently'),
      description: t('bpm:deleteConfirm', { name }),
      variant: 'destructive',
    });
    if (ok) mutations.deleteBPMMutation.mutate(id);
  };

  const { selectedGLRow, assertions } = scoping;

  return (
    <AppLayout container>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-10">
        <motion.div variants={itemVariants}>
          <PageHeader
            title={<span className="font-display tracking-tight text-slate-900 font-extrabold">{t('title')}</span>}
            description={t('description')}
            badge={
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1.5 py-1 px-3 font-bold uppercase tracking-widest text-xs rounded-md shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('common:cycles.cycleLabel', { year: viewYear })}
              </Badge>
            }
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CollapsibleFilterCard title={t('selectionTitle')} layout="section" testId="bpm-scoping-filters">
            <BPMScopingFilters
              selectedFsli={scoping.selectedFsli}
              setSelectedFsli={scoping.setSelectedFsli}
              selectedAccountKey={scoping.selectedAccountKey}
              setSelectedAccountKey={scoping.setSelectedAccountKey}
              setSelectedBpmId={setSelectedBpmId}
              snapLoading={scoping.snapLoading}
              simLoading={scoping.simLoading}
              significantFsliNames={scoping.significantFsliNames}
              glNumbers={scoping.glNumbers}
              selectedGLRow={selectedGLRow}
              isAssertionDirty={assertions.isAssertionDirty}
            />
            <BPMStatusBanner
              activeSim={scoping.activeSim}
              activeSnap={scoping.activeSnap}
              snapLoading={scoping.snapLoading}
              viewYear={viewYear}
            />
          </CollapsibleFilterCard>
        </motion.div>

        {!scoping.activeSim ? null : !scoping.selectedAccountKey ? (
          <motion.div
            variants={itemVariants}
            className="py-24 text-center border-2 border-dashed rounded-lg bg-white border-slate-200 shadow-sm"
          >
            <div className="h-20 w-20 bg-indigo-50/50 text-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-6 ring-8 ring-indigo-50/30">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tight mb-2">
              {t('emptyTitle')}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium leading-relaxed">{t('emptyHint')}</p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">1</div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200">2</div>
            </div>
          </motion.div>
        ) : !scoping.hasAccess ? (
          <motion.div
            variants={itemVariants}
            className="py-12 text-center border-2 border-rose-100 rounded-lg bg-rose-50/30"
          >
            <div className="h-14 w-14 bg-rose-100 text-rose-300 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-display font-bold text-rose-900">{t('common:access.restricted')}</h3>
            <p className="text-rose-700/70 text-xs max-w-md mx-auto mt-2 leading-relaxed font-medium px-6">
              {t('common:access.assignedTo')}{' '}
              <strong className="text-rose-900 underline decoration-rose-200">{scoping.departmentName}</strong>.{' '}
              {t('common:access.lini1Restricted')}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants}>
              <BPMAccountAssertion
                localAssertion={assertions.localAssertion}
                assertionLoading={assertions.assertionLoading}
                isAssertionDirty={assertions.isAssertionDirty}
                onAssertionChange={assertions.handleAssertionChange}
                onSave={assertions.handleSaveAssertions}
                isSaving={assertions.updateAssertionMutation.isPending}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <BpmProcessToolbar
                searchTerm={hierarchy.searchTerm}
                onSearchTermChange={hierarchy.setSearchTerm}
                departmentName={scoping.departmentName}
                onCreateProcess={() => mutations.setIsCreatingBPM(true)}
              />
              <BpmProcessWorkspace
                isMobile={isMobile}
                hierarchy={hierarchy}
                settings={scoping.settings}
                selectedGLRow={selectedGLRow}
                onOpenDiagram={handleOpenDiagram}
                onCreateDiagram={(name) => mutations.createDiagramMutation.mutate(name)}
                onOpenWorksheet={(id, name) => {
                  setSelectedBpmId(id);
                  setSelectedBpmName(name);
                  setIsModalOpen(true);
                }}
                onDeleteProcess={handleDeleteProcess}
              />
            </motion.div>
          </motion.div>
        )}

        {selectedGLRow && (
          <>
            <BPMModal
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              noGL={selectedGLRow.noGL}
              glDesc={selectedGLRow.glDesc}
              fsliName={scoping.selectedFsli}
              bpmProcessId={selectedBpmId || undefined}
              subProcessName={selectedBpmName}
              year={viewYear}
              initialTab="worksheet"
            />
            <CSAModal
              isOpen={isCsaModalOpen}
              onOpenChange={setIsCsaModalOpen}
              noGL={selectedGLRow.noGL}
              subProcessName={selectedBpmName}
              bpmProcessId={selectedBpmId || undefined}
            />
          </>
        )}

        <BPMMigrationModal
          isOpen={hierarchy.isMigrationModalOpen}
          onClose={() => hierarchy.setIsMigrationModalOpen(false)}
          selectedProcessIds={hierarchy.selectedProcessIds}
          allProcesses={hierarchy.bpmProcesses?.items || []}
          candidateParents={hierarchy.candidateParentProcesses}
          onConfirm={(payload) => mutations.batchReorganizeMutation.mutate(payload)}
          isPending={mutations.batchReorganizeMutation.isPending}
        />

        <BpmEditorDialog
          isOpen={!!selectedDiagramId}
          onClose={handleCloseDiagram}
          subProcess={currentSubProcess}
          diagramId={selectedDiagramId}
          viewYear={viewYear}
          currentGL={selectedGLRow?.noGL}
          bpmProcessId={searchParams.get('bpmProcessId') || hierarchy.selectedProcess?.id || undefined}
        />

        <CreateProcessDialog
          isOpen={mutations.isCreatingBPM}
          noGL={selectedGLRow?.noGL || ''}
          name={mutations.bpmName}
          onNameChange={mutations.setBpmName}
          code={mutations.bpmCode}
          onCodeChange={mutations.setBpmCode}
          onCancel={() => mutations.setIsCreatingBPM(false)}
          onSubmit={() =>
            mutations.createBPMMutation.mutate({
              name: mutations.bpmName,
              bpmCode: mutations.bpmCode,
              noGL: selectedGLRow?.noGL || '',
              fsliName: scoping.selectedFsli,
              year: parseInt(viewYear),
            })
          }
          isPending={mutations.createBPMMutation.isPending}
        />
      </motion.div>
    </AppLayout>
  );
}
