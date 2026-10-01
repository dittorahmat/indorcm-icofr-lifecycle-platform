import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, ShieldAlert, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { Deficiency } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface DoDHeaderSummaryProps {
  deficiency: Deficiency;
  exposureValue: number;
  ineffectivePeriod: string;
  isRemediated: boolean;
  selectedAssertions: string[];
  cosoComponent: string;
  onToggleAssertion: (assertion: string) => void;
  onPeriodChange: (val: string) => void;
  onRemediatedChange: (val: boolean) => void;
}

const ALL_ASSERTIONS = [
  "Completeness",
  "Accuracy",
  "Existence/Occurrence",
  "Cut-off",
  "Rights & Obligations",
  "Valuation/Allocation",
  "Presentation & Disclosure",
];

export function DoDHeaderSummary({
  deficiency,
  exposureValue,
  ineffectivePeriod,
  isRemediated,
  selectedAssertions,
  cosoComponent,
  onToggleAssertion,
  onPeriodChange,
  onRemediatedChange,
}: DoDHeaderSummaryProps) {
  const { t } = useTranslation('deficiency');

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                {t('worksheet.header.deficiencyRef')}:
              </span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {deficiency.id}
              </span>
              <Badge variant="outline" className="text-xs font-medium rounded-md">
                {deficiency.source || 'Lini 3 - Audit'}
              </Badge>
            </div>
            <h3 className="font-bold text-sm text-foreground mt-0.5">
              {deficiency.controlName || deficiency.controlCode || 'Defisiensi Pengendalian'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-md border border-border">
            <span className="text-muted-foreground">{t('worksheet.header.exposureValue')}:</span>
            <span className="font-mono font-bold text-foreground">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(exposureValue)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground block">
            {t('worksheet.header.remediated')}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRemediatedChange(false)}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium border text-xs transition-colors flex items-center justify-center gap-1.5 ${
                !isRemediated
                  ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted/20'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {t('worksheet.header.remediatedNo')}
            </button>
            <button
              type="button"
              onClick={() => onRemediatedChange(true)}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium border text-xs transition-colors flex items-center justify-center gap-1.5 ${
                isRemediated
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted/20'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('worksheet.header.remediatedYes')}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="period-input" className="text-xs font-semibold uppercase text-muted-foreground block">
            {t('worksheet.header.ineffectivePeriod')}
          </label>
          <div className="flex items-center gap-1.5 border border-input rounded-md px-2.5 py-1.5 bg-background">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              id="period-input"
              type="text"
              value={ineffectivePeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              placeholder="e.g. Q2 - Q4 (9 Bulan)"
              className="text-xs bg-transparent border-none outline-none w-full text-foreground font-medium"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground block">
            {t('worksheet.header.cosoComponent')}
          </label>
          <div className="border border-border rounded-md px-2.5 py-1.5 bg-muted/20 text-xs font-medium text-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{cosoComponent}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border pt-3">
        <label className="text-xs font-semibold uppercase text-muted-foreground block">
          {t('worksheet.header.assertions')} (Lampiran 10 Kolom xi - xvii)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ASSERTIONS.map((assertion) => {
            const isSelected = selectedAssertions.includes(assertion);
            return (
              <button
                type="button"
                key={assertion}
                onClick={() => onToggleAssertion(assertion)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/30'
                }`}
              >
                {assertion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
