import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Control } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, Loader2, ShieldCheck, Database, Filter, Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const COSO_PRINCIPLES = [
  { id: 1, name: "Integritas dan Nilai Etika", component: "Lingkungan Pengendalian" },
  { id: 2, name: "Pengawasan Dewan Komisaris", component: "Lingkungan Pengendalian" },
  { id: 3, name: "Struktur, Wewenang & Tanggung Jawab", component: "Lingkungan Pengendalian" },
  { id: 4, name: "Komitmen terhadap Kompetensi", component: "Lingkungan Pengendalian" },
  { id: 5, name: "Akuntabilitas Personel", component: "Lingkungan Pengendalian" },
  { id: 6, name: "Tujuan Pengendalian Intern", component: "Penilaian Risiko" },
  { id: 7, name: "Identifikasi & Analisis Risiko", component: "Penilaian Risiko" },
  { id: 8, name: "Risiko Kecurangan (Fraud)", component: "Penilaian Risiko" },
  { id: 9, name: "Analisis Perubahan Signifikan", component: "Penilaian Risiko" },
  { id: 10, name: "Menentukan Aktivitas Pengendalian", component: "Aktivitas Pengendalian" },
  { id: 11, name: "Pengendalian Umum TI (ITGC)", component: "Aktivitas Pengendalian" },
  { id: 12, name: "Kebijakan dan Prosedur", component: "Aktivitas Pengendalian" },
  { id: 13, name: "Informasi Relevan & Berkualitas", component: "Informasi dan Komunikasi" },
  { id: 14, name: "Komunikasi Internal Efektif", component: "Informasi dan Komunikasi" },
  { id: 15, name: "Komunikasi Eksternal Efektif", component: "Informasi dan Komunikasi" },
  { id: 16, name: "Evaluasi Berkelanjutan & Terpisah", component: "Pemantauan" },
  { id: 17, name: "Evaluasi & Komunikasi Defisiensi", component: "Pemantauan" },
];

export function RCMELCPage() {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [localMeta, setLocalMeta] = React.useState<Record<number, any>>({});

  const { data: controlsData, isLoading } = useQuery({
    queryKey: ['controls-elc'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const elcControls = (controlsData?.items || []).filter(c => c.level === 'ELC');

  const handleInputChange = (principleId: number, field: string, value: any) => {
    setLocalMeta(prev => ({
      ...prev,
      [principleId]: { ...(prev[principleId] || {}), [field]: value }
    }));
  };

  return (
    <AppLayout container>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RCM ELC Matrix</h1>
            <p className="text-muted-foreground italic text-sm">Entity Level Control Matrix (17 COSO Principles) according to SK-5 Lampiran 5 a.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
              <Save className="h-4 w-4 mr-2" /> Save Matrix
            </Button>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-x-auto relative">
          <Table className="min-w-[1500px]">
            <TableHeader className="bg-slate-50/80 sticky top-0 z-20">
              <TableRow className="divide-x border-b">
                <TableHead className="w-[80px] font-black uppercase text-[10px] text-center sticky left-0 z-30 bg-slate-50">No</TableHead>
                <TableHead className="w-[300px] font-black uppercase text-[10px] sticky left-[80px] z-30 bg-slate-50">Prinsip COSO</TableHead>
                <TableHead className="w-[400px] font-black uppercase text-[10px] text-indigo-900 bg-indigo-50/30">Aktivitas Pengendalian (Kebijakan)</TableHead>
                <TableHead className="w-[120px] font-black uppercase text-[10px] text-center">Frekuensi</TableHead>
                <TableHead className="w-[150px] font-black uppercase text-[10px]">Pelaksana</TableHead>
                <TableHead className="w-[200px] font-black uppercase text-[10px]">Dokumen Pendukung</TableHead>
                <TableHead className="w-[100px] font-black uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="w-[150px] font-black uppercase text-[10px]">Periode Efektif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="h-64 text-center">Loading ELC data...</TableCell></TableRow>
              ) : COSO_PRINCIPLES.map((principle, idx) => {
                const relatedControls = elcControls.filter(c => c.cosoPrinciples?.includes(principle.id as any));
                const isFirstOfComponent = idx === 0 || principle.component !== COSO_PRINCIPLES[idx-1].component;

                return (
                  <React.Fragment key={principle.id}>
                    {isFirstOfComponent && (
                      <TableRow className="bg-slate-100/50 hover:bg-slate-100/50 border-y-2 border-slate-200">
                        <TableCell colSpan={8} className="py-2 px-4">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{principle.component}</span>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="group hover:bg-indigo-50/10 transition-colors divide-x divide-slate-100">
                      <TableCell className="text-center font-black text-slate-400 text-xs sticky left-0 z-10 bg-white">
                        {principle.id}
                      </TableCell>
                      <TableCell className="align-top py-4 sticky left-[80px] z-10 bg-white">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{principle.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">COSO Principle {principle.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-0">
                         <div className="flex flex-col divide-y divide-slate-100 min-h-[60px]">
                            {relatedControls.length > 0 ? relatedControls.map(ctrl => (
                              <div key={ctrl.id} className="p-3 hover:bg-indigo-50/30 transition-colors group/ctrl">
                                 <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] font-mono h-4">{ctrl.code || 'N/A'}</Badge>
                                    <span className="text-xs font-bold text-slate-700">{ctrl.name}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">"{ctrl.description}"</p>
                              </div>
                            )) : (
                              <div className="flex items-center gap-2 p-4 text-slate-300 italic text-xs">
                                 <Info className="h-3 w-3" /> Belum ada kebijakan yang dipetakan.
                              </div>
                            )}
                         </div>
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-center text-xs" placeholder="Tahunan/Ad-hoc" />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" placeholder="Jabatan/Fungsi..." />
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" placeholder="URL/File Ref..." />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                         {relatedControls.length > 0 ? (
                           <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] shadow-sm">TERPETAKAN</Badge>
                         ) : (
                           <Badge variant="outline" className="text-rose-400 border-rose-200 bg-rose-50 text-[9px] font-black">GAP</Badge>
                         )}
                      </TableCell>
                      <TableCell className="p-0">
                         <Input className="h-full border-none focus-visible:ring-0 text-xs px-3" placeholder="Contoh: 2024" />
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
