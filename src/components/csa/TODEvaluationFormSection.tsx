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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-4 sm:mb-6">
        <Target className="h-4 w-4 shrink-0" />
        <span>{t('csa_hub:tod.evaluationTitle')}</span>
      </div>

      {pillars.map((pilar) => (
        <div key={pilar.id} className="space-y-1.5 group">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Label
              htmlFor={pilar.id}
              className="text-xs font-bold uppercase tracking-wider text-slate-700 group-focus-within:text-primary transition-colors"
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
              "min-h-[80px] sm:min-h-[100px] text-xs font-normal resize-none transition-all border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-slate-400/20",
              errors[pilar.id] ? "border-red-300 bg-red-50/30" : "hover:border-slate-300"
            )}
          />
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary shrink-0" /> 
            <span>{t('csa_hub:tod.kkRef')}</span>
          </Label>
          <Input
            {...form.register('kkReference')}
            placeholder={t('csa_hub:tod.kkRefPlaceholder')}
            className="h-10 font-mono text-xs border-slate-200 rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            {t('csa_hub:tod.conclusion')}
          </Label>
          <div className="flex flex-col min-[380px]:flex-row gap-2 min-h-[44px]">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "flex-1 gap-1.5 font-bold text-xs uppercase border rounded-lg transition-all min-h-[44px] w-full min-[380px]:w-auto justify-center",
                form.watch('conclusion') === 'Effective'
                  ? "bg-green-50 border-green-600 text-green-700 shadow-xs"
                  : "opacity-40 grayscale"
              )}
              onClick={() => form.setValue('conclusion', 'Effective', { shouldDirty: true })}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" /> 
              <span>{t('common:status.effective')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "flex-1 gap-1.5 font-bold text-xs uppercase border rounded-lg transition-all min-h-[44px] w-full min-[380px]:w-auto justify-center",
                form.watch('conclusion') === 'Ineffective'
                  ? "bg-red-50 border-red-600 text-red-700 shadow-xs"
                  : "opacity-40 grayscale"
              )}
              onClick={() => form.setValue('conclusion', 'Ineffective', { shouldDirty: true })}
            >
              <XCircle className="h-4 w-4 shrink-0" /> 
              <span>{t('common:status.ineffective')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
          {t('csa_hub:tod.overallComment')}
        </Label>
        <Textarea
          {...form.register('comment')}
          placeholder={t('csa_hub:tod.overallCommentPlaceholder')}
          className="min-h-[80px] text-base sm:text-xs border-slate-200 rounded-lg p-3"
        />
      </div>

      <div className="pt-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 sticky bottom-0 bg-white pb-2 sm:pb-4 z-20">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="font-bold uppercase text-xs tracking-wider text-slate-500 min-h-[44px] w-full sm:w-auto"
        >
          {t('common:actions.cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-mancity-pattern hover:opacity-90 shadow-sm px-6 min-h-[44px] rounded-lg font-bold uppercase tracking-wider text-xs text-primary-foreground w-full sm:w-auto justify-center"
          disabled={isPending}
        >
          {isPending ? t('common:actions.save') + "..." : t('csa_hub:tod.saveEvaluation')}
        </Button>
      </div>
    </div>
  );
}
