import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ITGCFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function ITGCForm({ data, onChange }: ITGCFormProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common']);

  const domains = [
    { id: 'Access to Program and Data', label: 'Access to Program and Data', desc: t('rcm:matrix.itgc.domains.access') },
    { id: 'Program Development', label: 'Program Development', desc: t('rcm:matrix.itgc.domains.development') },
    { id: 'Program Changes', label: 'Program Changes', desc: t('rcm:matrix.itgc.domains.changes') },
    { id: 'Computer Operations', label: 'Computer Operations', desc: t('rcm:matrix.itgc.domains.operations') }
  ];

  const automatedTypes = [
    { id: 'Automated Control', label: 'Automated Control' },
    { id: 'Automated Calculation', label: 'Automated Calculation' },
    { id: 'Restricted Access', label: 'Restricted Access' },
    { id: 'Interface', label: 'Interface' }
  ];

  const itAssertions = [
    { key: 'confidentiality', label: 'Confidentiality', tooltip: 'Data diproteksi dari akses tidak sah; hanya dapat diakses oleh pihak yang diotorisasi (Hal 38).' },
    { key: 'integrity', label: 'Integrity', tooltip: 'Memastikan data akurat dan formula/logika sistem terlindungi dari modifikasi yang tidak diinginkan (Hal 43).' },
    { key: 'availability', label: 'Availability', tooltip: 'Memastikan sistem dan data tersedia saat dibutuhkan melalui backup dan restore testing berkala (Hal 43).' },
    { key: 'completeness', label: 'Completeness', tooltip: 'Menjamin seluruh transaksi yang seharusnya terjadi telah tercatat sepenuhnya dalam sistem (Hal 38).' },
    { key: 'authenticity', label: 'Authenticity', tooltip: 'Menjamin bahwa data atau transaksi berasal dari sumber yang sah dan terverifikasi (Hal 38).' }
  ];

  const currentAssertions = data.itgcAssertions || {};

  const handleAssertionChange = (key: string, val: string) => {
    onChange('itgcAssertions', {
      ...currentAssertions,
      [key]: val
    });
  };

  const isAutomatedRelated = data.controlNature === 'Automated' || 
                             data.controlNature?.startsWith('ITDM') || 
                             data.controlNature === 'MRC';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase text-indigo-900 tracking-wider">Domain ITGC (Lampiran 5.c)</Label>
        <TooltipProvider>
          <Select 
            value={data.itgcDomain || ''} 
            onValueChange={(v) => onChange('itgcDomain', v)}
          >
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Pilih Area ITGC..." />
            </SelectTrigger>
            <SelectContent>
              {domains.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex flex-col items-start max-w-[300px]">
                    <span className="font-bold">{d.label}</span>
                    <span className="text-xs opacity-50 whitespace-normal leading-tight text-left">{d.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TooltipProvider>
      </div>

      {isAutomatedRelated && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-indigo-900 tracking-wider">Jenis Pengendalian Otomatis</Label>
            <Select 
              value={data.automatedControlType || ''} 
              onValueChange={(v) => onChange('automatedControlType', v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue placeholder="Pilih Tipe..." />
              </SelectTrigger>
              <SelectContent>
                {automatedTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-indigo-900 tracking-wider">Aplikasi Pendukung</Label>
            <Input 
              value={data.supportingApp || ''}
              onChange={(e) => onChange('supportingApp', e.target.value)}
              placeholder="Misal: SAP, Oracle, dll"
              className="h-9 text-xs bg-white"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">IT Assertion (CIA)</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-xs">
                  Asersi CIA ini digunakan untuk dokumentasi internal (Tabel 14 SK-5) dan tidak akan muncul pada Matriks RCM resmi.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-slate-500 italic">Dokumentasi teknis keandalan sistem.</p>
        </div>

        <TooltipProvider>
          <div className="border rounded-lg bg-white shadow-sm divide-y">
            {itAssertions.map((a) => (
              <div key={a.key} className="px-3 py-2 flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase">{a.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-slate-300 group-hover:text-indigo-400 transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] text-xs">
                      {a.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select 
                  value={currentAssertions[a.key] || 'N'} 
                  onValueChange={(v) => handleAssertionChange(a.key, v)}
                >
                  <SelectTrigger className="h-7 text-xs w-16 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y">Y</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
