import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TLCFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
}

export function TLCForm({ data, onChange, disabled = false }: TLCFormProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const ipoFields = [
    { key: 'ipoC', label: 'C', fullName: 'Completeness', tooltip: t('bpm:ipo.tooltip.c.desc') },
    { key: 'ipoA', label: 'A', fullName: 'Accuracy', tooltip: t('bpm:ipo.tooltip.a.desc') },
    { key: 'ipoV', label: 'V', fullName: 'Validity', tooltip: t('bpm:ipo.tooltip.v.desc') },
    { key: 'ipoRa', label: 'RA', fullName: 'Restricted Access', tooltip: t('bpm:ipo.tooltip.ra.desc') }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 mb-2">
        <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Information Processing Objective (IPO)</h4>
        <p className="text-xs text-slate-500 italic">Petakan tujuan pemrosesan informasi untuk kontrol tingkat transaksi ini.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border rounded-lg p-3 bg-white shadow-sm">
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
                <SelectTrigger className="h-8 text-xs w-full bg-slate-50/50">
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
