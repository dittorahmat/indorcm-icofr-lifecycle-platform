import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadCloud, Camera, Check, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvidenceLocationBadge } from '@/components/csa/EvidenceLocationBadge';

interface SampleEvidenceCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  safeStep: number;
  ctrl: { id: string; name: string };
  res: {
    riskName?: string;
    controlName?: string;
    evidenceUrl?: string;
    evidenceMeta?: import('@shared/types').CSAEvidenceMeta;
    implemented?: boolean;
  };
  isReadOnly: boolean;
  isPending: boolean;
  isUploading: boolean;
  isFailed: boolean;
  onCameraUpload?: (sIdx: number, cId: string) => void;
  onFileUpload: (sIdx: number, cId: string) => void;
  onRetryUpload?: () => void;
  getFileNameFromUrl: (url: string) => string;
}

export function SampleEvidenceCard({
  form,
  safeStep,
  ctrl,
  res,
  isReadOnly,
  isPending,
  isUploading,
  isFailed,
  onCameraUpload,
  onFileUpload,
  onRetryUpload,
  getFileNameFromUrl,
}: SampleEvidenceCardProps) {
  const { t } = useTranslation();
  return (
    <div data-testid={`sample-evidence-${safeStep}-${ctrl.id}`} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{res.riskName || 'N/A'}</p>
          <p className="text-xs font-bold text-slate-800">{res.controlName || ctrl.name}</p>
          <Badge variant="outline" className="w-fit text-xs h-5 font-mono">{ctrl.id}</Badge>
        </div>
        <div className={cn('h-3 w-3 rounded-full shrink-0 mt-1', res.implemented ? 'bg-emerald-500' : 'bg-red-500')} />
      </div>

      <div className="flex items-center gap-2">
        {!isReadOnly && onCameraUpload && (
          <Button
            type="button"
            variant={res.evidenceUrl ? 'secondary' : 'outline'}
            onClick={() => onCameraUpload(safeStep, ctrl.id)}
            disabled={isPending}
            className="flex-1 min-h-[44px] text-xs font-bold gap-2"
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : res.evidenceUrl ? (
              <Check className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {t('csa_hub:form.mobile.takePhoto', { defaultValue: 'Take photo' })}
          </Button>
        )}
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onFileUpload(safeStep, ctrl.id)}
            disabled={isPending}
            aria-label={t('csa_hub:form.mobile.uploadFile', { defaultValue: 'Upload file' })}
            className="min-h-[44px] min-w-[44px] shrink-0"
          >
            <UploadCloud className="h-4 w-4" />
          </Button>
        )}
        {res.evidenceUrl && (
          <Button
            type="button"
            variant="default"
            onClick={() => window.open(res.evidenceUrl, '_blank')}
            aria-label={t('csa_hub:form.mobile.viewEvidence', { defaultValue: 'View evidence' })}
            className="min-h-[44px] min-w-[44px] shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {res.evidenceUrl && (
        <div className="space-y-1.5">
          <div className="truncate text-xs text-emerald-700 font-bold uppercase tracking-tighter" title={getFileNameFromUrl(res.evidenceUrl)}>
            {getFileNameFromUrl(res.evidenceUrl) || t('csa_hub:form.mobile.attached', { defaultValue: 'Attached' })}
          </div>
          <EvidenceLocationBadge meta={res.evidenceMeta} />
        </div>
      )}

      {isFailed && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-red-700">
            {t('csa_hub:form.mobile.uploadFailed', { defaultValue: 'Upload failed' })}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onRetryUpload}
            className="min-h-[44px] text-xs font-bold border-red-200 text-red-700 shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {t('csa_hub:form.mobile.retry', { defaultValue: 'Retry' })}
          </Button>
        </div>
      )}

      <FormField
        control={form.control}
        name={`samples.${safeStep}.controlResults.${ctrl.id}.comment`}
        render={({ field: f }) => (
          <FormItem>
            <FormControl>
              <Input {...f} disabled={isReadOnly} className="min-h-[44px] text-base md:text-sm bg-white" placeholder={t('common:placeholders.notes')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`samples.${safeStep}.controlResults.${ctrl.id}.implemented`}
        render={({ field: f }) => (
          <FormItem>
            <FormControl>
              <label
                htmlFor={`mobile-step-${safeStep}-${ctrl.id}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border p-3 min-h-[52px] cursor-pointer flex-wrap min-w-0',
                  f.value ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-black uppercase tracking-wider min-w-0 truncate flex-1',
                    f.value ? 'text-emerald-700' : 'text-slate-500',
                  )}
                >
                  {f.value ? t('csa_hub:form.passed', { defaultValue: 'PASSED' }) : t('csa_hub:form.deficiency', { defaultValue: 'DEFICIENCY' })}
                </span>
                <Checkbox
                  id={`mobile-step-${safeStep}-${ctrl.id}`}
                  checked={f.value}
                  onCheckedChange={f.onChange}
                  disabled={isReadOnly}
                  className={cn('h-7 w-7', f.value ? 'text-green-600 border-green-600' : 'text-slate-300')}
                />
              </label>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
