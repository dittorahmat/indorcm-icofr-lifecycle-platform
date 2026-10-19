import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertCircle, AlertTriangle, Info, Send, UserCheck } from 'lucide-react';
import type { DeficiencySeverity } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SEVERITY_PANEL_CLASS, severityLabelKey, severityTone, type SeverityTone } from '@/lib/badge-tone';

interface DoDConclusionFooterProps {
  computedSeverity: DeficiencySeverity;
  governanceRouting: string[];
  isSubmittable: boolean;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

/** The icon is this surface's own choice; the tone decides which one it gets. */
const SEVERITY_ICON: Record<SeverityTone, typeof AlertCircle> = {
  mw: AlertCircle,
  sd: AlertTriangle,
  cd: Info,
};

/** What each severity means for the audit opinion — keys, the bundle owns the prose. */
const SEVERITY_IMPACT_KEY: Record<SeverityTone, string> = {
  mw: 'worksheet.conclusion.impact.mw',
  sd: 'worksheet.conclusion.impact.sd',
  cd: 'worksheet.conclusion.impact.cd',
};

export function DoDConclusionFooter({
  computedSeverity,
  governanceRouting,
  isSubmittable,
  onSave,
  onCancel,
  isSaving,
}: DoDConclusionFooterProps) {
  const { t } = useTranslation(['deficiency', 'reports']);
  // Label, prose and tone all come from the one vocabulary owner: this footer
  // used to carry a third copy of the panel classes, the raw English severity
  // string as its headline, and two hardcoded Indonesian sentences.
  const tone = severityTone(computedSeverity);
  const SeverityIcon = SEVERITY_ICON[tone];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap min-w-0 border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            {t('worksheet.conclusion.computedSeverity')}
          </span>
          <div className={cn('flex items-center gap-2 border px-3 py-1.5 rounded-md', SEVERITY_PANEL_CLASS[tone])}>
            <SeverityIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <span className="font-extrabold text-sm block tracking-wide uppercase">
                {t(severityLabelKey(computedSeverity), { ns: 'reports' })}
              </span>
              <span className="text-xs font-medium">
                {t(SEVERITY_IMPACT_KEY[tone])}
              </span>
            </div>
          </div>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3 pt-1 min-w-0 max-w-full">
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
