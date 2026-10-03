import React from 'react';
import { ReportHeader } from './ReportHeader';
import { Control, CSARecord } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Appendix7aSummaryProps {
  record: CSARecord;
  bpmProcessName: string;
  noGL: string;
}

export const Appendix7aSummary = React.forwardRef<HTMLDivElement, Appendix7aSummaryProps>(
  ({ record, bpmProcessName, noGL }, ref) => {
    // Aggregate results per control
    const controlStats: Record<string, { name: string; total: number; pass: number; fail: number }> = {};
    
    record.samples?.forEach(s => {
      if (s.controlResults) {
        Object.entries(s.controlResults).forEach(([id, res]: [string, any]) => {
          if (!controlStats[id]) {
            controlStats[id] = {
              name: res.controlName || id,
              total: 0,
              pass: 0,
              fail: 0
            };
          }
          controlStats[id].total++;
          if (res.implemented) controlStats[id].pass++;
          else controlStats[id].fail++;
        });
      }
    });

    const summaryRows = Object.entries(controlStats);

    return (
      <div ref={ref} className="p-12 bg-white text-slate-900 font-sans print:p-0 w-full min-h-screen">
        <ReportHeader 
          title="Kertas Kerja Evaluasi Pengendalian (CSA) - Summary"
          subProcess={bpmProcessName}
          period={record.period}
          date={format(new Date(record.assessmentDate), 'dd MMMM yyyy')}
          documentNo={`APP7A/SUM/${record.id.substring(0,8).toUpperCase()}`}
        />

        <div className="space-y-10">
          {/* Section I: Executive Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
             <div className="col-span-1 sm:col-span-2 p-6 bg-slate-50 border-2 border-slate-900 rounded-xl flex flex-col justify-between">
                <div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Simpulan Akhir</p>
                   <h3 className={cn(
                     "text-3xl font-black uppercase italic",
                     record.result === 'Effective' ? "text-emerald-600" : "text-rose-600"
                   )}>
                     {record.result}
                   </h3>
                </div>
                <div className="mt-6 space-y-2">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Justifikasi Manajemen</p>
                   <p className="text-xs leading-relaxed text-slate-700 italic">
                      {record.comments || "Berdasarkan hasil pengujian sampel, pengendalian dinyatakan efektif/tidak efektif sesuai dengan kriteria yang ditetapkan."}
                   </p>
                </div>
             </div>
             <div className="p-6 bg-mancity-pattern text-primary-foreground rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
                <ShieldCheck className="h-12 w-12 text-primary-foreground/80 mb-4" />
                <p className="text-xs font-bold uppercase opacity-60">Total Verification Points</p>
                <p className="text-4xl font-black tracking-tighter text-primary-foreground">
                   {summaryRows.reduce((acc, [_, stats]) => acc + stats.total, 0)}
                </p>
                <div className="mt-4 flex gap-4 text-xs font-black uppercase">
                   <span className="text-emerald-400">{summaryRows.reduce((acc, [_, stats]) => acc + stats.pass, 0)} PASSED</span>
                   <span className="text-rose-400">{summaryRows.reduce((acc, [_, stats]) => acc + stats.fail, 0)} FAILED</span>
                </div>
             </div>
          </div>

          {/* Section II: Ringkasan Efektivitas Kontrol */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">II. Ringkasan Efektivitas Per Aktivitas Kontrol</h2>
            <div className="border-2 border-slate-900 overflow-hidden rounded-lg">
              <Table>
                <TableHeader className="bg-mancity-pattern">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-black text-primary-foreground w-10 text-center">NO</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground">KODE & NAMA KONTROL</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground text-center">TOTAL SAMPEL</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground text-center">PASS</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground text-center">FAIL</TableHead>
                    <TableHead className="text-xs font-black text-primary-foreground text-center">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryRows.map(([id, stats], idx) => {
                    const isControlEffective = stats.fail === 0;
                    return (
                      <TableRow key={id} className="divide-x border-b-2 border-slate-100">
                        <TableCell className="text-xs font-bold text-center">{idx + 1}</TableCell>
                        <TableCell className="py-4">
                           <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-bold text-indigo-600">{id}</span>
                              <span className="text-xs font-black text-slate-800">{stats.name}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs">{stats.total}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-emerald-600">{stats.pass}</TableCell>
                        <TableCell className="text-center font-bold text-xs text-rose-600">{stats.fail}</TableCell>
                        <TableCell className="text-center">
                           <Badge className={cn(
                             "text-xs font-black uppercase px-3",
                             isControlEffective ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                           )}>
                             {isControlEffective ? "EFFECTIVE" : "INEFFECTIVE"}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section III: Prosedur Pengujian */}
          <div className="space-y-4">
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">III. Prosedur Pengujian & Lokasi Arsip</h2>
             <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase">Metodologi Sampling</p>
                      <p className="text-xs font-medium">{record.samplingMethodology || "-"}</p>
                   </div>
                    <div className="space-y-1 text-left sm:text-right">
                      <p className="text-xs font-black text-slate-400 uppercase">Lokasi Arsip Fisik</p>
                      <p className="text-xs font-bold text-indigo-700">{(record as any).archiveLocation || "-"}</p>
                   </div>
                </div>
                <Separator />
                <div className="space-y-2">
                   <p className="text-xs font-black text-slate-400 uppercase">Narasi Prosedur</p>
                   <p className="text-xs leading-relaxed whitespace-pre-wrap">{(record as any).testProcedure || "N/A"}</p>
                </div>
             </div>
          </div>

          {/* Footer Area */}
          <div className="overflow-x-auto max-w-full rounded-lg border-2 border-slate-900 bg-white touch-pan-x overscroll-x-contain table-scroll-hint">
          <div className="grid grid-cols-3 min-w-[560px] bg-white overflow-hidden min-h-[10rem]">
             <div className="border-r-2 border-slate-900 p-4 flex flex-col">
                <span className="text-xs font-black uppercase text-slate-400">Dikerjakan Oleh (Auditee)</span>
                <div className="flex-1 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-slate-400">Digital Signature Verified</div>
                <div className="flex justify-between text-xs font-black uppercase mt-2">
                   <span>{record.assessedBy}</span>
                   <span>{format(new Date(record.assessmentDate), 'dd/MM/yy')}</span>
                </div>
             </div>
             <div className="border-r-2 border-slate-900 p-4 flex flex-col bg-slate-50/50">
                <span className="text-xs font-black uppercase text-slate-400">Direview Oleh (Lini 2)</span>
                <div className="flex-1 border-b border-slate-100" />
                <div className="flex justify-between text-xs font-black uppercase mt-2">
                   <span>Nama:</span>
                   <span>Tanggal:</span>
                </div>
             </div>
             <div className="p-4 flex flex-col">
                <span className="text-xs font-black uppercase text-slate-400">Otentikasi Dokumen</span>
                <div className="flex-1 flex items-center justify-center p-4">
                   <div className="w-20 h-20 bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-2">
                       <span className="text-xs font-black text-slate-400 leading-tight">SCAN QR TO VERIFY DOCUMENT INTEGRITY</span>
                   </div>
                </div>
             </div>
          </div>
          </div>
        </div>
      </div>
    );
  }
);

Appendix7aSummary.displayName = 'Appendix7aSummary';
