import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, FileText, Target, ChevronRight, Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RegulatorySamplingTable } from './RegulatorySamplingTable';
import { SampleRange } from '@/lib/compliance-utils';
import { TestFormValues } from './test-schema';

interface TOETabContentProps {
  suggestion: SampleRange;
  isAuthenticating: boolean;
  isPending: boolean;
}

export function TOETabContent({ suggestion, isAuthenticating, isPending }: TOETabContentProps) {
  const { t } = useTranslation('testing');
  const form = useFormContext<TestFormValues>();
  const sampleSize = form.watch('sampleSize');
  const isBelowMin = sampleSize !== undefined && sampleSize < suggestion.min;

  return (
    <div className="space-y-6 sm:space-y-8 m-0 outline-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-5 sm:space-y-6">
          <div className={cn(
            "p-4 sm:p-5 rounded-lg flex items-start gap-3 sm:gap-4 border transition-all duration-300",
            isBelowMin 
              ? "bg-rose-50/50 border-rose-200 shadow-xs" 
              : "bg-indigo-50/50 border-indigo-100 shadow-xs"
          )}>
            <div className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 rounded-md flex items-center justify-center shrink-0 shadow-xs",
              isBelowMin ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {isBelowMin ? <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" /> : <Info className="h-5 w-5 sm:h-6 sm:w-6" />}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className={cn("text-xs font-bold uppercase tracking-wider", isBelowMin ? "text-rose-800" : "text-indigo-800")}>
                {isBelowMin ? t('validation.samplingViolation') : t('toe.suggestion')}
              </p>
              <p className={cn("text-xs font-normal leading-relaxed", isBelowMin ? "text-rose-700" : "text-indigo-700")}>
                {isBelowMin ? t('validation.samplingWarning', { min: suggestion.min }) : `${t('toe.requiredSample')}: ${suggestion.label}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="sampleSize" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex justify-between items-center px-0.5 flex-wrap gap-2">
                  <span>{t('toe.sampleSize')}</span>
                  {isBelowMin && (
                    <Badge variant="destructive" className="text-xs font-semibold h-5 px-1.5 border-none shadow-none uppercase rounded">
                      {t('toe.belowMin')}
                    </Badge>
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value, 10))} 
                      className={cn(
                        "h-11 font-bold rounded-lg transition-all text-base sm:text-xs", 
                        isBelowMin ? "border-rose-300 bg-rose-50 focus:ring-rose-500/20" : "bg-slate-50 border-slate-200 focus:bg-white"
                      )} 
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400 uppercase tracking-tight">
                      Units
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-semibold" />
              </FormItem>
            )} />

            <FormField control={form.control} name="method" render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-0.5">
                  {t('actions.method')}
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 font-semibold rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-all text-base sm:text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-lg border-slate-200">
                    <SelectItem value="Inquiry" className="text-xs font-semibold py-2">Inquiry</SelectItem>
                    <SelectItem value="Observation" className="text-xs font-semibold py-2">Observation</SelectItem>
                    <SelectItem value="Inspection" className="text-xs font-semibold py-2">Inspection</SelectItem>
                    <SelectItem value="Reperformance" className="text-xs font-semibold py-2">Reperformance</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="homogeneityJustification" render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 px-0.5">
                <FileText className="h-3.5 w-3.5" />
                <span>{t('toe.homogeneity')}</span>
                {isBelowMin && <span className="text-rose-500 font-bold">*</span>}
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  className={cn(
                    "min-h-[90px] text-base sm:text-xs font-normal rounded-lg resize-none transition-all p-3",
                    isBelowMin && !field.value ? "border-rose-300 bg-rose-50/30 focus:ring-rose-500/20" : "bg-slate-50 border-slate-200 focus:bg-white"
                  )} 
                  placeholder={t('toe.homogeneityPlaceholder')}
                />
              </FormControl>
              <FormMessage className="text-xs font-semibold" />
            </FormItem>
          )} />
        </div>

        <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              Regulatory Note
            </h4>
            <Badge variant="outline" className="text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">SAMPLE BASIS</Badge>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Pengambilan sampel harus didasarkan pada populasi transaksi selama periode penilaian untuk memastikan efektivitas operasional yang konsisten.
            </p>
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirement</span>
              <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">Zero Tolerance <ChevronRight className="h-3.5 w-3.5" /></span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 pt-2">
        <div className="flex items-center gap-2 px-0.5 mb-1">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Transaction Sample Testing</h4>
        </div>
        <RegulatorySamplingTable control={form.control} t={t} />
      </div>

      <FormField control={form.control} name="comments" render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-0.5">{t('toe.comments')}</FormLabel>
          <FormControl>
            <Textarea 
              placeholder={t('toe.placeholder')} 
              {...field} 
              className="min-h-[100px] text-base sm:text-xs font-normal bg-slate-50 border-slate-200 focus:bg-white rounded-lg transition-all resize-none p-3.5" 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-wrap min-w-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-0">
          <Fingerprint className="h-4 w-4 text-indigo-500 shrink-0" />
          Certified Evidence Submission
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Button 
            type="submit" 
            disabled={isAuthenticating || isPending} 
            onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Ineffective'); }} 
            variant="outline" 
            className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50 transition-all w-full sm:w-auto justify-center min-h-[44px]"
          >
            {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <AlertTriangle className="h-4 w-4 mr-2"/>} 
            {t('actions.ineffective')}
          </Button>
          <Button 
            type="submit" 
            disabled={isAuthenticating || isPending} 
            onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Effective'); }} 
            className="h-11 px-6 sm:px-8 rounded-lg font-bold text-xs uppercase tracking-wider bg-mancity-pattern hover:opacity-90 shadow-sm transition-all text-primary-foreground w-full sm:w-auto justify-center min-h-[44px]"
          >
            {isAuthenticating ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <ShieldCheck className="h-4 w-4 mr-2"/>} 
            {t('actions.effective')}
          </Button>
        </div>
      </div>
    </div>
  );
}
