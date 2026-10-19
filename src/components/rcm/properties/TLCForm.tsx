import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { IPO_CODE, IPO_FIELDS, IPO_TIP } from '@shared/assertion-fields';

interface TLCFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function TLCForm({ data, onChange, disabled = false }: TLCFormProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const ipoFields = IPO_FIELDS.map((key) => ({
    key,
    label: IPO_CODE[key],
    fullName: t(`bpm:ipo.tooltip.${IPO_TIP[key]}.label`),
    tooltip: t(`bpm:ipo.tooltip.${IPO_TIP[key]}.desc`),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 mb-2">
        <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">{t('bpm:ipo.title')}</h4>
        <p className="text-xs text-slate-500">{t('bpm:ipo.description')}</p>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-2 border rounded-lg p-3 bg-white shadow-sm">
        <TooltipProvider>
          {ipoFields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-1 group">
                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{field.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-2.5 w-2.5 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    <p className="font-bold border-b border-white/20 mb-1 pb-1">{field.fullName}</p>
                    <p>{field.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                disabled={disabled}
                value={data[field.key] || 'N'} 
                onValueChange={(v) => onChange(field.key, v)}
              >
                <SelectTrigger className="h-11 min-h-[44px] text-base md:text-xs w-full bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">Yes (Y)</SelectItem>
                  <SelectItem value="N">No (N)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
