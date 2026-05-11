import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Control, Application } from '@shared/types';
import { 
  UploadCloud, X, ShieldCheck, Loader2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { ALL_FREQUENCIES } from '@/lib/constants';
import { QualitativeRiskWizard } from './QualitativeRiskWizard';
import { 
  RiskAssessmentSection, 
  RegulatoryMappingSection, 
  ITGCMetadataSection, 
  MRCParametersSection 
} from './ControlEditorSections';

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
  const { t } = useTranslation(['risklibrary', 'common']);
  const queryClient = useQueryClient();
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);

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
      toast.success("Policy linked");
    } finally {
      setIsUploading(false);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const isDirty = form.formState.isDirty;
  const blocker = useUnsavedChanges(isOpen && isDirty);

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
      toast.success(control?.id ? "Control updated" : "Control created");
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
            <SheetTitle>{control?.id ? 'Edit Control' : 'Add Control'}</SheetTitle>
            <SheetDescription>
              Configure control properties according to SK-5/DKU.MBU/11/2024 standards.
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
                    <FormLabel className="text-indigo-900 font-bold">Control Level Hierarchy</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-indigo-200"><SelectValue placeholder="Select level" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ELC">Entity Level Control (ELC)</SelectItem>
                        <SelectItem value="TLC">Transaction Level Control (TLC)</SelectItem>
                        <SelectItem value="ITGC">General IT Control (ITGC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {level === 'ELC' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Policy Attachment (PDF)</Label>
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
                        <CheckCircle2 className="h-4 w-4" /> Policy Document Linked
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="h-6 w-6 mx-auto text-indigo-400" />
                        <p className="text-[10px] text-indigo-600 font-medium">Click or drag policy PDF here</p>
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
                     <FormLabel className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-600" /> Policy Umbrella (Linked ELC)</FormLabel>
                     <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-slate-50/50">
                        {elcPolicies.map(elc => (
                          <div key={elc.id} className="flex items-center space-x-2 bg-white p-2 rounded border shadow-sm group">
                            <Checkbox id={`elc-${elc.id}`} checked={field.value?.includes(elc.id)} onCheckedChange={(checked) => {
                                const next = checked ? [...(field.value || []), elc.id] : (field.value || []).filter(id => id !== elc.id);
                                field.onChange(next);
                            }} />
                            <Label htmlFor={`elc-${elc.id}`} className="text-[11px] leading-tight cursor-pointer">
                              <span className="font-bold text-indigo-700">[{elc.code}]</span> {elc.name}
                            </Label>
                          </div>
                        ))}
                     </div>
                   </FormItem>
                 )}
               />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Control Code</FormLabel><FormControl><Input placeholder="e.g. P2P-01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Control Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
              
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="isKeyControl" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel>Key Control (Utama)</FormLabel></div>
                </FormItem>
              )} />
              <FormField control={form.control} name="isFraudRelated" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50/30 border-red-100">
                  <FormControl><Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none"><FormLabel className="text-red-800">Fraud Risk (Kecurangan)</FormLabel></div>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Preventive">Preventive</SelectItem><SelectItem value="Detective">Detective</SelectItem></SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="nature" render={({ field }) => (
                <FormItem><FormLabel>Nature</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Automated">Otomatis</SelectItem><SelectItem value="ITDM - IPE">ITDM - IPE (Report)</SelectItem><SelectItem value="ITDM - EUC">ITDM - EUC (Spreadsheet)</SelectItem><SelectItem value="MRC">MRC (Management Review)</SelectItem></SelectContent></Select></FormItem>
              )} />
            </div>

            {(nature === 'Automated' || nature === 'ITDM - IPE' || nature === 'ITDM - EUC') && (
              <FormField control={form.control} name="itApplication" render={({ field }) => (
                <FormItem>
                  <FormLabel>Aplikasi Signifikan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih aplikasi..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {applicationsData?.items.map(app => <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>)}
                      <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            )}

            {nature !== 'Manual' && <ITGCMetadataSection form={form} />}
            {nature === 'MRC' && <MRCParametersSection form={form} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                <FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{ALL_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
            </div>

            <RiskAssessmentSection form={form} wizard={<QualitativeRiskWizard onApply={(val) => form.setValue("riskQualitative", val, { shouldDirty: true })} />} />
            <RegulatoryMappingSection form={form} />

            <div>
              <Label>BPM Artifacts</Label>
              <div {...getRootProps()} className="mt-2 flex justify-center rounded-md border-2 border-dashed border-input px-6 pt-5 pb-6 cursor-pointer hover:border-primary">
                <input {...getInputProps()} />
                <div className="space-y-1 text-center">
                  {evidenceFile ? <p>{evidenceFile.name}</p> : <p>Drag & drop or click to upload</p>}
                </div>
              </div>
            </div>

            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('common:actions.cancel')}</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('common:status.pending') + '...' : (control?.id ? t('common:actions.save') : t('common:actions.add'))}
              </Button>
            </SheetFooter>
          </form>
        </Form>
        </motion.div>
        <UnsavedChangesDialog blocker={blocker} />
      </SheetContent>
    </Sheet>
  );
}
