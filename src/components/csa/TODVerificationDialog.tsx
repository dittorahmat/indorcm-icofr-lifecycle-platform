import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Info, 
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Control, TODEvaluation } from '@shared/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const todSchema = z.object({
  pilarObjective: z.boolean(),
  pilarTiming: z.boolean(),
  pilarAuthority: z.boolean(),
  pilarReliability: z.boolean(),
  pilarCoverage: z.boolean(),
  pilarEvidence: z.boolean(),
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
      pilarObjective: false,
      pilarTiming: false,
      pilarAuthority: false,
      pilarReliability: false,
      pilarCoverage: false,
      pilarEvidence: false,
      kkReference: '',
      conclusion: 'Effective',
      comment: '',
    }
  });

  const { formState: { isDirty } } = form;

  // Reset form when initialData or control changes
  React.useEffect(() => {
    if (open && control) {
        form.reset({
          pilarObjective: initialData?.pilarObjective ?? false,
          pilarTiming: initialData?.pilarTiming ?? false,
          pilarAuthority: initialData?.pilarAuthority ?? false,
          pilarReliability: initialData?.pilarReliability ?? false,
          pilarCoverage: initialData?.pilarCoverage ?? false,
          pilarEvidence: initialData?.pilarEvidence ?? false,
          kkReference: initialData?.kkReference ?? '',
          conclusion: (initialData?.conclusion as any) ?? 'Effective',
          comment: initialData?.comment ?? '',
        });
    }
  }, [initialData, control, open, form]);

  // Track unsaved changes (routing level)
  const blocker = useUnsavedChanges(isDirty && open);

  const onSubmit: SubmitHandler<TODFormValues> = (values) => {
    onSave(values);
    form.reset(values); // Clear dirty state
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && isDirty) {
       // Manual check for close button/click outside since useBlocker only handles navigation
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  {t('tod.title')}
                </DialogTitle>
                <p className="text-slate-500 text-sm font-medium">{t('tod.subtitle')}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Left Side: Control Attributes (Read-only from RCM) */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                <Info className="h-3 w-3" /> {t('tod.rcmAttributes')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Ref. Number</Label>
                  <div className="font-bold text-slate-900">{control.reference || control.code}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Frequency</Label>
                  <div className="font-bold text-slate-900">{control.frequency || '-'}</div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-500">Control Name</Label>
                <div className="font-bold text-slate-900 leading-tight">{control.name}</div>
              </div>

              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-500">Description</Label>
                <div className="text-xs text-slate-600 leading-relaxed mt-1 italic">
                  {control.description || 'No description provided.'}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                  {control.level && <Badge variant="outline" className="bg-white border-slate-200 font-bold text-[9px] uppercase tracking-tighter">{control.level}</Badge>}
                  {control.type && <Badge variant="outline" className="bg-white border-slate-200 font-bold text-[9px] uppercase tracking-tighter">{control.type}</Badge>}
                  {control.nature && <Badge variant="outline" className="bg-white border-slate-200 font-bold text-[9px] uppercase tracking-tighter">{control.nature}</Badge>}
              </div>
            </div>

            {/* Right Side: TOD Criteria (Interactive) */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-600 flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> {t('tod.evaluationPillars')}
                </h3>
                
                {[
                  { id: 'pilarObjective', label: t('tod.pillars.objective'), desc: 'Apakah kontrol memitigasi risiko terkait?' },
                  { id: 'pilarTiming', label: t('tod.pillars.timing'), desc: 'Apakah frekuensi sudah sesuai?' },
                  { id: 'pilarAuthority', label: t('tod.pillars.authority'), desc: 'Apakah pelaksana memiliki mandat?' },
                  { id: 'pilarReliability', label: t('tod.pillars.reliability'), desc: 'Apakah data pendukung valid?' },
                  { id: 'pilarCoverage', label: t('tod.pillars.coverage'), desc: 'Mencakup periode laporan keuangan?' },
                  { id: 'pilarEvidence', label: t('tod.pillars.evidence'), desc: 'Terdapat audit trail yang memadai?' },
                ].map((pilar) => (
                  <div key={pilar.id} className="flex items-start space-x-3 space-y-0 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <Checkbox 
                      id={pilar.id}
                      checked={form.watch(pilar.id as any)}
                      onCheckedChange={(checked) => form.setValue(pilar.id as any, checked === true, { shouldDirty: true })}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={pilar.id} className="text-sm font-bold leading-none cursor-pointer">
                        {pilar.label}
                      </Label>
                      <p className="text-[10px] text-slate-500 font-medium">{pilar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                 <div>
                   <Label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 mb-1.5">
                     <FileText className="h-3 w-3" /> {t('tod.kkRef')}
                   </Label>
                   <Input 
                     {...form.register('kkReference')} 
                     placeholder="Misal: KK-TOD-FIN-01" 
                     className="h-9 font-mono text-xs"
                   />
                 </div>

                 <div>
                   <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                     {t('tod.conclusion')}
                   </Label>
                   <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 gap-2 font-black text-[10px] uppercase border-2",
                          form.watch('conclusion') === 'Effective' ? "bg-green-50 border-green-600 text-green-700 hover:bg-green-100" : "opacity-40"
                        )}
                        onClick={() => form.setValue('conclusion', 'Effective', { shouldDirty: true })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Effective
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 gap-2 font-black text-[10px] uppercase border-2",
                          form.watch('conclusion') === 'Ineffective' ? "bg-red-50 border-red-600 text-red-700 hover:bg-red-100" : "opacity-40"
                        )}
                        onClick={() => form.setValue('conclusion', 'Ineffective', { shouldDirty: true })}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Ineffective
                      </Button>
                   </div>
                 </div>

                 <div>
                   <Label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                     {t('tod.justification')}
                   </Label>
                   <Textarea 
                     {...form.register('comment')}
                     placeholder="Berikan penjelasan singkat mengenai hasil evaluasi..."
                     className="min-h-[80px] text-xs resize-none"
                   />
                 </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="font-bold">
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-wider" disabled={isPending}>
                  {isPending ? "Saving..." : t('tod.saveEvaluation')}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
