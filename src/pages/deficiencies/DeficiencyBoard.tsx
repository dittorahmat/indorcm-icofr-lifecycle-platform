import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { DoDWorksheetDialog } from '@/components/deficiencies/DoDWorksheetDialog';
import { RemediationForm } from '@/components/deficiencies/RemediationForm';
import { BoardKanban } from './board/BoardKanban';
import { BoardToolbar } from './board/BoardToolbar';
import { containerVariants, itemVariants } from './board/board-constants';
import { useDeficiencyBoard } from './board/useDeficiencyBoard';
import { DeficiencyHeaderBanner } from '@/components/deficiencies/workbench/DeficiencyHeaderBanner';
import { SeverityMatrixCards } from '@/components/deficiencies/workbench/SeverityMatrixCards';
import { CAPTrackingTable } from '@/components/deficiencies/workbench/CAPTrackingTable';

export function DeficiencyBoard() {
  const { t } = useTranslation(['deficiency', 'workflow', 'common', 'reports']);
  const board = useDeficiencyBoard(t);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'table'>('kanban');
  const [severityFilter, setSeverityFilter] = React.useState<string | undefined>(undefined);

  // Compute severity counts from filteredDeficiencies or full dataset
  const mwCount = board.filteredDeficiencies.filter((d) => d.severity === 'Material Weakness').length;
  const sdCount = board.filteredDeficiencies.filter((d) => d.severity === 'Significant Deficiency').length;
  const cdCount = board.filteredDeficiencies.filter((d) => d.severity === 'Control Deficiency').length;
  const remediationInProgress = board.actionPlans.filter(
    (p) => p.workflowStatus === 'Ineffective' || p.workflowStatus === 'In Review'
  ).length;

  // Items filtered by severity card click if active
  const displayedDeficiencies = severityFilter
    ? board.filteredDeficiencies.filter((d) => d.severity === severityFilter)
    : board.filteredDeficiencies;

  const handleToggleSeverityFilter = (sev: string) => {
    setSeverityFilter((prev) => (prev === sev ? undefined : sev));
  };

  return (
    <AppLayout container>
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col h-full space-y-4 pb-10">
        {/* 1. Sovereign Governance Header Banner */}
        <motion.div variants={itemVariants}>
          <DeficiencyHeaderBanner
            totalDeficiencies={board.filteredDeficiencies.length}
            materialWeaknessCount={mwCount}
            significantDeficiencyCount={sdCount}
            controlDeficiencyCount={cdCount}
            isAggregateMode={board.isAggregateMode}
          />
        </motion.div>

        {/* 2. Severity Matrix Cards (Lampiran 10 DoD: MW, SD, CD, CAP) */}
        <motion.div variants={itemVariants}>
          <SeverityMatrixCards
            totalDeficiencies={board.filteredDeficiencies.length}
            materialWeaknessCount={mwCount}
            significantDeficiencyCount={sdCount}
            controlDeficiencyCount={cdCount}
            remediationInProgressCount={remediationInProgress}
            activeSeverityFilter={severityFilter}
            onSelectSeverity={handleToggleSeverityFilter}
          />
        </motion.div>

        {/* 3. Toolbar: Source Filter, View Mode, Export, Aggregate Mode */}
        <motion.div variants={itemVariants}>
          <BoardToolbar
            sourceFilter={board.sourceFilter}
            isAggregateMode={board.isAggregateMode}
            selectedCount={board.selectedDeficiencies.length}
            isExportingExcel={board.isExportingExcel}
            canExport={board.filteredDeficiencies.length > 0}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSourceFilter={board.setSourceFilter}
            onExport={() => void board.handleExportExcel()}
            onEnterAggregateMode={() => board.setAggregateMode(true)}
            onCancelAggregateMode={board.cancelAggregateMode}
            onEvaluateGroup={board.handleStartAggregate}
          />
        </motion.div>

        {/* 4. Main Content: Kanban Board or CAP Tracking Table */}
        {viewMode === 'kanban' ? (
          <BoardKanban
            sensors={board.sensors}
            isLoading={board.isLoading}
            filteredDeficiencies={displayedDeficiencies}
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
        ) : (
          <CAPTrackingTable
            deficiencies={displayedDeficiencies}
            actionPlans={board.actionPlans}
            onAssess={board.handleAssess}
            onEditPlan={board.handleEditPlan}
            onStatusChange={board.handleStatusChange}
            role={board.userRole}
          />
        )}
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
