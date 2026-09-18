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

export function TODDesignContextFields({ form }: { form: UseFormReturn<any> }) {
  const { t } = useTranslation(['rcm', 'csa_hub', 'common', 'risklibrary']);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-6">
        <Target className="h-4 w-4" />
        {t('csa_hub:tod.designContext')}
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
            <FormItem className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 h-9 mt-auto">
              <FormLabel className="text-xs font-black uppercase text-slate-400 mb-0">{t('rcm:matrix.properties.fraud_related_q')}</FormLabel>
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
          <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">{t('csa_hub:tod.complianceMarkers')}</h4>
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
  );
}
