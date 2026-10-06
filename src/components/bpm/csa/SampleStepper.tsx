import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import type { CSAFormValues } from '@/hooks/use-csa';
import { ChevronLeft, ChevronRight, LayoutDashboard, Plus } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SampleEvidenceCard } from './SampleEvidenceCard';
import type { ControlOption, SampleEntry, SampleFieldEntry } from './csa-form-types';

interface SampleStepperProps {
  form: UseFormReturn<CSAFormValues>;
  isReadOnly: boolean;
  isPending: boolean;
  activeControls: ControlOption[];
  watchSamples: SampleEntry[];
  fields: SampleFieldEntry[];
  safeStep: number;
  failedUploadRow?: { sIdx: number; cId: string } | null;
  activeUploadRow: { sIdx: number; cId: string } | null;
  onStepChange: (step: number) => void;
  onAddSample: () => void;
  onFileUpload: (sIdx: number, cId: string) => void;
  onCameraUpload?: (sIdx: number, cId: string) => void;
  onRetryUpload?: () => void;
  getFileNameFromUrl: (url: string) => string;
}

export function SampleStepper({
  form,
  isReadOnly,
  isPending,
  activeControls,
  watchSamples,
  fields,
  safeStep,
  failedUploadRow,
  activeUploadRow,
  onStepChange,
  onAddSample,
  onFileUpload,
  onCameraUpload,
  onRetryUpload,
  getFileNameFromUrl,
}: SampleStepperProps) {
  const { t } = useTranslation();
  const stepCount = fields.length;
  const activeStepSample = watchSamples[safeStep];

  return (
    <div className="md:hidden space-y-4" data-testid="csa-sample-stepper">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
          <LayoutDashboard className="h-3.5 w-3.5" /> {t('csa_hub:form.summaryTitle')}
        </h4>
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold shrink-0">
          {t('csa_hub:form.mobile.sampleOf', {
            current: stepCount === 0 ? 0 : safeStep + 1,
            total: stepCount,
            defaultValue: `Sample ${stepCount === 0 ? 0 : safeStep + 1} of ${stepCount}`,
          })}
        </Badge>
      </div>

      {stepCount === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-3">
          <p className="text-xs font-medium text-slate-500">
            {t('csa_hub:form.mobile.noSamples', { defaultValue: 'No samples yet. Add a sample to start field assessment.' })}
          </p>
          {!isReadOnly && (
            <Button type="button" onClick={onAddSample} className="min-h-[44px] text-xs font-bold gap-2">
              <Plus className="h-4 w-4" /> {t('csa_hub:form.addManualSample')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onStepChange(safeStep - 1)}
              disabled={safeStep === 0}
              aria-label={t('csa_hub:form.mobile.prev', { defaultValue: 'Back' }) as string}
              className="min-h-[44px] min-w-[44px] shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={String(safeStep)} onValueChange={(v) => onStepChange(Number(v))} disabled={isReadOnly && false}>
              <SelectTrigger className="flex-1 min-h-[44px] text-xs font-bold bg-white" aria-label={t('csa_hub:form.mobile.jumpTo', { defaultValue: 'Jump to sample' }) as string}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field, idx) => (
                  <SelectItem key={field.id} value={String(idx)} className="text-xs font-bold">
                    {watchSamples[idx]?.sampleRef || t('csa_hub:form.emptyReference')} ({idx + 1}/{stepCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => onStepChange(safeStep + 1)}
              disabled={safeStep >= stepCount - 1}
              aria-label={t('csa_hub:form.mobile.next', { defaultValue: 'Next' }) as string}
              className="min-h-[44px] min-w-[44px] shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <FormField
            control={form.control}
            name={`samples.${safeStep}.sampleRef`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.sampleReference')}</FormLabel>
                <FormControl>
                  <Input
                    {...f}
                    value={(f.value as string) ?? ''}
                    disabled={isReadOnly}
                    className="min-h-[44px] text-xs font-bold bg-white"
                    placeholder={t('csa_hub:form.typeReference') as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {activeControls.map((ctrl) => {
            const res = activeStepSample?.controlResults?.[ctrl.id] ?? {};
            const isUploading = isPending && activeUploadRow?.sIdx === safeStep && activeUploadRow?.cId === ctrl.id;
            const isFailed = failedUploadRow?.sIdx === safeStep && failedUploadRow?.cId === ctrl.id;
            return (
              <SampleEvidenceCard
                key={ctrl.id}
                form={form}
                safeStep={safeStep}
                ctrl={ctrl}
                res={res}
                isReadOnly={isReadOnly}
                isPending={isPending}
                isUploading={isUploading}
                isFailed={isFailed}
                onCameraUpload={onCameraUpload}
                onFileUpload={onFileUpload}
                onRetryUpload={onRetryUpload}
                getFileNameFromUrl={getFileNameFromUrl}
              />
            );
          })}

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-xs font-black uppercase tracking-wider">
              {Object.values(activeStepSample?.controlResults ?? {}).filter((r) => r.implemented).length}{' '}
              {t('csa_hub:form.passed', { defaultValue: 'PASSED' })}
            </Badge>
            <Badge className="bg-red-600 text-xs font-black uppercase tracking-wider">
              {Object.values(activeStepSample?.controlResults ?? {}).filter((r) => !r.implemented).length}{' '}
              {t('csa_hub:form.deficiency', { defaultValue: 'DEFICIENCY' })}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}
