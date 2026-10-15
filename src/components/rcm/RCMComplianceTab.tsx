import type { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { RcmFormValues, RcmTFunction } from './rcm-form-schema';

interface RCMComplianceTabProps {
  form: UseFormReturn<RcmFormValues>;
  t: RcmTFunction;
}

const IPO_ITEMS = [
  { name: 'ipoC', label: 'C', tip: 'c' },
  { name: 'ipoA', label: 'A', tip: 'a' },
  { name: 'ipoV', label: 'V', tip: 'v' },
  { name: 'ipoRa', label: 'RA', tip: 'ra' },
] as const;

const ASSERTION_ITEMS = [
  { name: 'assertionE', label: 'E/O', tip: 'eo' },
  { name: 'assertionC', label: 'C', tip: 'c' },
  { name: 'assertionA', label: 'A', tip: 'a' },
  { name: 'assertionCo', label: 'CO', tip: 'co' },
  { name: 'assertionVa', label: 'V/A', tip: 'va' },
  { name: 'assertionRo', label: 'R&O', tip: 'ro' },
  { name: 'assertionPd', label: 'PD', tip: 'pd' },
] as const;

export function RCMComplianceTab({ form, t }: RCMComplianceTabProps) {
  return (
    <div className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Badge className="bg-blue-600 text-xs font-black">IPO</Badge>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{t('matrix.ipo')}</h3>
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {IPO_ITEMS.map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-blue-50/30 transition-colors">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="leading-none flex-1">
                      <div className="flex items-center gap-1.5">
                        <FormLabel className="text-xs font-black text-blue-700 cursor-default">{item.label}</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="cursor-help text-slate-300 hover:text-blue-500 transition-colors focus:outline-none">
                              <Info className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] p-3 rounded-xl shadow-xl border-none bg-slate-900 text-white z-[1100]">
                            <p className="text-xs font-bold text-blue-400">{item.label} - {t(`bpm:ipo.tooltip.${item.tip}.label`)}</p>
                            <p className="text-xs mt-1 text-slate-300 leading-relaxed">&quot;{t(`bpm:ipo.tooltip.${item.tip}.desc`)}&quot;</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1 line-clamp-1">{t(`bpm:ipo.tooltip.${item.tip}.label`)}</p>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Badge className="bg-indigo-600 text-xs font-black">ASERSi</Badge>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{t('matrix.assertions')}</h3>
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {ASSERTION_ITEMS.map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-indigo-50/30 transition-colors">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="leading-none flex-1">
                      <div className="flex items-center gap-1.5">
                        <FormLabel className="text-xs font-black text-indigo-700 cursor-default">{item.label}</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="cursor-help text-slate-300 hover:text-indigo-500 transition-colors focus:outline-none">
                              <Info className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] p-3 rounded-xl shadow-xl border-none bg-slate-900 text-white z-[1100]">
                            <p className="text-xs font-bold text-indigo-400">{item.label} - {t(`bpm:assertions.tooltip.${item.tip}.label`)}</p>
                            <p className="text-xs mt-1 text-slate-300 leading-relaxed">&quot;{t(`bpm:assertions.tooltip.${item.tip}.desc`)}&quot;</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1 line-clamp-1">{t(`bpm:assertions.tooltip.${item.tip}.label`)}</p>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
