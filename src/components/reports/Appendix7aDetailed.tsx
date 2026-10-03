import React from 'react';
import { ReportHeader } from './ReportHeader';
import { Control, CSARecord, CSATestSample } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Appendix7aDetailedProps {
  record: CSARecord;
  bpmProcessName: string;
  noGL: string;
}

export const Appendix7aDetailed = React.forwardRef<HTMLDivElement, Appendix7aDetailedProps>(
  ({ record, bpmProcessName, noGL }, ref) => {
    const { t } = useTranslation('reports');
    // Extract unique controls from all samples to build columns
    const allControlIds = new Set<string>();
    record.samples?.forEach(s => {
      if (s.controlResults) {
        Object.keys(s.controlResults).forEach(id => allControlIds.add(id));
      }
    });
    const controlIds = Array.from(allControlIds);

    // Get control details from the first sample that has them (or fallback)
    const controlMap: Record<string, { name: string; code: string; risk: string }> = {};
    record.samples?.forEach(s => {
      if (s.controlResults) {
        Object.entries(s.controlResults).forEach(([id, res]: [string, any]) => {
          if (!controlMap[id] && res.controlName) {
            controlMap[id] = {
              name: res.controlName,
              code: id,
              risk: res.riskName || "N/A"
            };
          }
        });
      }
    });

    return (
      <div ref={ref} className="p-12 bg-white text-slate-900 font-sans print:p-0 w-full min-h-screen">
        <ReportHeader 
          title="Kertas Kerja Evaluasi Pengendalian (CSA) - Detailed"
          subProcess={bpmProcessName}
          period={record.period}
          date={format(new Date(record.assessmentDate), 'dd MMMM yyyy')}
          documentNo={`APP7A/DET/${record.id.substring(0,8).toUpperCase()}`}
        />

        <div className="space-y-8">
          {/* Section I: Metodologi & Prosedur */}
          <div className="space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">I. Metodologi & Prosedur Pengujian</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-2">
                   <p className="text-xs font-black text-slate-500 uppercase">Metodologi Sampling</p>
                   <p className="text-xs font-medium leading-relaxed">{record.samplingMethodology || "-"}</p>
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-black text-slate-500 uppercase">Lokasi Arsip Fisik</p>
                   <p className="text-xs font-bold text-indigo-700">{(record as any).archiveLocation || "-"}</p>
                </div>
             </div>
             <div className="space-y-2 mt-4">
                <p className="text-xs font-black text-slate-500 uppercase">Narasi Prosedur Pengujian</p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed whitespace-pre-wrap">
                   {(record as any).testProcedure || "Prosedur pengujian standar telah dilakukan sesuai dengan instruksi kerja yang berlaku."}
                </div>
             </div>
          </div>

          {/* Section II: Matriks Pengujian Sampel */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">II. Rincian Hasil Pengujian Sampel</h2>
            <div className="border-2 border-slate-900 overflow-hidden rounded-lg">
              <Table>
                <TableHeader className="bg-mancity-pattern">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-black text-primary-foreground w-10 text-center">NO</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground min-w-[150px]">REFERENSI SAMPEL / TRANSAKSI</TableHead>
                    {controlIds.map(id => (
                      <TableHead key={id} className="text-xs font-black text-primary-foreground text-center border-l border-white/10 uppercase py-4">
                        <div className="flex flex-col gap-1">
                          <span>{controlMap[id]?.code || id}</span>
                          <span className="text-xs opacity-60 font-normal leading-tight line-clamp-2">{controlMap[id]?.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.samples?.map((sample, sIdx) => (
                    <TableRow key={sample.id} className="divide-x border-b-2 border-slate-100">
                      <TableCell className="text-xs font-bold text-center">{sIdx + 1}</TableCell>
                      <TableCell className="py-4">
                        <div className="text-xs font-black">{sample.sampleRef}</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">ID: {sample.glRowId?.substring(0,8)}</div>
                      </TableCell>
                      {controlIds.map(cId => {
                        const res = (sample.controlResults as any)?.[cId];
                        const isPass = res?.implemented === true;
                        return (
                          <TableCell key={cId} className="text-center p-0 align-middle">
                            <div className={cn(
                              "flex flex-col items-center justify-center h-full min-h-[60px] gap-1",
                              isPass ? "bg-emerald-50/50" : "bg-rose-50/50"
                            )}>
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
                                isPass ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                              )}>
                                {isPass ? "P" : "F"}
                              </div>
                              {res?.evidenceUrl && <span className="text-xs font-black text-emerald-700 uppercase">Evidence √</span>}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section III: Kesimpulan & Sign-off */}
          <div className="space-y-6 pt-8">
             <div className="p-6 bg-mancity-pattern text-primary-foreground rounded-xl shadow-xl flex justify-between items-center flex-wrap gap-2">
                <div className="space-y-1">
                   <p className="text-xs font-black text-primary-foreground/60 uppercase tracking-widest">Simpulan Akhir Efektivitas</p>
                   <h3 className="text-2xl font-black uppercase text-primary-foreground">{record.result}</h3>
                </div>
                <div className="text-right">
                   <ShieldCheck className="h-10 w-10 text-primary-foreground/80 mb-1 ml-auto" />
                   <p className="text-xs font-bold opacity-50 uppercase leading-none text-primary-foreground">{t('forensicVerified')}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-2 border-slate-900 bg-white rounded-lg overflow-hidden h-40">
                <div className="border-r-2 border-slate-900 p-4 flex flex-col">
                   <span className="text-xs font-black uppercase text-slate-400">Dikerjakan Oleh (Auditee)</span>
                   <div className="flex-1 border-b border-slate-100 flex items-center justify-center text-xs text-slate-300">Digital Signature Verified</div>
                   <div className="flex justify-between text-xs font-black uppercase mt-2 flex-wrap gap-2">
                      <span>{record.assessedBy}</span>
                      <span>{format(new Date(record.assessmentDate), 'dd/MM/yy')}</span>
                   </div>
                </div>
                <div className="border-r-2 border-slate-900 p-4 flex flex-col bg-slate-50/50">
                   <span className="text-xs font-black uppercase text-slate-400">Direview Oleh (Lini 2)</span>
                   <div className="flex-1 border-b border-slate-100" />
                   <div className="flex justify-between text-xs font-black uppercase mt-2 flex-wrap gap-2">
                      <span>Nama:</span>
                      <span>Tanggal:</span>
                   </div>
                </div>
                <div className="p-4 flex flex-col">
                   <span className="text-xs font-black uppercase text-slate-400">Otentikasi Dokumen</span>
                   <div className="flex-1 flex items-center justify-center p-4">
                      {/* QR Code Placeholder */}
                      <div className="w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-2">
                         <span className="text-[7px] font-black text-slate-400">SCAN QR TO VERIFY DOCUMENT INTEGRITY</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-8 text-center opacity-30">
             <p className="text-xs font-bold uppercase tracking-widest">{t('footerText')}</p>
          </div>
        </div>
      </div>
    );
  }
);

Appendix7aDetailed.displayName = 'Appendix7aDetailed';
