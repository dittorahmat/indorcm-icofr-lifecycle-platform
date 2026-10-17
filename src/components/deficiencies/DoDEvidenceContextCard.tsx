import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Layers, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, ExternalLink, Scale } from 'lucide-react';
import type { DoDEvidenceContext } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { formatIDR } from '@/components/reports/dod/dod-format';

interface DoDEvidenceContextCardProps {
  evidenceContext: DoDEvidenceContext;
  exposureValue: number;
  onSelectCompensatingControl?: (controlId: string) => void;
  selectedCompensatingId?: string;
}

export function DoDEvidenceContextCard({
  evidenceContext,
  exposureValue,
  onSelectCompensatingControl,
  selectedCompensatingId,
}: DoDEvidenceContextCardProps) {
  const { t } = useTranslation('deficiency');
  const { testRecord, materiality, compensatingControls, redFlags } = evidenceContext;

  const isAbovePM = materiality ? exposureValue >= materiality.pmThreshold : false;
  const pmVal = materiality?.pmThreshold || 0;
  const omVal = materiality?.omThreshold || 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Testing Evidence Card (Box 2 / Likelihood Context) */}
        <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              {t('worksheet.evidence.testingTitle')}
            </span>
            <Badge variant="outline" className="text-xs font-mono font-medium rounded-md">
              {testRecord?.testType || 'TOE'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/30 p-2 rounded-md border border-border">
              <span className="text-muted-foreground block text-xs">{t('worksheet.evidence.sampleFailures')}</span>
              <span className="font-bold text-rose-600 text-sm">
                {testRecord?.failedSampleCount || 0} / {testRecord?.sampleCount || 0}
              </span>
            </div>
            <div className="bg-muted/30 p-2 rounded-md border border-border">
              <span className="text-muted-foreground block text-xs">{t('worksheet.evidence.exceptionRate')}</span>
              <span className="font-bold text-foreground text-sm">
                {testRecord?.exceptionRate || 0}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border flex-wrap gap-2">
            <span>{t('worksheet.evidence.workpaperRef')}:</span>
            <span className="font-mono font-medium text-foreground flex items-center gap-1">
              {testRecord?.workpaperRef}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </span>
          </div>
        </div>

        {/* 2. Materiality & Exposure Card (Box 3 / Magnitude Context) */}
        <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-primary" />
              {t('worksheet.evidence.materialityTitle')}
            </span>
            <Badge
              variant={isAbovePM ? 'destructive' : 'secondary'}
              className="text-xs font-semibold uppercase tracking-wider rounded-md"
            >
              {isAbovePM ? t('worksheet.evidence.exposureAbove') : t('worksheet.evidence.exposureBelow')}
            </Badge>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-muted-foreground">{t('worksheet.evidence.pmLabel')}:</span>
              <span className="font-mono font-bold text-foreground">
                {formatIDR(pmVal)}
              </span>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-muted-foreground">{t('worksheet.evidence.omLabel')}:</span>
              <span className="font-mono font-medium text-muted-foreground">
                {formatIDR(omVal)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border flex-wrap gap-2">
              <span className="text-muted-foreground">{t('worksheet.evidence.exposureRatio')}:</span>
              <span className={`font-mono font-bold ${isAbovePM ? 'text-rose-600' : 'text-emerald-600'}`}>
                {pmVal > 0 ? ((exposureValue / pmVal) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Compensating Controls Picker (Box 5 Context) */}
      <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t('worksheet.evidence.compensatingTitle')}
          </span>
          <span className="text-xs text-muted-foreground">
            {compensatingControls?.length || 0} kontrol sekunder terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {compensatingControls && compensatingControls.length > 0 ? (
            compensatingControls.map((c) => {
              const isSelected = selectedCompensatingId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCompensatingControl && onSelectCompensatingControl(c.id)}
                  className={`p-2.5 rounded-md border text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 flex-wrap min-w-0 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-mono font-semibold text-foreground">{c.code}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {c.nature}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-snug line-clamp-1">{c.name}</p>
                    <span className="text-xs text-muted-foreground block">
                      Presisi: <strong className="text-foreground">{c.precision}</strong>
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {c.status === 'Effective' ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Efektif
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-600 flex items-center gap-0.5">
                        <XCircle className="h-3.5 w-3.5" /> Inefektif
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground col-span-2">
              {t('worksheet.evidence.compensatingNone')}
            </p>
          )}
        </div>
      </div>

      {/* 4. Hard Red-Flags Checklist (Box 6 / Material Weakness Indicators) */}
      {redFlags && (
        <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {t('worksheet.evidence.redFlagsTitle')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${redFlags.seniorManagementFraud ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <span className="text-foreground">{t('worksheet.evidence.fraudSenior')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${redFlags.materialFraudImpact ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <span className="text-foreground">{t('worksheet.evidence.fraudMaterial')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${redFlags.restatement ? 'bg-rose-500' : 'bg-slate-300'}`} />
              <span className="text-foreground">{t('worksheet.evidence.restatement')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
