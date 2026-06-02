import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Control, Application } from '@shared/types';
import { 
  UploadCloud, ShieldCheck, Loader2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { QualitativeRiskWizard } from './QualitativeRiskWizard';
import { 
  RiskAssessmentSection, 
  RegulatoryMappingSection, 
  ITGCMetadataSection, 
  MRCParametersSection 
} from './ControlEditorSections';
import { ControlEditorGeneralSection } from './ControlEditorGeneralSection';

const controlSchema = z.object({
  level: z.enum(['ELC', 'TLC', 'ITGC']),
  code: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['Preventive', 'Detective']),
  nature: z.enum(['Manual', 'Automated', 'ITDM - IPE', 'ITDM - EUC', 'MRC']),
  automatedSubNature: z.enum(["Automated Control", "Automated Calculation", "Restricted Access", "Interface"]).optional(),
  itApplication: z.string().optional(),
  frequency: z.enum(["Annual", "Semi-Annual", "Quarterly", "Monthly", "Weekly", "Daily", "Ad-hoc"]),
  riskQuantitative: z.enum(['High', 'Medium', 'Low']),
  riskQualitative: z.enum(['High', 'Medium', 'Low']),
  assertions: z.array(z.string()).optional(),
  ipos: z.array(z.string()).optional(),
  cosoPrinciples: z.array(z.number()).min(1, 'At least one COSO principle is required'),
  relatedControlIds: z.array(z.string()).optional(),
  attachmentUrl: z.string().optional(),
  itgcDomain: z.string().optional(),
  cobitId: z.string().optional(),
  isFraudRelated: z.boolean(),
  effectiveDate: z.string(),
  isKeyControl: z.boolean(),
  eucComplexity: z.enum(['Low', 'Medium', 'High']).optional(),
  ipeType: z.enum(['Standard/Custom', 'Query']).optional(),
});

type ControlFormValues = z.infer<typeof controlSchema>;

interface ControlEditorProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  control: Partial<Control> | null;
};

export function ControlEditor({ isOpen, setIsOpen, control }: ControlEditorProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications')
  });

  const form = useForm<ControlFormValues>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      level: (control?.level as any) || 'TLC',
      code: control?.code || '',
      name: control?.name || '',
      description: control?.description || '',
      type: (control?.type as any) || 'Preventive',
      nature: (control?.nature as any) || 'Manual',
      frequency: (control?.frequency as any) || 'Monthly',
      riskQuantitative: (control?.riskAssessment as any)?.quantitativeScore || 'Low',
      riskQualitative: (control?.riskAssessment as any)?.qualitativeScore || 'Low',
      assertions: control?.assertions || [],
      ipos: control?.ipos || [],
      cosoPrinciples: control?.cosoPrinciples?.map(Number) || [],
      relatedControlIds: control?.relatedControlIds || [],
      attachmentUrl: control?.attachmentUrl || '',
      itgcDomain: control?.itgcDomain || '',
      isFraudRelated: control?.isFraudRelated || false,
      effectiveDate: control?.effectiveDate ? new Date(control.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isKeyControl: control?.isKeyControl || false,
      eucComplexity: (control?.eucComplexity as any) || 'Low',
      ipeType: (control?.ipeType as any) || 'Standard/Custom',
    }
  });

  const { data: allControls } = useQuery({
    queryKey: ['controls-list-for-linkage'],
    queryFn: () => api<{ items: Control[] }>('/api/controls')
  });

  const elcPolicies = React.useMemo(() => {
    return allControls?.items.filter(c => c.level === 'ELC' && c.id !== control?.id) || [];
  }, [allControls, control?.id]);

  const [isUploading, setIsUploading] = React.useState(false);
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Mock upload for demo
      form.setValue('attachmentUrl', '/mock-policy.pdf');
      toast.success(t('common:notifications.success'));
    } finally {
      setIsUploading(false);
    }
  }, [form, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const isDirty = form.formState.isDirty;
  useUnsavedChanges(isOpen && isDirty);

  const mutation = useMutation({
    mutationFn: (data: ControlFormValues) => {
      const payload = {
        ...data,
        effectiveDate: new Date(data.effectiveDate).getTime(),
        riskAssessment: {
          quantitativeScore: data.riskQuantitative,
          qualitativeScore: data.riskQualitative
        }
      };
      const method = control?.id ? 'PUT' : 'POST';
      const url = control?.id ? `/api/controls/${control.id}` : '/api/controls';
      return api(url, { method, body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      setIsOpen(false);
      toast.success(control?.id ? t('common:notifications.updated') : t('common:notifications.created'));
    }
  });

  const nature = form.watch('nature');
  const level = form.watch('level');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open && isDirty) return; // Wait for blocker
      setIsOpen(open);
    }}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <SheetHeader>
            <SheetTitle>{control?.id ? t('common:actions.edit') : t('common:actions.add')} {t('common:icofr.tlc')}</SheetTitle>
            <SheetDescription>
              {t('matrix.subtitle_tlc')}
            </SheetDescription>
          </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-6 py-6 pb-20 text-sm">
            {/* Level & Policy */}
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 space-y-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-900 font-bold">{t('common:icofr.category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-indigo-200">
                          <SelectValue placeholder={t('common:placeholders.choose')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ELC">{t('common:icofr.elc')}</SelectItem>
                        <SelectItem value="TLC">{t('common:icofr.tlc')}</SelectItem>
                        <SelectItem value="ITGC">ITGC</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {level === 'ELC' && (
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-indigo-400 tracking-widest">{t('matrix.supporting_docs')} (PDF)</Label>
                  <div {...getRootProps()} className={cn(
                    "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer text-center",
                    isDragActive ? "border-primary bg-primary/5" : "border-indigo-200 hover:bg-white",
                    form.watch('attachmentUrl') ? "border-emerald-500 bg-emerald-50" : ""
                  )}>
                    <input {...getInputProps()} />
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                    ) : form.watch('attachmentUrl') ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4" /> {t('common:status.mapped')}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="h-6 w-6 mx-auto text-indigo-400" />
                        <p className="text-xs text-indigo-600 font-medium">{t('common:placeholders.choose')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {level === 'TLC' && (
               <FormField
                 control={form.control}
                 name="relatedControlIds"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-600" /> {t('common:icofr.policyUmbrella')} (Linked ELC)</FormLabel>
                     <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-slate-50/50">
                        {elcPolicies.map(elc => (
                          <div key={elc.id} className="flex items-center space-x-2 bg-white p-2 rounded border shadow-sm group">
                            <Checkbox id={`elc-${elc.id}`} checked={field.value?.includes(elc.id)} onCheckedChange={(checked) => {
                                const next = checked ? [...(field.value || []), elc.id] : (field.value || []).filter(id => id !== elc.id);
                                field.onChange(next);
                            }} />
                            <Label htmlFor={`elc-${elc.id}`} className="text-xs leading-tight cursor-pointer">
                              <span className="font-bold text-indigo-700">[{elc.code}]</span> {elc.name}
                            </Label>
                          </div>
                        ))}
                     </div>
                   </FormItem>
                 )}
               />
            )}

            <ControlEditorGeneralSection form={form} applicationsData={applicationsData} />

            {nature !== 'Manual' && <ITGCMetadataSection form={form} />}
            {nature === 'MRC' && <MRCParametersSection form={form} />}

            <RiskAssessmentSection form={form} wizard={<QualitativeRiskWizard onApply={(val) => form.setValue("riskQualitative", val, { shouldDirty: true })} />} />
            <RegulatoryMappingSection form={form} />

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('common:actions.cancel')}</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('common:status.pending') + '...' : (control?.id ? t('common:actions.save') : t('common:actions.add'))}
              </Button>
            </SheetFooter>
          </form>
        </Form>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
