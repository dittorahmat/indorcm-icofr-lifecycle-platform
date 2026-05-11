import React from 'react';
import { FormField, FormItem, FormControl, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface EvaluationAttributesSectionProps {
  form: any;
  t: any;
}

export function EvaluationAttributesSection({ form, t }: EvaluationAttributesSectionProps) {
  return (
    <div className="p-4 bg-muted/20 border rounded-lg space-y-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('attributes.title')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <FormField
          control={form.control}
          name="evaluationAttributes.objectiveAchieved"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.objectiveAchieved')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.timingAccuracy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.timingAccuracy')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.authorityCompetence"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.authorityCompetence')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.infoReliability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.infoReliability')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.periodCoverage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.periodCoverage')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evaluationAttributes.evidenceAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="text-[11px] font-normal leading-none cursor-pointer">{t('attributes.evidenceAvailability')}</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
