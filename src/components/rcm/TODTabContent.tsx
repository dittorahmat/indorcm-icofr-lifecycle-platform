import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface TODTabContentProps {
  form: UseFormReturn<any>;
  conclusionValue: string;
}

export function TODTabContent({ form, conclusionValue }: TODTabContentProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="pilarObjective"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_obj')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pilarTiming"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_time')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pilarAuthority"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_auth')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pilarReliability"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_rel')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pilarCoverage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_cov')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pilarEvidence"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.p_evid')}</FormLabel>
              <FormControl><Textarea placeholder="..." {...field} className="h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <FormField
          control={form.control}
          name="kkReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.kk_ref')}</FormLabel>
              <FormControl><Input placeholder="e.g. KK-TOD-01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="conclusion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">{t('rcm:verification.columns.conclusion')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common:placeholders.choose')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Effective">{t('common:status.effective')}</SelectItem>
                  <SelectItem value="Ineffective">{t('common:status.ineffective')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {conclusionValue === 'Ineffective' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            Auto-deficiency akan dibuat setelah asesmen ini disimpan.
          </p>
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-red-700">Justifikasi / Catatan Defisiensi *</FormLabel>
                <FormControl>
                  <Textarea className="h-24 border-red-300 focus:border-red-500" placeholder="Jelaskan alasan kesimpulan Ineffective..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {conclusionValue !== 'Ineffective' && (
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Catatan / Komentar</FormLabel>
              <FormControl><Textarea className="h-20" placeholder="Komentar tambahan..." {...field} /></FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
