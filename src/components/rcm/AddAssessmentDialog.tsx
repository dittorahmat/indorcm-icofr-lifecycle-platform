import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { toast } from 'sonner';

const formSchema = z.object({
  // RCM Selection
  createNewRcm: z.boolean().default(false),
  rcmId: z.string().optional(),
  process: z.string().optional(),
  subProcess: z.string().optional(),
  riskDescription: z.string().optional(),
  riskRating: z.string().default('Medium'),
  isFraudRelated: z.boolean().default(false),

  // Control Lini 1
  controlCode: z.string().optional(),
  controlName: z.string().min(1, 'Control Name is required'),
  controlDescription: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  isKeyControl: z.boolean().default(false),
  ipoC: z.string().default('N'),
  ipoA: z.string().default('N'),
  ipoV: z.string().default('N'),
  ipoRa: z.string().default('N'),
  assertionE: z.string().default('N'),
  assertionC: z.string().default('N'),
  assertionA: z.string().default('N'),
  assertionCo: z.string().default('N'),
  assertionVa: z.string().default('N'),
  assertionRo: z.string().default('N'),
  assertionPd: z.string().default('N'),
  controlType: z.string().default('Preventif'),
  controlNature: z.string().default('Manual'),
  automatedControlType: z.string().nullable().optional(),
  frequency: z.string().default('Bulanan'),
  supportingApp: z.string().nullable().optional(),
  executingFunction: z.string().nullable().optional(),
  executorRole: z.string().nullable().optional(),
  affectedFsliItem: z.string().nullable().optional(),
  effectivePeriod: z.string().nullable().optional(),

  // TOD Lini 2
  pilarObjective: z.string().nullable().optional(),
  pilarTiming: z.string().nullable().optional(),
  pilarAuthority: z.string().nullable().optional(),
  pilarReliability: z.string().nullable().optional(),
  pilarCoverage: z.string().nullable().optional(),
  pilarEvidence: z.string().nullable().optional(),
  kkReference: z.string().nullable().optional(),
  conclusion: z.string().default('Effective'),
  comment: z.string().nullable().optional(),
});

interface AddAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterBpmId?: string;
  /** Called after a successful save so parent can refetch */
  onSuccess?: () => void;
}

interface CheckboxFieldProps {
  control: any;
  name: string;
  label: string;
}

const CheckboxField = ({ control, name, label }: CheckboxFieldProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-slate-50 transition-colors">
        <FormControl>
          <Checkbox
            checked={field.value === 'Y'}
            onCheckedChange={(checked) => field.onChange(checked ? 'Y' : 'N')}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel className="text-xs font-semibold cursor-pointer">{label}</FormLabel>
        </div>
      </FormItem>
    )}
  />
);

export function AddAssessmentDialog({
  open,
  onOpenChange,
  filterBpmId,
  onSuccess,
}: AddAssessmentDialogProps) {
  const { t } = useTranslation(['rcm', 'common', 'csa_hub']);
  const { setDirty } = useUnsavedChangesContext();
  const queryClient = useQueryClient();

  // Load all RCMs for dropdown
  const { data: rcmsData } = useQuery({
    queryKey: ['rcms-list'],
    queryFn: () => api<{ items: any[] }>('/api/rcm'),
    enabled: open
  });
  const allRcms = React.useMemo(() => rcmsData?.items || [], [rcmsData?.items]);

  // Load active BPM Process details to pre-select
  const { data: bpmProcessData } = useQuery({
    queryKey: ['bpm-process-detail', filterBpmId],
    queryFn: () => api<{ items: any[] }>(`/api/bpm-processes?id=${filterBpmId}`),
    enabled: !!filterBpmId && open
  });
  const activeBpmProcess = bpmProcessData?.items?.[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      createNewRcm: false,
      rcmId: '',
      process: '',
      subProcess: '',
      riskDescription: '',
      riskRating: 'Medium',
      isFraudRelated: false,
      controlCode: '',
      controlName: '',
      controlDescription: '',
      supportingDocs: '',
      isKeyControl: false,
      ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N',
      assertionE: 'N', assertionC: 'N', assertionA: 'N', assertionCo: 'N',
      assertionVa: 'N', assertionRo: 'N', assertionPd: 'N',
      controlType: 'Preventif',
      controlNature: 'Manual',
      automatedControlType: '',
      frequency: 'Bulanan',
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
      conclusion: 'Effective',
      comment: '',
    }
  });

  const { isDirty } = form.formState;
  const createNewRcmValue = form.watch('createNewRcm');
  const conclusionValue = form.watch('conclusion');

  React.useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        createNewRcm: false,
        rcmId: '',
        process: activeBpmProcess?.name || '',
        subProcess: '',
        riskDescription: '',
        riskRating: 'Medium',
        isFraudRelated: false,
        controlCode: '',
        controlName: '',
        controlDescription: '',
        supportingDocs: '',
        isKeyControl: false,
        ipoC: 'N', ipoA: 'N', ipoV: 'N', ipoRa: 'N',
        assertionE: 'N', assertionC: 'N', assertionA: 'N', assertionCo: 'N',
        assertionVa: 'N', assertionRo: 'N', assertionPd: 'N',
        controlType: 'Preventif',
        controlNature: 'Manual',
        automatedControlType: '',
        frequency: 'Bulanan',
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
        conclusion: 'Effective',
        comment: '',
      });
    }
  }, [open, activeBpmProcess, form]);

  // Filter RCM list based on active BPM Process
  const filteredRcms = React.useMemo(() => {
    if (!activeBpmProcess?.name) return allRcms;
    return allRcms.filter(item =>
      item.process?.toLowerCase() === activeBpmProcess.name.toLowerCase()
    );
  }, [allRcms, activeBpmProcess]);

  // ── Internal mutation that calls POST /api/rcm-matrix/verification-design ──
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await fetch('/api/rcm-matrix/verification-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || t('rcm:verification.add_dialog.error'));
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t('rcm:verification.add_dialog.success'));
      queryClient.invalidateQueries({ queryKey: ['verification-design'] });
      queryClient.invalidateQueries({ queryKey: ['rcms-list'] });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || t('rcm:verification.add_dialog.error'));
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  const handleError = (errors: any) => {
    console.error('Add form validation errors:', errors);
    toast.error(t('common:notifications.error') || 'Please fix the form errors first.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            {t('rcm:verification.add_dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('rcm:verification.add_dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleError)} className="space-y-6">

            {/* RCM anchoring section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-indigo-600" />
                  {t('rcm:matrix.groups.process')}
                </h3>

                <FormField
                  control={form.control}
                  name="createNewRcm"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-bold text-indigo-900 cursor-pointer">
                        {t('rcm:verification.add_dialog.create_new_rcm_label')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {!createNewRcmValue ? (
                <FormField
                  control={form.control}
                  name="rcmId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">{t('rcm:verification.add_dialog.rcm_select_label')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={t('rcm:verification.add_dialog.rcm_select_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          {filteredRcms.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No risks available
                            </SelectItem>
                          ) : (
                            filteredRcms.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <span className="font-bold text-indigo-700">[{item.subProcess}]</span> {item.riskDescription}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="process"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500">{t('rcm:verification.add_dialog.process_label')} *</FormLabel>
                        <FormControl>
                          <Input className="bg-white" placeholder="e.g. Penerimaan Setoran Tunai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subProcess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500">{t('rcm:verification.add_dialog.subprocess_label')} *</FormLabel>
                        <FormControl>
                          <Input className="bg-white" placeholder="e.g. Setoran Tunai via Counter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="riskDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-slate-500">{t('rcm:verification.add_dialog.risk_desc_label')} *</FormLabel>
                          <FormControl>
                            <Textarea className="bg-white h-20" placeholder="Describe the risk..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Tabs */}
            <Tabs defaultValue="tod" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tod" className="text-xs font-bold">
                  <span className="flex items-center gap-1">
                    {t('rcm:verification.add_dialog.tab_tod')}
                    {conclusionValue === 'Ineffective' && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="basic" className="text-xs font-bold">{t('rcm:verification.add_dialog.tab_info')}</TabsTrigger>
                <TabsTrigger value="ipo" className="text-xs font-bold">{t('rcm:verification.add_dialog.tab_compliance')}</TabsTrigger>
                <TabsTrigger value="nature" className="text-xs font-bold">{t('rcm:verification.add_dialog.tab_metadata')}</TabsTrigger>
              </TabsList>

              <TabsContent value="tod" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="pilarObjective" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_obj')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pilarTiming" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_time')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pilarAuthority" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_auth')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pilarReliability" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_rel')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pilarCoverage" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_cov')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pilarEvidence" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_evid')}</FormLabel>
                      <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FormField control={form.control} name="kkReference" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.kk_ref')}</FormLabel>
                      <FormControl><Input placeholder="e.g. KK-TOD-01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="conclusion" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.conclusion')}</FormLabel>
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
                  )} />
                </div>

                {conclusionValue === 'Ineffective' && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Auto-deficiency akan dibuat setelah asesmen ini disimpan.
                    </p>
                    <FormField control={form.control} name="comment" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-red-700">Justifikasi / Catatan Defisiensi *</FormLabel>
                        <FormControl>
                          <Textarea className="h-24 border-red-300 focus:border-red-500" placeholder="Jelaskan alasan kesimpulan Ineffective..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {conclusionValue !== 'Ineffective' && (
                  <FormField control={form.control} name="comment" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Catatan / Komentar</FormLabel>
                      <FormControl><Textarea className="h-20" placeholder="Komentar tambahan..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                )}
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <FormField control={form.control} name="controlCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">{t('rcm:verification.add_dialog.control_code_label')}</FormLabel>
                        <FormControl><Input placeholder="CTRL-001 (auto if empty)" {...field} /></FormControl>
                        <FormDescription className="text-xs">{t('rcm:verification.add_dialog.control_code_hint')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-2">
                    <FormField control={form.control} name="controlName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.control_name')} *</FormLabel>
                        <FormControl><Input placeholder="e.g. Otorisasi Setoran di atas limit" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <FormField control={form.control} name="controlDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">{t('rcm:matrix.control_description')}</FormLabel>
                    <FormControl><Textarea className="h-28" placeholder="Detailed procedure description..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supportingDocs" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">{t('rcm:matrix.supporting_docs')}</FormLabel>
                    <FormControl><Input placeholder="e.g. Slip Setoran, Log Sistem" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isKeyControl" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-slate-50 transition-colors">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs font-bold cursor-pointer">{t('rcm:verification.columns.is_key')}</FormLabel>
                    </div>
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="ipo" className="pt-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-2">{t('rcm:matrix.ipo')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField control={form.control} name="ipoC" label="Completeness" />
                      <CheckboxField control={form.control} name="ipoA" label="Accuracy" />
                      <CheckboxField control={form.control} name="ipoV" label="Validity" />
                      <CheckboxField control={form.control} name="ipoRa" label="Restricted Access" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-2">{t('rcm:matrix.assertions')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField control={form.control} name="assertionE" label="Existence / Occurrence" />
                      <CheckboxField control={form.control} name="assertionC" label="Completeness" />
                      <CheckboxField control={form.control} name="assertionA" label="Accuracy" />
                      <CheckboxField control={form.control} name="assertionCo" label="Cut-Off" />
                      <CheckboxField control={form.control} name="assertionRo" label="Rights & Obligation" />
                      <CheckboxField control={form.control} name="assertionVa" label="Valuation & Allocation" />
                      <CheckboxField control={form.control} name="assertionPd" label="Presentation & Disclosure" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nature" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="controlType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:matrix.type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Preventif">Preventif</SelectItem>
                          <SelectItem value="Detektif">Detektif</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="controlNature" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:matrix.nature')}</FormLabel>
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
                  )} />
                  <FormField control={form.control} name="frequency" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:matrix.frequency')}</FormLabel>
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
                  )} />
                  <FormField control={form.control} name="effectivePeriod" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{t('rcm:matrix.effective_period')}</FormLabel>
                      <FormControl><Input placeholder="e.g. 2026" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="sticky bottom-0 bg-white pt-3 border-t mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mutation.isPending
                  ? t('rcm:verification.add_dialog.saving_btn')
                  : t('rcm:verification.add_dialog.save_btn')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
