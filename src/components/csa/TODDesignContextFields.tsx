import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Target } from 'lucide-react';
import { ASSERTION_CODE, ASSERTION_FIELDS, IPO_CODE, IPO_FIELDS } from '@shared/assertion-fields';

export function TODDesignContextFields({ form }: { form: UseFormReturn<any> }) {
  const { t } = useTranslation(['rcm', 'csa_hub', 'common', 'risklibrary']);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-4 sm:mb-6">
        <Target className="h-4 w-4 shrink-0" />
        <span>{t('csa_hub:tod.designContext')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="riskRating"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.risk_rating')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl><SelectTrigger className="h-10 min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent className="rounded-lg">
                  <SelectItem value="High" className="text-rose-600 font-bold">{t('risklibrary:form.high')}</SelectItem>
                  <SelectItem value="Medium" className="text-amber-600 font-bold">{t('risklibrary:form.medium')}</SelectItem>
                  <SelectItem value="Low" className="text-emerald-600 font-bold">{t('risklibrary:form.low')}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isFraudRelated"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 min-h-[44px] sm:h-10 mt-auto shadow-xs flex-wrap gap-2">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 mb-0">{t('rcm:matrix.properties.fraud_related_q')}</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="riskDescription"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.risk_description')}</FormLabel>
            <FormControl><Textarea {...field} rows={3} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <FormField
          control={form.control}
          name="mappedControlName"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.control_name')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm font-bold border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mappedControlDescription"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.control_description')}</FormLabel>
              <FormControl><Textarea {...field} rows={3} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.frequency')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="controlNature"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.nature')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="controlType"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.type')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl><SelectTrigger className="h-10 min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger></FormControl>
                <SelectContent className="rounded-lg">
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
            <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 min-h-[44px] sm:h-10 mt-auto shadow-xs flex-wrap gap-2">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 mb-0">{t('matrix.is_key_control')}</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        <FormField
          control={form.control}
          name="automatedSubNature"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.automated_type')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" placeholder="Contoh: Automated Calculation" /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supportingApp"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.supporting_app')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="executingFunction"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.executing_function')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="executorRole"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.executor_role')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="affectedFsliItem"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.affected_fsli_item')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="effectivePeriod"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.effective_period')}</FormLabel>
              <FormControl><Input {...field} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="supportingDocs"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{t('matrix.supporting_docs')}</FormLabel>
            <FormControl><Textarea {...field} rows={2} className="min-h-[44px] text-base md:text-sm border-slate-200 rounded-lg" /></FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h4 className="text-xs font-bold uppercase text-slate-500 mb-2.5 tracking-wider">{t('csa_hub:tod.complianceMarkers')}</h4>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-2">
            {IPO_FIELDS.map(field => (
              <FormField
                key={field}
                control={form.control}
                name={field}
                render={({ field: control }) => (
                  <FormItem className="flex items-center justify-between gap-1 space-y-0 p-2 rounded-lg border border-slate-200 bg-white shadow-xs flex-wrap min-w-0 sm:flex-col sm:items-center sm:justify-center">
                    <FormLabel className="text-xs font-bold uppercase text-slate-700 min-w-0 truncate flex-1 sm:flex-none">{IPO_CODE[field]}</FormLabel>
                    <FormControl><Switch checked={control.value} onCheckedChange={control.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-2">{t('rcm:matrix.assertions')}</span>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {ASSERTION_FIELDS.map(field => (
              <FormField
                key={field}
                control={form.control}
                name={field}
                render={({ field: control }) => (
                  <FormItem className="flex flex-col items-center gap-1 space-y-0 p-1.5 rounded-lg border border-slate-200 bg-white shadow-xs">
                    <FormLabel className="text-xs font-bold text-slate-700">{ASSERTION_CODE[field]}</FormLabel>
                    <FormControl><Switch checked={control.value} onCheckedChange={control.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
