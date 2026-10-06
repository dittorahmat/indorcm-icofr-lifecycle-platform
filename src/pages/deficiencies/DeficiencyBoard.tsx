import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { DoDWorksheetDialog } from '@/components/deficiencies/DoDWorksheetDialog';
import { RemediationForm } from '@/components/deficiencies/RemediationForm';
import { BoardKanban } from './board/BoardKanban';
import { BoardToolbar } from './board/BoardToolbar';
import { containerVariants, itemVariants } from './board/board-constants';
import { useDeficiencyBoard } from './board/useDeficiencyBoard';

export function DeficiencyBoard() {
  const { t } = useTranslation(['deficiency', 'workflow', 'common', 'reports']);
  const board = useDeficiencyBoard(t);

  return (
    <AppLayout container>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col h-full space-y-8 pb-10">
        <motion.div variants={itemVariants}>
          <BoardToolbar
            sourceFilter={board.sourceFilter}
            isAggregateMode={board.isAggregateMode}
            selectedCount={board.selectedDeficiencies.length}
            isExportingExcel={board.isExportingExcel}
            canExport={board.filteredDeficiencies.length > 0}
            onSourceFilter={board.setSourceFilter}
            onExport={() => void board.handleExportExcel()}
            onEnterAggregateMode={() => board.setAggregateMode(true)}
            onCancelAggregateMode={board.cancelAggregateMode}
            onEvaluateGroup={board.handleStartAggregate}
          />
        </motion.div>

        <BoardKanban
          sensors={board.sensors}
          isLoading={board.isLoading}
          filteredDeficiencies={board.filteredDeficiencies}
          actionPlans={board.actionPlans}
          userRole={board.userRole}
          isAggregateMode={board.isAggregateMode}
          selectedIds={board.selectedDeficiencies}
          mobileStatus={board.mobileStatus}
          dragPlan={board.dragPlan}
          dragDeficiency={board.dragDeficiency}
          onDragStart={board.handleDragStart}
          onDragEnd={board.handleDragEnd}
          onAssess={board.handleAssess}
          onEditPlan={board.handleEditPlan}
          onStatusChange={board.handleStatusChange}
          onToggleSelect={board.handleToggleSelect}
          onMobileStatus={board.setMobileStatus}
        />
      </motion.div>

      <DoDWorksheetDialog
        isOpen={board.isWizardOpen}
        setIsOpen={board.setWizardOpen}
        deficiency={board.activeDeficiency}
        onComplete={board.handleWizardComplete}
        isAggregate={board.isAggregateMode}
        performanceMateriality={board.pmValue || undefined}
      />

      <RemediationForm
        isOpen={board.isRemediationOpen}
        setIsOpen={board.setRemediationOpen}
        actionPlan={board.activePlan || undefined}
        onSubmit={(updatedPlan) => board.planMutation.mutate(updatedPlan)}
        isLoading={board.planMutation.isPending}
      />
    </AppLayout>
  );
}
