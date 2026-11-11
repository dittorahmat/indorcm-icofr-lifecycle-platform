import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Upload, CheckSquare, Printer, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RCMExplorerHeaderBanner } from './RCMExplorerHeaderBanner';
import { RCMCycleAndMetrics } from './RCMCycleAndMetrics';
import { RCMExplorerToolbar } from './RCMExplorerToolbar';
import { RCMKeyControlTable } from './RCMKeyControlTable';
import { RCMControlDetailModal } from './RCMControlDetailModal';
import { useRCMExplorer, type RCMMatrixItem } from './useRCMExplorer';
import { exportRCMToExcel, getDefaultRcmSignoffs } from '@/lib/rcm-excel-export';
import { toast } from 'sonner';

interface RCMKeyControlExplorerProps {
  workingYear: string;
}

export function RCMKeyControlExplorer({ workingYear }: RCMKeyControlExplorerProps) {
  const { t } = useTranslation('rcm');
  const navigate = useNavigate();

  const {
    filteredItems,
    isLoading,
    searchTerm,
    setSearchTerm,
    activeCluster,
    setActiveCluster,
    selectedCycle,
    setSelectedCycle,
    selectedPillar,
    setSelectedPillar,
    riskLevelFilter,
    setRiskLevelFilter,
    keyControlFilter,
    setKeyControlFilter,
    frequencyFilter,
    setFrequencyFilter,
    handleResetFilters,
    totalControls,
    keyControlsCount,
    totalRisks,
    preventiveCount,
    detectiveCount,
    automatedCount,
    manualCount,
  } = useRCMExplorer(workingYear);

  const [selectedDetailItem, setSelectedDetailItem] = React.useState<RCMMatrixItem | null>(null);

  const handleExport = () => {
    try {
      exportRCMToExcel(filteredItems, {
        matrixType: 'TLC',
        filename: `RCM_Key_Controls_${workingYear}.xlsx`,
        signoffs: getDefaultRcmSignoffs('TLC'),
      });
      toast.success(t('actions.export_success', { defaultValue: 'File Excel berhasil diunduh' }));
    } catch {
      toast.error('Gagal mengekspor data Excel');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {t('sidebar:groups.cluster3_risk_control', { defaultValue: 'Tata Kelola & Ruang Lingkup' })}
          </span>
          <span className="text-xs text-slate-300">/</span>
          <span className="text-xs font-bold text-secondary">
            {t('explorer.banner.title', { defaultValue: 'Key Control Explorer' })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => navigate('/rcm/tlc')}
            className="h-9 px-3 gap-1.5 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-xs"
          >
            <Layers className="h-4 w-4" />
            <span>{t('matrix.open_matrix_tlc', { defaultValue: 'Buka Matriks TLC Lengkap' })}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            className="h-9 px-3 gap-1.5 bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-bold border-slate-200"
          >
            <Printer className="h-4 w-4" />
            <span>{t('actions.export_excel', { defaultValue: 'Cetak / Export Excel' })}</span>
          </Button>
        </div>
      </div>

      {/* Sovereign Header Banner with BUMN Clusters */}
      <RCMExplorerHeaderBanner
        workingYear={workingYear}
        activeCluster={activeCluster}
        onSelectCluster={setActiveCluster}
        totalKeyControls={keyControlsCount}
        totalControls={totalControls}
      />

      {/* Business Cycle & Composition Metrics */}
      <RCMCycleAndMetrics
        selectedCycle={selectedCycle}
        onSelectCycle={setSelectedCycle}
        totalRisks={totalRisks}
        totalControls={totalControls}
        keyControlsCount={keyControlsCount}
        preventiveCount={preventiveCount}
        detectiveCount={detectiveCount}
        automatedCount={automatedCount}
        manualCount={manualCount}
      />

      {/* Toolbar with Search, Filters, and 6 Mitigation Pillars */}
      <RCMExplorerToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPillar={selectedPillar}
        onSelectPillar={setSelectedPillar}
        riskLevelFilter={riskLevelFilter}
        onRiskLevelChange={setRiskLevelFilter}
        keyControlFilter={keyControlFilter}
        onKeyControlChange={setKeyControlFilter}
        frequencyFilter={frequencyFilter}
        onFrequencyChange={setFrequencyFilter}
        onResetFilters={handleResetFilters}
      />

      {/* Responsive Key Control Table */}
      <RCMKeyControlTable
        items={filteredItems}
        isLoading={isLoading}
        onViewDetail={setSelectedDetailItem}
      />

      {/* Detail Audit Trail & 6 Pillars Modal */}
      <RCMControlDetailModal
        item={selectedDetailItem}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
      />
    </div>
  );
}
