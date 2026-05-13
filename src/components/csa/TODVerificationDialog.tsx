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
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ScrollArea } from '@/components/ui/scroll-area';

const todSchema = z.object({
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

type TODFormValues = z.infer<typeof todSchema>;

interface TODVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: Control | null;
  csaId: string;
  initialData?: TODEvaluation | null;
  onSave: (values: TODFormValues) => void;
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
  const { t } = useTranslation(['csa_hub', 'common']);
  
  const form = useForm<TODFormValues>({
    resolver: zodResolver(todSchema),
    defaultValues: {
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

  const { formState: { isDirty, errors } } = form;

  // Fetch RCM context for this control
  const { data: rcmData } = useQuery({
    queryKey: ['rcm-context', control?.rcmId],
    queryFn: () => api<RCM>(`/api/rcm/${control?.rcmId}`),
    enabled: !!control?.rcmId && open
  });

  // Reset form when data arrives
  React.useEffect(() => {
    if (open && control) {
        form.reset({
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
  }, [initialData, control, open, form]);

  const blocker = useUnsavedChanges(isDirty && open);

  const onSubmit: SubmitHandler<TODFormValues> = (values) => {
    onSave(values);
    form.reset(values);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && isDirty) {
       if (window.confirm(t('common:unsavedChanges'))) {
           onOpenChange(false);
           form.reset();
       }
       return;
    }
    onOpenChange(val);
  };

  if (!control) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic">
                    {t('tod.title')}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                     <Badge variant="outline" className="bg-indigo-500/20 border-indigo-400/30 text-indigo-100 font-bold text-[10px] py-0">LINE 2 REVIEW</Badge>
                     <p className="text-slate-400 text-[11px] font-medium tracking-wide uppercase">{t('tod.subtitle')}</p>
                  </div>
                </div>
              </div>
              <div className="text-right hidden md:block">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Control Reference</div>
                 <div className="text-xl font-black tracking-tighter text-indigo-400">{control.reference || control.code}</div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Column: Context (Read-only) */}
            <ScrollArea className="w-full md:w-2/5 border-r bg-slate-50/50">
              <div className="p-6 space-y-6">
                {/* Section 1: Risk Information */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest mb-4">
                      <div className="h-1 w-4 bg-red-600 rounded-full" />
                      CONTEXT: RISIKO (LAMPIRAN 5)
                   </div>
                   
                   <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <AlertTriangle className="h-12 w-12 text-red-600" />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                         <Badge className={cn(
                            "font-black text-[9px] uppercase",
                            rcmData?.riskRating === 'High' ? "bg-red-600" : "bg-amber-500"
                         )}>
                           {rcmData?.riskRating || 'High'} RISK
                         </Badge>
                         {rcmData?.isFraudRelated && (
                            <Badge className="bg-indigo-600 font-black text-[9px] uppercase gap-1">
                               <Zap className="h-2 w-2 fill-white" /> Fraud Related
                            </Badge>
                         )}
                      </div>
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tight block mb-1">Risk Description</Label>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {rcmData?.riskDescription || "Loading risk details..."}
                      </p>
                   </div>
                </div>

                {/* Section 2: Control Details */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4">
                      <div className="h-1 w-4 bg-indigo-600 rounded-full" />
                      ATRIBUT PENGENDALIAN
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                         <Label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Frequency</Label>
                         <div className="text-xs font-black text-slate-700">{control.frequency || '-'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                         <Label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nature</Label>
                         <div className="text-xs font-black text-slate-700">{control.nature || '-'}</div>
                      </div>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Asersi Laporan Keuangan</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                         {control.assertions?.map((a: string) => (
                            <Badge key={a} variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-200 uppercase">{a}</Badge>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Information (IPO)</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                         {control.ipos?.map((i: string) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-black border-indigo-200 text-indigo-600 uppercase">{i}</Badge>
                         ))}
                      </div>
                   </div>

                   <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <Label className="text-[9px] font-black text-indigo-400 uppercase block mb-1">Control Description</Label>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic italic">
                        "{control.description}"
                      </p>
                   </div>
                </div>
              </div>
            </ScrollArea>

            {/* Right Column: Assessment (Interactive) */}
            <ScrollArea className="w-full md:w-3/5 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.02)]">
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-6">
                     <Target className="h-4 w-4" />
                     EVALUASI RANCANGAN (LAMPIRAN 8)
                  </div>
                  
                  {[
                    { id: 'pilarObjective', label: t('tod.pillars.objective'), placeholder: 'Jelaskan bagaimana kontrol ini memitigasi risiko di samping...' },
                    { id: 'pilarTiming', label: t('tod.pillars.timing'), placeholder: 'Analisis ketepatan waktu/frekuensi dibandingkan volume transaksi...' },
                    { id: 'pilarAuthority', label: t('tod.pillars.authority'), placeholder: 'Verifikasi kompetensi dan pemisahan tugas pelaksana...' },
                    { id: 'pilarReliability', label: t('tod.pillars.reliability'), placeholder: 'Evaluasi keandalan sumber data/laporan yang digunakan...' },
                    { id: 'pilarCoverage', label: t('tod.pillars.coverage'), placeholder: 'Pastikan periode cakupan sudah sesuai dengan tahun buku...' },
                    { id: 'pilarEvidence', label: t('tod.pillars.evidence'), placeholder: 'Ketersediaan audit trail untuk dilakukan pengujian TOE nantinya...' },
                  ].map((pilar) => (
                    <div key={pilar.id} className="space-y-2 group">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={pilar.id} className="text-xs font-black uppercase tracking-tight text-slate-600 group-focus-within:text-indigo-600 transition-colors">
                          {pilar.label}
                        </Label>
                        {errors[pilar.id as keyof TODFormValues] && (
                           <span className="text-[10px] font-bold text-red-500 animate-pulse">Required</span>
                        )}
                      </div>
                      <Textarea 
                        id={pilar.id}
                        {...form.register(pilar.id as any)}
                        placeholder={pilar.placeholder}
                        className={cn(
                          "min-h-[100px] text-xs font-medium resize-none transition-all border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10",
                          errors[pilar.id as keyof TODFormValues] ? "border-red-300 bg-red-50/30" : "hover:border-slate-300"
                        )}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                         <FileText className="h-3.5 w-3.5 text-indigo-500" /> {t('tod.kkRef')}
                       </Label>
                       <Input 
                         {...form.register('kkReference')} 
                         placeholder="Misal: KK-TOD-FIN-01" 
                         className="h-11 font-mono text-xs border-slate-200 rounded-xl focus:ring-indigo-500/10"
                       />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-500">
                         {t('tod.conclusion')}
                       </Label>
                       <div className="flex gap-2 h-11">
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "flex-1 gap-2 font-black text-[10px] uppercase border-2 rounded-xl transition-all",
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
                              "flex-1 gap-2 font-black text-[10px] uppercase border-2 rounded-xl transition-all",
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
                     <Label className="text-[10px] font-black uppercase text-slate-500">
                       Overall Assessment Comment
                     </Label>
                     <Textarea 
                       {...form.register('comment')}
                       placeholder="Berikan kesimpulan akhir mengenai rancangan kontrol ini..."
                       className="min-h-[80px] text-xs resize-none border-slate-200 rounded-xl focus:ring-indigo-500/10"
                     />
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-4">
                  <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="font-black uppercase text-[10px] tracking-widest text-slate-400">
                    {t('common:actions.cancel')}
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-xs" disabled={isPending}>
                    {isPending ? "Syncing..." : t('tod.saveEvaluation')}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
