import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Info, 
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Control, TODEvaluation, RCM } from '@shared/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const combinedSchema = z.object({
  // RCM Fields (Editable for Design Sync/Verification)
  riskDescription: z.string().nullable().optional(),
  isFraudRelated: z.boolean(),
  riskRating: z.string().nullable().optional(),
  mappedControlName: z.string().min(1, "Nama kontrol wajib diisi"),
  mappedControlDescription: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  isKeyControl: z.boolean(),
  controlType: z.string().nullable().optional(), // Preventif / Detektif
  controlNature: z.string().nullable().optional(),
  automatedSubNature: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  supportingApp: z.string().nullable().optional(),
  executingFunction: z.string().nullable().optional(),
  executorRole: z.string().nullable().optional(),
  affectedFsliItem: z.string().nullable().optional(),
  effectivePeriod: z.string().nullable().optional(),
  
  ipoC: z.boolean(),
  ipoA: z.boolean(),
  ipoV: z.boolean(),
  ipoRa: z.boolean(),
  assertionE: z.boolean(),
  assertionC: z.boolean(),
  assertionA: z.boolean(),
  assertionCo: z.boolean(),
  assertionVa: z.boolean(),
  assertionRo: z.boolean(),
  assertionPd: z.boolean(),

  // TOD Assessment Fields (Free-text justification)
  pilarObjective: z.string().min(1, "Justifikasi wajib diisi"),
  pilarTiming: z.string().min(1, "Justifikasi wajib diisi"),
  pilarAuthority: z.string().min(1, "Justifikasi wajib diisi"),
  pilarReliability: z.string().min(1, "Justifikasi wajib diisi"),
  pilarCoverage: z.string().min(1, "Justifikasi wajib diisi"),
  pilarEvidence: z.string().min(1, "Justifikasi wajib diisi"),
  kkReference: z.string().optional(),
  conclusion: z.enum(['Effective', 'Ineffective']),
  comment: z.string().optional(),
});

type CombinedFormValues = z.infer<typeof combinedSchema>;

interface TODVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: any | null; // Use any for mapping flexibility
  csaId: string;
  initialData?: TODEvaluation | null;
  onSave: (values: CombinedFormValues) => void;
  isPending?: boolean;
}

export function TODVerificationDialog({
  open,
  onOpenChange,
  control,
  csaId,
  initialData,
  onSave,
  isPending
}: TODVerificationDialogProps) {
  const { t } = useTranslation(['rcm', 'csa_hub', 'common']);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = React.useState(false);
  
  const form = useForm<CombinedFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      isFraudRelated: false,
      ipoC: false,
      ipoA: false,
      ipoV: false,
      ipoRa: false,
      assertionE: false,
      assertionC: false,
      assertionA: false,
      assertionCo: false,
      assertionVa: false,
      assertionRo: false,
      assertionPd: false,
      conclusion: 'Effective',
    }
  });

  const { formState: { isDirty, errors } } = form;

  // Fetch RCM context for this mapping
  const { data: rcmMapping } = useQuery({
    queryKey: ['rcm-mapping-context', control?.mappingId],
    queryFn: () => api<any>(`/api/rcm-matrix/tlc/mapping/${control?.mappingId}`),
    enabled: !!control?.mappingId && open
  });

  // Sync form when RCM or TOD data arrives
  React.useEffect(() => {
    if (open && rcmMapping) {
        form.reset({
          // From RCM Mapping
          riskDescription: rcmMapping.riskDescription ?? '',
          isFraudRelated: !!rcmMapping.isFraudRelated,
          riskRating: rcmMapping.riskRating ?? 'Medium',
          mappedControlName: rcmMapping.mappedControlName ?? rcmMapping.baseControlName ?? '',
          mappedControlDescription: rcmMapping.mappedControlDescription ?? rcmMapping.baseControlDescription ?? '',
          supportingDocs: rcmMapping.supportingDocs ?? '',
          isKeyControl: !!rcmMapping.isKeyControl,
          controlType: rcmMapping.controlType ?? '',
          controlNature: rcmMapping.controlNature ?? '',
          automatedSubNature: rcmMapping.automatedSubNature ?? '',
          frequency: rcmMapping.frequency ?? '',
          supportingApp: rcmMapping.supportingApp ?? '',
          executingFunction: rcmMapping.executingFunction ?? '',
          executorRole: rcmMapping.executorRole ?? '',
          affectedFsliItem: rcmMapping.affectedFsliItem ?? '',
          effectivePeriod: rcmMapping.effectivePeriod ?? '',

          ipoC: !!rcmMapping.ipoC,
          ipoA: !!rcmMapping.ipoA,
          ipoV: !!rcmMapping.ipoV,
          ipoRa: !!rcmMapping.ipoRa,
          assertionE: !!rcmMapping.assertionE,
          assertionC: !!rcmMapping.assertionC,
          assertionA: !!rcmMapping.assertionA,
          assertionCo: !!rcmMapping.assertionCo,
          assertionVa: !!rcmMapping.assertionVa,
          assertionRo: !!rcmMapping.assertionRo,
          assertionPd: !!rcmMapping.assertionPd,

          // From initial TOD evaluation data
          pilarObjective: initialData?.pilarObjective ?? '',
          pilarTiming: initialData?.pilarTiming ?? '',
          pilarAuthority: initialData?.pilarAuthority ?? '',
          pilarReliability: initialData?.pilarReliability ?? '',
          pilarCoverage: initialData?.pilarCoverage ?? '',
          pilarEvidence: initialData?.pilarEvidence ?? '',
          kkReference: initialData?.kkReference ?? '',
          conclusion: (initialData?.conclusion as any) ?? 'Effective',
          comment: initialData?.comment ?? '',
        });
    }
  }, [initialData, rcmMapping, open, form]);

  useUnsavedChanges(isDirty && open);

  const onSubmit: SubmitHandler<CombinedFormValues> = (values) => {
    onSave(values);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && isDirty) {
       setIsConfirmDiscardOpen(true);
       return;
    }
    onOpenChange(val);
  };

  if (!control) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-hidden p-0 flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800 rounded-2xl shadow-md">
                  <ShieldCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic">
                    {t('csa_hub:tod.title')}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                     <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-700 font-bold text-xs py-0">LINE 2 REVIEW & DESIGN SYNC</Badge>
                     <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">{t('csa_hub:tod.subtitle')}</p>
                  </div>
                </div>
              </div>
              <div className="text-right hidden md:block">
                 <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Control Reference</div>
                 <div className="text-xl font-black tracking-tighter text-primary">{rcmMapping?.controlCode || '-'}</div>
              </div>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Editable Design Context (RCM) */}
              <ScrollArea className="w-full md:w-1/2 border-r bg-slate-50/50">
                <div className="p-8 space-y-8">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6">
                    <Target className="h-4 w-4" />
                    DESIGN CONTEXT (EDITABLE RCM)
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="riskRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.risk_rating')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger className="h-9 text-xs border-slate-200"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="High" className="text-rose-600 font-bold">High</SelectItem>
                              <SelectItem value="Medium" className="text-amber-600 font-bold">Medium</SelectItem>
                              <SelectItem value="Low" className="text-emerald-600 font-bold">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isFraudRelated"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 h-9 mt-auto">
                          <FormLabel className="text-xs font-black uppercase text-slate-400 mb-0">Fraud Related?</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="riskDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.risk_description')}</FormLabel>
                        <FormControl><Textarea {...field} rows={3} className="text-xs border-slate-200" /></FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <FormField
                      control={form.control}
                      name="mappedControlName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.control_name')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs font-bold border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mappedControlDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.control_description')}</FormLabel>
                          <FormControl><Textarea {...field} rows={4} className="text-xs border-slate-200 italic" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.frequency')}</FormLabel>
                            <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="controlNature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.nature')}</FormLabel>
                            <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                          </FormItem>
                        )}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="controlType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger className="h-9 text-xs border-slate-200"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger></FormControl>
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
                      name="isKeyControl"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 h-9 mt-auto">
                          <FormLabel className="text-xs font-black uppercase text-slate-400 mb-0">{t('matrix.is_key_control')}</FormLabel>
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <FormField
                      control={form.control}
                      name="automatedSubNature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.automated_type')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" placeholder="Contoh: Automated Calculation" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supportingApp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.supporting_app')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="executingFunction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.executing_function')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="executorRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.executor_role')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="affectedFsliItem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.affected_fsli_item')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="effectivePeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.effective_period')}</FormLabel>
                          <FormControl><Input {...field} className="text-xs border-slate-200" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="supportingDocs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-slate-400">{t('matrix.supporting_docs')}</FormLabel>
                        <FormControl><Textarea {...field} rows={2} className="text-xs border-slate-200" /></FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-6 pt-4 border-t border-slate-200">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Compliance Markers</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['ipoC', 'ipoA', 'ipoV', 'ipoRa'].map(f => (
                          <FormField
                            key={f}
                            control={form.control}
                            name={f as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-col items-center gap-1 space-y-0 p-2 rounded-lg border border-slate-200 bg-white">
                                <FormLabel className="text-xs font-black">{f.replace('ipo', '')}</FormLabel>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {['assertionE', 'assertionC', 'assertionA', 'assertionCo', 'assertionVa', 'assertionRo', 'assertionPd'].map(f => (
                        <FormField
                          key={f}
                          control={form.control}
                          name={f as any}
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-center gap-1 space-y-0 p-1 rounded-lg border border-slate-200 bg-white">
                              <FormLabel className="text-xs font-black">{f.replace('assertion', '').toUpperCase()}</FormLabel>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Right Column: Assessment (Interactive) */}
              <ScrollArea className="w-full md:w-1/2 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.02)]">
                <div className="p-8 space-y-8">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6">
                     <Target className="h-4 w-4" />
                     EVALUASI RANCANGAN (LAMPIRAN 8)
                  </div>
                  
                  {[
                    { id: 'pilarObjective', label: t('csa_hub:tod.pillars.objective'), placeholder: 'Jelaskan bagaimana kontrol ini memitigasi risiko di samping...' },
                    { id: 'pilarTiming', label: t('csa_hub:tod.pillars.timing'), placeholder: 'Analisis ketepatan waktu/frekuensi dibandingkan volume transaksi...' },
                    { id: 'pilarAuthority', label: t('csa_hub:tod.pillars.authority'), placeholder: 'Verifikasi kompetensi dan pemisahan tugas pelaksana...' },
                    { id: 'pilarReliability', label: t('csa_hub:tod.pillars.reliability'), placeholder: 'Evaluasi keandalan sumber data/laporan yang digunakan...' },
                    { id: 'pilarCoverage', label: t('csa_hub:tod.pillars.coverage'), placeholder: 'Pastikan periode cakupan sudah sesuai dengan tahun buku...' },
                    { id: 'pilarEvidence', label: t('csa_hub:tod.pillars.evidence'), placeholder: 'Ketersediaan audit trail untuk dilakukan pengujian TOE nantinya...' },
                  ].map((pilar) => (
                    <div key={pilar.id} className="space-y-2 group">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={pilar.id} className="text-xs font-black uppercase tracking-tight text-slate-600 group-focus-within:text-primary transition-colors">
                          {pilar.label}
                        </Label>
                        {errors[pilar.id as keyof CombinedFormValues] && (
                           <span className="text-xs font-bold text-red-500 animate-pulse">Required</span>
                        )}
                      </div>
                      <Textarea 
                        id={pilar.id}
                        {...form.register(pilar.id as any)}
                        placeholder={pilar.placeholder}
                        className={cn(
                          "min-h-[100px] text-xs font-medium resize-none transition-all border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-400/10",
                          errors[pilar.id as keyof CombinedFormValues] ? "border-red-300 bg-red-50/30" : "hover:border-slate-300"
                        )}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                         <FileText className="h-3.5 w-3.5 text-primary" /> {t('csa_hub:tod.kkRef')}
                       </Label>
                       <Input 
                         {...form.register('kkReference')} 
                         placeholder="Misal: KK-TOD-FIN-01" 
                         className="h-11 font-mono text-xs border-slate-200 rounded-xl focus:ring-slate-400/10"
                       />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase text-slate-500">
                         {t('csa_hub:tod.conclusion')}
                       </Label>
                       <div className="flex gap-2 h-11">
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "flex-1 gap-2 font-black text-xs uppercase border-2 rounded-xl transition-all",
                              form.watch('conclusion') === 'Effective' ? "bg-green-50 border-green-600 text-green-700 shadow-sm" : "opacity-40 grayscale"
                            )}
                            onClick={() => form.setValue('conclusion', 'Effective', { shouldDirty: true })}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Effective
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "flex-1 gap-2 font-black text-xs uppercase border-2 rounded-xl transition-all",
                              form.watch('conclusion') === 'Ineffective' ? "bg-red-50 border-red-600 text-red-700 shadow-sm" : "opacity-40 grayscale"
                            )}
                            onClick={() => form.setValue('conclusion', 'Ineffective', { shouldDirty: true })}
                          >
                            <XCircle className="h-4 w-4" /> Ineffective
                          </Button>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-xs font-black uppercase text-slate-500">
                       Overall Assessment Comment
                     </Label>
                     <Textarea 
                       {...form.register('comment')}
                       placeholder="Berikan kesimpulan akhir mengenai rancangan kontrol ini..."
                       className="min-h-[80px] text-xs resize-none border-slate-200 rounded-xl focus:ring-slate-400/10"
                     />
                  </div>

                  <div className="pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-4">
                    <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="font-black uppercase text-xs tracking-widest text-slate-400">
                      {t('common:actions.cancel')}
                    </Button>
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 shadow-md px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-xs" disabled={isPending}>
                      {isPending ? "Syncing..." : t('csa_hub:tod.saveEvaluation')}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDiscardOpen} onOpenChange={setIsConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:unsavedChanges.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:unsavedChanges.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDiscardOpen(false)}>
              {t('common:unsavedChanges.stay')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsConfirmDiscardOpen(false);
                form.reset();
                onOpenChange(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {t('common:unsavedChanges.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
