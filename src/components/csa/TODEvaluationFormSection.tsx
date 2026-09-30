import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TODEvaluationFormSectionProps {
  form: UseFormReturn<any>;
  onCancel: () => void;
  isPending?: boolean;
}

export function TODEvaluationFormSection({
  form,
  onCancel,
  isPending,
}: TODEvaluationFormSectionProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  const errors = form.formState.errors;

  const pillars = [
    { id: 'pilarObjective', label: t('csa_hub:tod.pillars.objective'), placeholder: t('csa_hub:tod.pillars.objectivePlaceholder') },
    { id: 'pilarTiming', label: t('csa_hub:tod.pillars.timing'), placeholder: t('csa_hub:tod.pillars.timingPlaceholder') },
    { id: 'pilarAuthority', label: t('csa_hub:tod.pillars.authority'), placeholder: t('csa_hub:tod.pillars.authorityPlaceholder') },
    { id: 'pilarReliability', label: t('csa_hub:tod.pillars.reliability'), placeholder: t('csa_hub:tod.pillars.reliabilityPlaceholder') },
    { id: 'pilarCoverage', label: t('csa_hub:tod.pillars.coverage'), placeholder: t('csa_hub:tod.pillars.coveragePlaceholder') },
    { id: 'pilarEvidence', label: t('csa_hub:tod.pillars.evidence'), placeholder: t('csa_hub:tod.pillars.evidencePlaceholder') },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6">
        <Target className="h-4 w-4" />
        {t('csa_hub:tod.evaluationTitle')}
      </div>

      {pillars.map((pilar) => (
        <div key={pilar.id} className="space-y-2 group">
          <div className="flex justify-between items-center">
            <Label
              htmlFor={pilar.id}
              className="text-xs font-black uppercase tracking-tight text-slate-600 group-focus-within:text-primary transition-colors"
            >
              {pilar.label}
            </Label>
            {errors[pilar.id] && (
              <span className="text-xs font-semibold text-red-600">Required</span>
            )}
          </div>
          <Textarea
            id={pilar.id}
            {...form.register(pilar.id as any)}
            placeholder={pilar.placeholder}
            className={cn(
              "min-h-[100px] text-xs font-medium resize-none transition-all border-slate-200 rounded-md focus:ring-2 focus:ring-slate-400/20",
              errors[pilar.id] ? "border-red-300 bg-red-50/30" : "hover:border-slate-300"
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
            placeholder={t('csa_hub:tod.kkRefPlaceholder')}
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
                form.watch('conclusion') === 'Effective'
                  ? "bg-green-50 border-green-600 text-green-700 shadow-sm"
                  : "opacity-40 grayscale"
              )}
              onClick={() => form.setValue('conclusion', 'Effective', { shouldDirty: true })}
            >
              <CheckCircle2 className="h-4 w-4" /> {t('common:status.effective')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "flex-1 gap-2 font-black text-xs uppercase border-2 rounded-xl transition-all",
                form.watch('conclusion') === 'Ineffective'
                  ? "bg-red-50 border-red-600 text-red-700 shadow-sm"
                  : "opacity-40 grayscale"
              )}
              onClick={() => form.setValue('conclusion', 'Ineffective', { shouldDirty: true })}
            >
              <XCircle className="h-4 w-4" /> {t('common:status.ineffective')}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-black uppercase text-slate-500">
          {t('csa_hub:tod.overallComment')}
        </Label>
        <Textarea
          {...form.register('comment')}
          placeholder={t('csa_hub:tod.overallCommentPlaceholder')}
          className="min-h-[80px] text-xs resize-none border-slate-200 rounded-xl focus:ring-slate-400/10"
        />
      </div>

      <div className="pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white pb-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="font-black uppercase text-xs tracking-widest text-slate-400 min-h-[44px]"
        >
          {t('common:actions.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-mancity-pattern hover:opacity-90 shadow-md px-8 min-h-[44px] rounded-lg font-black uppercase tracking-widest text-xs text-primary-foreground"
          disabled={isPending}
        >
          {isPending ? t('common:actions.save') + "..." : t('csa_hub:tod.saveEvaluation')}
        </Button>
      </div>
    </div>
  );
}
