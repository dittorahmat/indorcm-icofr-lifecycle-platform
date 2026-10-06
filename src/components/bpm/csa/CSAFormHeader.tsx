import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import type { CSAFormValues } from '@/hooks/use-csa';
import { FileText, MapPin } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCsaReference } from '@/lib/csa-utils';
import { RESULT_LABEL_KEYS, RESULT_OPTIONS } from './csa-form-types';

interface CSAFormHeaderProps {
  form: UseFormReturn<CSAFormValues>;
  isReadOnly: boolean;
  anyPointFailed: boolean;
  bpmCode?: string;
  noGL?: string;
  bpmProcessId?: string;
  year?: string | number;
}

export function CSAFormHeader({ form, isReadOnly, anyPointFailed, bpmCode, noGL, bpmProcessId, year }: CSAFormHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
        <div className="flex flex-col justify-center space-y-1">
          <span className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.referenceCodeLabel')}</span>
          <div className="flex items-center h-9 px-3 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-indigo-700 shadow-xs truncate">
            {formatCsaReference({
              bpmCode,
              noGL,
              bpmProcessId,
              year,
              period: form.watch('period') as string,
            })}
          </div>
        </div>

        <FormField
          control={form.control}
          name="period"
          render={({ field: f }) => {
            const currentYear = year || new Date().getFullYear().toString();
            const q1Val = `${currentYear}-Q1`;
            const q2Val = `${currentYear}-Q2`;
            const q3Val = `${currentYear}-Q3`;
            const q4Val = `${currentYear}-Q4`;
            const standardVals = [q1Val, q2Val, q3Val, q4Val];
            const isCustomVal = f.value && !standardVals.includes(f.value);

            return (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.periodLabel')}</FormLabel>
                <Select value={f.value as string} onValueChange={f.onChange} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger className="h-9 min-h-[44px] font-bold text-base md:text-xs bg-white">
                      <SelectValue placeholder={t('csa_hub:form.selectQuarter')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={q1Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q1')}</SelectItem>
                    <SelectItem value={q2Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q2')}</SelectItem>
                    <SelectItem value={q3Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q3')}</SelectItem>
                    <SelectItem value={q4Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q4')}</SelectItem>
                    {isCustomVal && (
                      <SelectItem value={f.value as string} className="text-xs font-bold">{f.value as string}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            );
          }}
        />

        <div className="col-span-1 md:col-span-2">
          <FormField
            control={form.control}
            name="result"
            render={({ field: f }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.resultLabel')}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={f.onChange} value={f.value as string} className="flex gap-4 pt-1" disabled={isReadOnly}>
                    {RESULT_OPTIONS.map((res) => (
                      <div key={res} className="flex items-center space-x-2">
                        <RadioGroupItem value={res} id={res} disabled={res === 'Effective' && anyPointFailed} />
                        <label htmlFor={res} className={cn('text-xs font-bold', res === 'Effective' ? 'text-green-700' : 'text-red-700')}>
                          {t(RESULT_LABEL_KEYS[res] as string)}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="isBpmConfirmed"
        render={({ field: f }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <FormControl>
              <Checkbox checked={f.value as boolean} onCheckedChange={f.onChange} disabled={isReadOnly} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-xs font-bold text-slate-900 cursor-pointer">
                {t('csa_hub:form.bpmConfirmTitle', { defaultValue: 'Konfirmasi Konsistensi BPM' })}
              </FormLabel>
              <p className="text-xs text-slate-700 leading-tight">
                {t('csa_hub:form.bpmConfirmDesc', {
                  defaultValue: 'Sesuai regulasi SK-5 Bab IV Bagian 2.2a, saya mengonfirmasi alur proses dan narasi kontrol masih sesuai dengan kondisi riil.',
                })}
              </p>
            </div>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50/50 border border-slate-200 rounded-lg">
        <FormField
          control={form.control}
          name="testProcedure"
          render={({ field: f }) => (
            <FormItem className="col-span-1">
              <FormLabel className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                <FileText className="h-3 w-3" /> {t('csa_hub:appendix7a.testProcedure')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...f}
                  value={f.value as string}
                  disabled={isReadOnly}
                  className="min-h-[100px] text-base md:text-xs bg-white"
                  placeholder={t('csa_hub:appendix7a.procedurePlaceholder') as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="archiveLocation"
          render={({ field: f }) => (
            <FormItem className="col-span-1">
              <FormLabel className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {t('csa_hub:appendix7a.archiveLocation')}
              </FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value as string}
                  disabled={isReadOnly}
                  className="h-10 min-h-[44px] text-base md:text-xs bg-white"
                  placeholder={t('csa_hub:appendix7a.locationPlaceholder') as string}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-slate-400 mt-2">{t('csa_hub:appendix7a.archiveNote')}</p>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
