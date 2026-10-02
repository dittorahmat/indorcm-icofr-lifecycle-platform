import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ExternalLink, 
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { CSARecord, Control, TODEvaluation } from '@shared/types';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

interface CSAReviewMatrixProps {
  record: CSARecord;
  controls: Control[];
  todEvaluations: TODEvaluation[];
  onControlClick: (control: Control) => void;
}

export function CSAReviewMatrix({
  record,
  controls,
  todEvaluations,
  onControlClick
}: CSAReviewMatrixProps) {
  const { t } = useTranslation(['csa_hub', 'common']);
  
  const getTODStatus = (controlId: string) => {
    const evalData = todEvaluations.find(e => e.controlId === controlId);
    if (!evalData) return { label: 'Pending', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: <Clock className="h-3 w-3" /> };
    
    if (evalData.conclusion === 'Effective') {
      return { label: 'Effective', color: 'text-green-700 bg-green-100 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> };
    }
    return { label: 'Ineffective', color: 'text-red-700 bg-red-100 border-red-200', icon: <XCircle className="h-3 w-3" /> };
  };

  return (
    <div className="bg-slate-50/50 rounded-lg border border-slate-200 overflow-hidden my-3 md:my-4 mx-1 md:mx-2 shadow-xs">
      <div className="p-3 bg-white border-b flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
          {t('tod.matrixTitle')}
        </h3>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Pass
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Fail
          </div>
        </div>
      </div>

      {/* MOBILE VIEW: Touch-friendly Card Stack (< md) */}
      <div className="block md:hidden divide-y divide-slate-100 p-2 space-y-3">
        {controls.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground font-medium">
            {t('tod.noControls', { defaultValue: 'Tidak ada kontrol terpetakan.' })}
          </div>
        ) : (
          controls.map((control: any) => {
            const tod = getTODStatus(control.controlId);
            return (
              <div 
                key={control.mappingId} 
                className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <button 
                      onClick={() => onControlClick(control)}
                      className="text-left group flex items-center gap-1.5 hover:underline decoration-indigo-300 underline-offset-4"
                    >
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {control.controlCode}
                      </span>
                      <ExternalLink className="h-3 w-3 text-indigo-600 shrink-0" />
                    </button>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-0.5">
                      {control.mappedControlName || control.baseControlName}
                    </p>
                  </div>
                  <Badge className={cn("px-2 py-0.5 text-xs font-bold uppercase border shadow-none shrink-0 flex items-center gap-1", tod.color)}>
                    {tod.icon}
                    {tod.label}
                  </Badge>
                </div>

                {/* Samples Grid on Mobile */}
                {record.samples && record.samples.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      {t('tod.evidenceSummary', { defaultValue: 'Bukti Sampel' })}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {record.samples.map((sample, sIdx) => {
                        const res = (sample.controlResults as any)?.[control.controlId];
                        const isPassed = res?.implemented;
                        const evidenceUrl = res?.evidenceUrl;

                        return (
                          <div 
                            key={`${control.mappingId}-mob-${sIdx}`}
                            className={cn(
                              "p-2 rounded-md border flex items-center justify-between gap-1.5 text-xs",
                              isPassed ? "bg-green-50/60 border-green-200" : "bg-red-50/60 border-red-200"
                            )}
                          >
                            <span className="font-semibold text-slate-700 truncate max-w-[110px]" title={sample.sampleRef || `Sample ${sIdx + 1}`}>
                              {sample.sampleRef || `S-${sIdx + 1}`}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {evidenceUrl ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 rounded-md bg-white border border-slate-200 shadow-xs text-indigo-600 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(evidenceUrl, '_blank');
                                  }}
                                  title="Lihat Bukti"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <div className="h-6 w-6 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                                  <Search className="h-3 w-3" />
                                </div>
                              )}
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                isPassed ? "bg-green-500 shadow-xs" : "bg-red-500 shadow-xs"
                              )} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 min-h-[36px] text-xs font-semibold gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50 w-full sm:w-auto"
                    onClick={() => onControlClick(control)}
                  >
                    <span>{t('tod.verifyDesign', { defaultValue: 'Verifikasi Desain' })}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: Full Scrollable Matrix (>= md) */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <Table className="border-collapse">
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="w-[280px] sticky left-0 z-20 bg-white border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 py-1">{t('tod.rcmAttributes')}</div>
                </TableHead>
                <TableHead className="w-[120px] text-center border-r bg-slate-50/50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 py-1">TOD Lini 2</div>
                </TableHead>
                {record.samples?.map((sample, idx) => (
                  <TableHead key={sample.id || idx} className="min-w-[140px] max-w-[200px] text-center border-r px-2 py-2">
                     <div 
                       className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 max-w-full truncate shadow-2xs" 
                       title={sample.sampleRef || `Sample ${idx + 1}`}
                     >
                       {sample.sampleRef || `Sample ${idx + 1}`}
                     </div>
                     <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Evidence</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.map((control: any) => {
                const tod = getTODStatus(control.controlId);
                return (
                  <TableRow key={control.mappingId} className="group hover:bg-white transition-colors">
                    <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-3">
                      <button 
                        onClick={() => onControlClick(control)}
                        className="text-left hover:underline decoration-indigo-300 decoration-2 underline-offset-4"
                      >
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          {control.controlCode}
                          <ExternalLink className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5 max-w-[240px]">
                          {control.mappedControlName || control.baseControlName}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="text-center border-r py-3 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
                      <Badge className={cn("px-2 py-0.5 text-xs font-bold uppercase border shadow-none pointer-events-none flex items-center gap-1 w-fit mx-auto", tod.color)}>
                        {tod.icon}
                        {tod.label}
                      </Badge>
                    </TableCell>
                    {record.samples?.map((sample, sIdx) => {
                      const res = (sample.controlResults as any)?.[control.controlId];
                      const isPassed = res?.implemented;
                      const evidenceUrl = res?.evidenceUrl;

                      return (
                        <TableCell key={`${control.mappingId}-${sIdx}`} className="text-center border-r p-0 group-hover:bg-white transition-colors">
                           <div className={cn(
                             "h-full w-full py-3 flex items-center justify-center gap-2",
                             isPassed ? "bg-green-50/20" : "bg-red-50/20"
                           )}>
                              {evidenceUrl ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 rounded-full bg-white border border-slate-200 shadow-sm hover:scale-110 transition-transform text-indigo-600"
                                  onClick={() => window.open(evidenceUrl, '_blank')}
                                  title="Lihat Bukti"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <div className="h-7 w-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                                  <Search className="h-3 w-3" />
                                </div>
                              )}
                              <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isPassed ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                              )} />
                           </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
