import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { CONTROL_NATURES, ALL_FREQUENCIES } from '@/lib/constants';

export const ControlEditorGeneralSection = ({ form, applicationsData }: { form: any, applicationsData: any }) => {
  const { t } = useTranslation(['rcm', 'common']);
  const nature = form.watch('nature');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="code" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.control_ref')}</FormLabel>
            <FormControl>
              <Input placeholder="e.g. P2P-01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.control_name')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
        
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem>
          <FormLabel>{t('matrix.control_description')}</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="isKeyControl" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{t('matrix.is_key_control')}</FormLabel>
            </div>
          </FormItem>
        )} />
        <FormField control={form.control} name="isFraudRelated" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-red-50/30 border-red-100">
            <FormControl>
              <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-red-800">{t('matrix.fraud_related')}</FormLabel>
            </div>
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.type')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Preventive">Preventive</SelectItem>
                <SelectItem value="Detective">Detective</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="nature" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.nature')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {CONTROL_NATURES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>

      {(nature === 'Automated' || nature === 'ITDM - IPE' || nature === 'ITDM - EUC') && (
        <FormField control={form.control} name="itApplication" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.supporting_app')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('common:placeholders.app')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {applicationsData?.items.map((app: any) => <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>)}
                <SelectItem value="Other">{t('common:actions.all')}</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="effectiveDate" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.effective_period')}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="frequency" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('matrix.frequency')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {ALL_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
    </div>
  );
};
