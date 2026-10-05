import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, Send, UserCheck } from 'lucide-react';
import type { DeficiencySeverity } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface DoDConclusionFooterProps {
  computedSeverity: DeficiencySeverity;
  governanceRouting: string[];
  isSubmittable: boolean;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function DoDConclusionFooter({
  computedSeverity,
  governanceRouting,
  isSubmittable,
  onSave,
  onCancel,
  isSaving,
}: DoDConclusionFooterProps) {
  const { t } = useTranslation('deficiency');

  const getSeverityBadge = () => {
    switch (computedSeverity) {
      case 'Material Weakness':
        return (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 px-3 py-1.5 rounded-md">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm block tracking-wide uppercase">
                {computedSeverity}
              </span>
              <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                Kelemahan Material berdampak langsung pada Opini Audit Laporan Keuangan
              </span>
            </div>
          </div>
        );
      case 'Significant Deficiency':
        return (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm block tracking-wide uppercase">
                {computedSeverity}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Defisiensi Signifikan wajib dilaporkan ke Komite Audit dan Dewan Komisaris
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-md">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm block tracking-wide uppercase">
                {computedSeverity}
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Defisiensi Pengendalian operasional, tindak lanjut oleh Process Owner
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap min-w-0 border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            {t('worksheet.conclusion.computedSeverity')}
          </span>
          {getSeverityBadge()}
        </div>

        {/* Governance Distribution Badge (Table 24) */}
        <div className="space-y-1.5 md:text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            {t('worksheet.conclusion.governanceTitle')}
          </span>
          <div className="flex flex-wrap gap-1.5 md:justify-end">
            {governanceRouting.map((stakeholder, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border-border bg-muted/30 text-foreground"
              >
                {stakeholder}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserCheck className="h-4 w-4 text-primary" />
          <span>{t('worksheet.conclusion.signOff')}</span>
          <span className="font-mono text-xs">({new Date().toLocaleDateString('id-ID')})</span>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 sm:flex-none h-11 sm:h-10 min-h-[44px] sm:min-h-0 text-xs font-semibold rounded-md border-border justify-center"
          >
            {t('worksheet.conclusion.cancelButton')}
          </Button>
          <Button
            type="button"
            disabled={!isSubmittable || isSaving}
            onClick={onSave}
            className="flex-1 sm:flex-none h-11 sm:h-10 min-h-[44px] sm:min-h-0 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 justify-center"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {t('worksheet.conclusion.saveButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
