import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useEffect } from 'react';
import { toast } from 'sonner';

export const csaFormSchema = z.object({
  period: z.string().min(1, "Period is required"),
  result: z.enum(['Effective', 'Ineffective', 'No Transaction']),
  comments: z.string().optional(),
  testProcedure: z.string().optional(),
  archiveLocation: z.string().optional(),
  samplingMethodology: z.string().optional(),
  documentList: z.string().optional(),
  isBpmConfirmed: z.boolean(),
  samples: z.array(z.object({
    sampleRef: z.string().optional(),
    glRowId: z.string().optional(),
    controlResults: z.record(z.string(), z.any())
  }))
});

export type CSAFormValues = z.infer<typeof csaFormSchema>;

export function useCSAForm() {
  const defaultYear = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('year') || new Date().getFullYear().toString()
    : new Date().getFullYear().toString();

  const form = useForm<CSAFormValues>({
    resolver: zodResolver(csaFormSchema),
    defaultValues: {
      period: `${defaultYear}-Q1`,
      result: 'Effective',
      comments: '',
      testProcedure: '',
      archiveLocation: '',
      samplingMethodology: 'Attribute Sampling / Zero Tolerance Approach',
      documentList: 'Invoice, Evidence of Approval, GL Posting',
      isBpmConfirmed: false,
      samples: []
    }
  });

  const { fields, replace: replaceSamples, append } = useFieldArray({
    control: form.control,
    name: "samples"
  });

  const watchSamplesRaw = useWatch({
    control: form.control,
    name: "samples"
  });
  
  const watchSamples = useMemo(() => watchSamplesRaw || [], [watchSamplesRaw]);

  const anyPointFailed = useMemo(() => 
    watchSamples.some(s => Object.values(s.controlResults).some((r: any) => !r.implemented)),
    [watchSamples]
  );

  useEffect(() => {
    if (anyPointFailed && form.getValues('result') === 'Effective') {
      form.setValue('result', 'Ineffective');
      toast.warning("Zero Tolerance: Status diset ke Ineffective karena ada kontrol yang gagal.");
    }
  }, [anyPointFailed, form]);

  return {
    form,
    fields,
    replaceSamples,
    append,
    watchSamples,
    anyPointFailed
  };
}
