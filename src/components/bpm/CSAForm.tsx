import { useTranslation } from 'react-i18next';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useSampleStepper } from './csa/use-sample-stepper';
import { CSAFormFooter } from './csa/CSAFormFooter';
import { CSAFormHeader } from './csa/CSAFormHeader';
import { SampleMatrixTable } from './csa/SampleMatrixTable';
import { SampleStepper } from './csa/SampleStepper';
import { VerificationTable } from './csa/VerificationTable';
import type { ControlResultEntry, CSAFormProps } from './csa/csa-form-types';

export type { CSAFormProps };

export function CSAForm({
  form,
  onSubmit,
  onSaveDraft,
  onBackToList,
  onPrint,
  onFileUpload,
  onCameraUpload,
  failedUploadRow,
  onRetryUpload,
  isReadOnly,
  isAuthenticating,
  isPending,
  activeControls,
  bpmRiskControlPairs,
  watchSamples,
  fields,
  append,
  anyPointFailed,
  activeUploadRow,
  getFileNameFromUrl,
  bpmCode,
  noGL,
  bpmProcessId,
  year,
  hideLine2Actions = false,
}: CSAFormProps) {
  const { t } = useTranslation();

  // Mobile stepper state (UI-only; form state stays in useCSA).
  const stepCount = fields.length;
  const { mobileStep: safeStep, setMobileStep } = useSampleStepper(stepCount);

  const handleAddSample = () => {
    const controlResults: Record<string, ControlResultEntry> = {};
    activeControls.forEach((ctrl) => {
      const pair = bpmRiskControlPairs.find((p) => p.controlId === ctrl.id);
      controlResults[ctrl.id] = {
        implemented: false,
        riskId: pair?.riskId || '',
        riskName: pair?.riskName || ctrl.description || 'N/A',
        controlName: pair?.controlName || ctrl.name || 'N/A',
        evidenceUrl: '',
        comment: '',
      };
    });
    append({ sampleRef: '', controlResults });
    setMobileStep(stepCount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <CSAFormHeader
          form={form}
          isReadOnly={isReadOnly}
          anyPointFailed={anyPointFailed}
          bpmCode={bpmCode}
          noGL={noGL}
          bpmProcessId={bpmProcessId}
          year={year}
        />

        <SampleMatrixTable form={form} isReadOnly={isReadOnly} activeControls={activeControls} fields={fields} onAddSample={handleAddSample} />

        <SampleStepper
          form={form}
          isReadOnly={isReadOnly}
          isPending={isPending}
          activeControls={activeControls}
          watchSamples={watchSamples}
          fields={fields}
          safeStep={safeStep}
          failedUploadRow={failedUploadRow}
          activeUploadRow={activeUploadRow}
          onStepChange={setMobileStep}
          onAddSample={handleAddSample}
          onFileUpload={onFileUpload}
          onCameraUpload={onCameraUpload}
          onRetryUpload={onRetryUpload}
          getFileNameFromUrl={getFileNameFromUrl}
        />

        <VerificationTable
          form={form}
          isReadOnly={isReadOnly}
          isPending={isPending}
          watchSamples={watchSamples}
          activeUploadRow={activeUploadRow}
          onFileUpload={onFileUpload}
          getFileNameFromUrl={getFileNameFromUrl}
        />

        <div className="pt-8 border-t space-y-6">
          <FormField
            control={form.control}
            name="comments"
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.managementRationale')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...f}
                    value={(f.value as string) ?? ''}
                    disabled={isReadOnly}
                    className="min-h-[120px] text-sm shadow-sm"
                    placeholder={t('csa_hub:form.rationalePlaceholder') as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CSAFormFooter
            isReadOnly={isReadOnly}
            isPending={isPending}
            isAuthenticating={isAuthenticating}
            hasSamples={watchSamples.length > 0}
            hideLine2Actions={hideLine2Actions}
            onBackToList={onBackToList}
            onPrint={onPrint}
            onSaveDraft={onSaveDraft}
          />
        </div>
      </form>
    </Form>
  );
}
