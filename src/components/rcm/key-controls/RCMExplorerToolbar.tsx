import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MITIGATION_PILLARS, type MitigationPillar } from './rcm-explorer-types';

interface RCMExplorerToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPillar: MitigationPillar;
  onSelectPillar: (pillar: MitigationPillar) => void;
  riskLevelFilter: string;
  onRiskLevelChange: (level: string) => void;
  keyControlFilter: string;
  onKeyControlChange: (filter: string) => void;
  frequencyFilter: string;
  onFrequencyChange: (freq: string) => void;
  onResetFilters: () => void;
}

export function RCMExplorerToolbar({
  searchTerm,
  onSearchChange,
  selectedPillar,
  onSelectPillar,
  riskLevelFilter,
  onRiskLevelChange,
  keyControlFilter,
  onKeyControlChange,
  frequencyFilter,
  onFrequencyChange,
  onResetFilters,
}: RCMExplorerToolbarProps) {
  const { t } = useTranslation('rcm');

  return (
    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      {/* Search and Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('explorer.toolbar.searchPlaceholder', {
              defaultValue: 'Cari Kode Risiko, Kontrol ID, PIC, atau Aplikasi...',
            })}
            className="pl-9 h-10 text-xs sm:text-sm bg-surface-container-low border-slate-200"
          />
        </div>

        <div className="md:col-span-8 flex flex-wrap items-center justify-start md:justify-end gap-2">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
              {t('explorer.toolbar.significance', { defaultValue: 'Signifikansi:' })}
            </label>
            <select
              value={riskLevelFilter}
              onChange={(e) => onRiskLevelChange(e.target.value)}
              className="h-9 px-2 bg-surface-container-low border border-slate-200 rounded-md text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">{t('explorer.toolbar.allLevels', { defaultValue: 'Semua Level' })}</option>
              <option value="High">{t('explorer.toolbar.highRisk', { defaultValue: 'Tinggi (High)' })}</option>
              <option value="Medium">{t('explorer.toolbar.mediumRisk', { defaultValue: 'Sedang (Medium)' })}</option>
              <option value="Low">{t('explorer.toolbar.lowRisk', { defaultValue: 'Rendah (Low)' })}</option>
            </select>
          </div>

          {/* Key Control Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
              {t('explorer.toolbar.priority', { defaultValue: 'Prioritas:' })}
            </label>
            <select
              value={keyControlFilter}
              onChange={(e) => onKeyControlChange(e.target.value)}
              className="h-9 px-2 bg-surface-container-low border border-slate-200 rounded-md text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">{t('explorer.toolbar.allTypes', { defaultValue: 'Semua Tipe' })}</option>
              <option value="KEY">{t('explorer.toolbar.keyOnly', { defaultValue: 'Key Control Saja' })}</option>
              <option value="NONKEY">{t('explorer.toolbar.nonKeyOnly', { defaultValue: 'Non-Key Control' })}</option>
            </select>
          </div>

          {/* Frequency Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
              {t('explorer.toolbar.frequency', { defaultValue: 'Frekuensi:' })}
            </label>
            <select
              value={frequencyFilter}
              onChange={(e) => onFrequencyChange(e.target.value)}
              className="h-9 px-2 bg-surface-container-low border border-slate-200 rounded-md text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">{t('explorer.toolbar.allFreq', { defaultValue: 'Semua Frekuensi' })}</option>
              <option value="Transactional">{t('explorer.toolbar.transactional', { defaultValue: 'Tiap Transaksi' })}</option>
              <option value="Daily">{t('explorer.toolbar.daily', { defaultValue: 'Harian' })}</option>
              <option value="Monthly">{t('explorer.toolbar.monthly', { defaultValue: 'Bulanan' })}</option>
              <option value="Quarterly">{t('explorer.toolbar.quarterly', { defaultValue: 'Triwulanan' })}</option>
              <option value="Annual">{t('explorer.toolbar.annual', { defaultValue: 'Tahunan' })}</option>
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 text-xs text-on-surface-variant hover:text-on-surface gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t('actions.refresh', { defaultValue: 'Reset' })}</span>
          </Button>
        </div>
      </div>

      {/* 6 Mitigation Pillar Selectors (Lampiran 8 SK-5) */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <Filter className="h-3.5 w-3.5 text-secondary shrink-0" />
          <span>{t('explorer.pillars.filterLabel', { defaultValue: 'Filter 6 Pilar Mitigasi (TOD):' })}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full touch-pan-x overscroll-x-contain py-1 scrollbar-none">
          {MITIGATION_PILLARS.map((pilar) => {
            const isSelected = selectedPillar === pilar.id;
            return (
              <button
                key={pilar.id}
                type="button"
                onClick={() => onSelectPillar(pilar.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                {t(pilar.labelKey, { defaultValue: pilar.defaultLabel })}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
