import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ELCFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function ELCForm({ data, onChange }: ELCFormProps) {
  const { t } = useTranslation(['bpm', 'common']);

  const cosoPrinciples = [
    { id: 1, label: 'P1', desc: 'Integritas & Nilai Etika' },
    { id: 2, label: 'P2', desc: 'Pengawasan Pengendalian' },
    { id: 3, label: 'P3', desc: 'Struktur & Wewenang' },
    { id: 4, label: 'P4', desc: 'Kompetensi Personel' },
    { id: 5, label: 'P5', desc: 'Akuntabilitas Personel' },
    { id: 6, label: 'P6', desc: 'Tujuan Pengendalian' },
    { id: 7, label: 'P7', desc: 'Identifikasi Risiko' },
    { id: 8, label: 'P8', desc: 'Risiko Fraud' },
    { id: 9, label: 'P9', desc: 'Perubahan Signifikan' },
    { id: 10, label: 'P10', desc: 'Aktivitas Mitigasi' },
    { id: 11, label: 'P11', desc: 'Pengendalian Teknologi' },
    { id: 12, label: 'P12', desc: 'Kebijakan & Prosedur' },
    { id: 13, label: 'P13', desc: 'Informasi Relevan' },
    { id: 14, label: 'P14', desc: 'Komunikasi Internal' },
    { id: 15, label: 'P15', desc: 'Komunikasi Eksternal' },
    { id: 16, label: 'P16', desc: 'Evaluasi Berkelanjutan' },
    { id: 17, label: 'P17', desc: 'Komunikasi Defisiensi' }
  ];

  const currentMapping = data.cosoPrinciples || [];

  const handleToggle = (id: number, val: string) => {
    let nextMapping = [...currentMapping];
    if (val === 'Y') {
      if (!nextMapping.includes(id)) nextMapping.push(id);
    } else {
      nextMapping = nextMapping.filter(p => p !== id);
    }
    onChange('cosoPrinciples', nextMapping.sort((a, b) => a - b));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 mb-2">
        <h4 className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Pemetaan 17 Prinsip COSO (Lampiran 1)</h4>
        <p className="text-[9px] text-slate-500 italic">Tentukan prinsip COSO mana yang dipayungi oleh kontrol entitas ini.</p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b px-3 py-1.5 flex justify-between items-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Prinsip COSO</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Relevan?</span>
        </div>
        <ScrollArea className="h-[250px]">
          <div className="divide-y">
            {cosoPrinciples.map((p) => (
              <div key={p.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-[9px] h-5 w-8 flex justify-center bg-indigo-50 border-indigo-100 text-indigo-700">
                    {p.label}
                  </Badge>
                  <span className="text-[10px] font-medium text-slate-700">{p.desc}</span>
                </div>
                <Select 
                  value={currentMapping.includes(p.id) ? 'Y' : 'N'} 
                  onValueChange={(v) => handleToggle(p.id, v)}
                >
                  <SelectTrigger className="h-7 text-[9px] w-16 bg-white">
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
        </ScrollArea>
      </div>
    </div>
  );
}
