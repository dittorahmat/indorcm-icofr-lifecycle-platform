import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { toast } from 'sonner';

const formSchema = z.object({
  mappingId: z.string(),
  controlName: z.string().nullable().optional(),
  controlDescription: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  isKeyControl: z.boolean().nullable().optional(),
  ipoC: z.string().nullable().optional(),
  ipoA: z.string().nullable().optional(),
  ipoV: z.string().nullable().optional(),
  ipoRa: z.string().nullable().optional(),
  assertionE: z.string().nullable().optional(),
  assertionC: z.string().nullable().optional(),
  assertionA: z.string().nullable().optional(),
  assertionCo: z.string().nullable().optional(),
  assertionVa: z.string().nullable().optional(),
  assertionRo: z.string().nullable().optional(),
  assertionPd: z.string().nullable().optional(),
  controlType: z.string().nullable().optional(),
  controlNature: z.string().nullable().optional(),
  automatedControlType: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  supportingApp: z.string().nullable().optional(),
  executingFunction: z.string().nullable().optional(),
  executorRole: z.string().nullable().optional(),
  affectedFsliItem: z.string().nullable().optional(),
  effectivePeriod: z.string().nullable().optional(),
  // TOD Pilar
  pilarObjective: z.string().nullable().optional(),
  pilarTiming: z.string().nullable().optional(),
  pilarAuthority: z.string().nullable().optional(),
  pilarReliability: z.string().nullable().optional(),
  pilarCoverage: z.string().nullable().optional(),
  pilarEvidence: z.string().nullable().optional(),
  kkReference: z.string().nullable().optional(),
  conclusion: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

interface VerificationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  onSave: (values: z.infer<typeof formSchema>) => void;
  isSaving: boolean;
}

export function VerificationEditDialog({
  open,
  onOpenChange,
  data,
  onSave,
  isSaving
}: VerificationEditDialogProps) {
  const { t } = useTranslation(['rcm', 'common', 'csa_hub']);
  const { setDirty } = useUnsavedChangesContext();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mappingId: '',
      controlName: '',
      controlDescription: '',
      supportingDocs: '',
      isKeyControl: false,
      ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N',
      assertionE: 'N', assertionC: 'N', assertionA: 'N', assertionCo: 'N',
      assertionVa: 'N', assertionRo: 'N', assertionPd: 'N',
      controlType: '',
      controlNature: '',
      automatedControlType: '',
      frequency: '',
      supportingApp: '',
      executingFunction: '',
      executorRole: '',
      affectedFsliItem: '',
      effectivePeriod: '',
      pilarObjective: '',
      pilarTiming: '',
      pilarAuthority: '',
      pilarReliability: '',
      pilarCoverage: '',
      pilarEvidence: '',
      kkReference: '',
      conclusion: '',
      comment: '',
    }
  });

  const { isDirty } = form.formState;

  React.useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  React.useEffect(() => {
    if (data) {
      const sanitizedData = { ...data };
      Object.keys(sanitizedData).forEach((key) => {
        if (sanitizedData[key] === null) {
          if (key === 'isKeyControl') {
            sanitizedData[key] = false;
          } else {
            sanitizedData[key] = '';
          }
        }
      });
      form.reset({
        ...sanitizedData,
        isKeyControl: !!data.isKeyControl,
      });
    }
  }, [data, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Map empty string fields back to null if preferred, or pass as is
    onSave(values);
  };

  const handleError = (errors: any) => {
    console.error('Form validation errors:', errors);
    toast.error(t('common:notifications.error') || 'Validation Error');
  };

  const CheckboxField = ({ name, label }: { name: keyof z.infer<typeof formSchema>, label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
          <FormControl>
            <Checkbox
              checked={field.value === 'Y'}
              onCheckedChange={(checked) => field.onChange(checked ? 'Y' : 'N')}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
          </div>
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('rcm:verification.columns.conclusion')}</DialogTitle>
          <DialogDescription>
            {t('rcm:matrix.properties.audit_trail_desc')} {data?.controlCode}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleError)} className="space-y-6">
            <Tabs defaultValue="tod" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tod">{t('rcm:verification.groups.tod')}</TabsTrigger>
                <TabsTrigger value="basic">{t('rcm:verification.groups.info')}</TabsTrigger>
                <TabsTrigger value="ipo">{t('rcm:matrix.sections.compliance')}</TabsTrigger>
                <TabsTrigger value="nature">{t('rcm:matrix.groups.metadata')}</TabsTrigger>
              </TabsList>

              <TabsContent value="tod" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pilarObjective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_obj')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pilarTiming"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_time')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pilarAuthority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_auth')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pilarReliability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_rel')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pilarCoverage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_cov')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pilarEvidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.p_evid')}</FormLabel>
                        <FormControl><Textarea placeholder={t('rcm:matrix.placeholders.description')} {...field} className="h-20" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="kkReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.kk_ref')}</FormLabel>
                        <FormControl><textarea className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conclusion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rcm:verification.columns.conclusion')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('common:placeholders.choose')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Effective">{t('common:status.effective')}</SelectItem>
                            <SelectItem value="Ineffective">{t('common:status.ineffective')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="controlName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rcm:verification.columns.control_name')}</FormLabel>
                      <FormControl><textarea className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="controlDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rcm:matrix.control_description')}</FormLabel>
                      <FormControl><Textarea className="h-32" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supportingDocs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rcm:matrix.supporting_docs')}</FormLabel>
                      <FormControl><textarea className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isKeyControl"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('rcm:verification.columns.is_key')}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="ipo" className="pt-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-slate-500 mb-2">{t('rcm:matrix.ipo')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField name="ipoC" label="Completeness" />
                      <CheckboxField name="ipoA" label="Accuracy" />
                      <CheckboxField name="ipoV" label="Validity" />
                      <CheckboxField name="ipoRa" label="Restricted Access" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-slate-500 mb-2">{t('rcm:matrix.assertions')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField name="assertionE" label="Existence / Occurrence" />
                      <CheckboxField name="assertionC" label="Completeness" />
                      <CheckboxField name="assertionA" label="Accuracy" />
                      <CheckboxField name="assertionCo" label="Cut-Off" />
                      <CheckboxField name="assertionRo" label="Rights & Obligation" />
                      <CheckboxField name="assertionVa" label="Valuation & Allocation" />
                      <CheckboxField name="assertionPd" label="Presentation & Disclosure" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nature" className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="controlType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('rcm:matrix.type')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Preventif">Preventif</SelectItem>
                              <SelectItem value="Detektif">Detektif</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="controlNature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('rcm:matrix.nature')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Manual">Manual</SelectItem>
                              <SelectItem value="Otomatis">Otomatis</SelectItem>
                              <SelectItem value="ITDM - EUC">ITDM - EUC</SelectItem>
                              <SelectItem value="ITDM - IPE">ITDM - IPE</SelectItem>
                              <SelectItem value="MRC">MRC</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('rcm:matrix.frequency')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Tahunan">Tahunan</SelectItem>
                              <SelectItem value="Semesteran">Semesteran</SelectItem>
                              <SelectItem value="Kuartalan">Kuartalan</SelectItem>
                              <SelectItem value="Bulanan">Bulanan</SelectItem>
                              <SelectItem value="Mingguan">Mingguan</SelectItem>
                              <SelectItem value="Harian">Harian</SelectItem>
                              <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="effectivePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('rcm:matrix.effective_period')}</FormLabel>
                          <FormControl><textarea className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                 </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common:actions.cancel')}</Button>
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common:actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
