import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <FormItem className="flex flex-row items-center space-x-2 space-y-0 py-1">
        <FormControl>
          <Checkbox
            checked={field.value === 'Y'}
            onCheckedChange={(checked) => field.onChange(checked ? 'Y' : 'N')}
          />
        </FormControl>
        <FormLabel className="text-xs font-normal cursor-pointer">{label}</FormLabel>
      </FormItem>
    )}
  />
);

export function BasicInfoTabContent({ form }: { form: UseFormReturn<any> }) {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-1">
          <FormField
            control={form.control}
            name="controlCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">{t('rcm:verification.add_dialog.control_code_label')}</FormLabel>
                <FormControl><Input placeholder="CTRL-001 (auto if empty)" {...field} /></FormControl>
                <FormDescription className="text-xs">{t('rcm:verification.add_dialog.control_code_hint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <FormField
            control={form.control}
            name="controlName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.control_name')} *</FormLabel>
                <FormControl><Input placeholder="e.g. Otorisasi Setoran di atas limit" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <FormField
        control={form.control}
        name="controlDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold">{t('rcm:matrix.control_description')}</FormLabel>
            <FormControl><Textarea className="h-28" placeholder="Detailed procedure description..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="supportingDocs"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold">{t('rcm:matrix.supporting_docs')}</FormLabel>
            <FormControl><Input placeholder="e.g. Slip Setoran, Log Sistem" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="isKeyControl"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm hover:bg-slate-50 transition-colors">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-xs font-bold cursor-pointer">{t('rcm:verification.columns.is_key')}</FormLabel>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

export function IpoAssertionTabContent({ form }: { form: UseFormReturn<any> }) {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
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
    </div>
  );
}

export function NatureTabContent({ form }: { form: UseFormReturn<any> }) {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="controlType"
          render={({ field }) => (
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
          )}
        />
        <FormField
          control={form.control}
          name="controlNature"
          render={({ field }) => (
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
          )}
        />
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
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
          )}
        />
        <FormField
          control={form.control}
          name="effectivePeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:matrix.effective_period')}</FormLabel>
              <FormControl><Input placeholder="e.g. 2026" {...field} /></FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
