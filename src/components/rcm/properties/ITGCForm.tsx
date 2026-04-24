import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ITGCFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function ITGCForm({ data, onChange }: ITGCFormProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const domains = [
    { id: 'access', label: 'Access to Program and Data', desc: 'Pengelolaan hak akses lingkungan TI' },
    { id: 'development', label: 'Program Development', desc: 'Tata kelola pengembangan/akuisisi sistem' },
    { id: 'changes', label: 'Program Changes', desc: 'Manajemen perubahan dan migrasi' },
    { id: 'operations', label: 'Computer Operations', desc: 'Manajemen operasional (Backup/Incident)' }
  ];

  const itAssertions = [
    { key: 'confidentiality', label: 'Confidentiality' },
    { key: 'integrity', label: 'Integrity' },
    { id: 'availability', label: 'Availability', key: 'availability' },
    { id: 'completeness', label: 'Completeness', key: 'completeness' },
    { id: 'authenticity', label: 'Authenticity', key: 'authenticity' }
  ];

  const currentAssertions = data.itgcAssertions || {};

  const handleAssertionChange = (key: string, val: string) => {
    onChange('itgcAssertions', {
      ...currentAssertions,
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Domain ITGC (Lampiran 5.c)</Label>
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
                <div className="flex flex-col items-start">
                  <span className="font-bold">{d.label}</span>
                  <span className="text-[9px] opacity-50">{d.desc}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">IT Assertion (Dummy Mapping)</h4>
          <p className="text-[9px] text-slate-500 italic">Petakan tujuan teknis kontrol ke kriteria asersi TI.</p>
        </div>

        <div className="border rounded-lg bg-white shadow-sm divide-y">
          {itAssertions.map((a) => (
            <div key={a.key} className="px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase">{a.label}</span>
              <Select 
                value={currentAssertions[a.key] || 'N'} 
                onValueChange={(v) => handleAssertionChange(a.key, v)}
              >
                <SelectTrigger className="h-7 text-[9px] w-16 bg-slate-50">
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
      </div>
    </div>
  );
}
