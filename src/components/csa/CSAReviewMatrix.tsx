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
    if (!evalData) return { label: 'Pending', color: 'text-slate-400 bg-slate-100', icon: <Clock className="h-3 w-3" /> };
    
    if (evalData.conclusion === 'Effective') {
      return { label: 'Effective', color: 'text-green-700 bg-green-100 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> };
    }
    return { label: 'Ineffective', color: 'text-red-700 bg-red-100 border-red-200', icon: <XCircle className="h-3 w-3" /> };
  };

  return (
    <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden my-4 mx-2 shadow-inner">
      <div className="p-3 bg-white border-b flex justify-between items-center">
        <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          {t('tod.matrixTitle')}
        </h3>
        <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Pass
             </div>
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Fail
             </div>
        </div>
      </div>

      <ScrollArea className="w-full">
        <Table className="border-collapse">
          <TableHeader className="bg-white">
            <TableRow className="hover:bg-transparent border-b-2">
              <TableHead className="w-[280px] sticky left-0 z-20 bg-white border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div className="text-[10px] font-black uppercase text-slate-400 py-1">{t('tod.rcmAttributes')}</div>
              </TableHead>
              <TableHead className="w-[120px] text-center border-r bg-slate-50/50">
                <div className="text-[10px] font-black uppercase text-slate-400 py-1">TOD Lini 2</div>
              </TableHead>
              {record.samples?.map((sample, idx) => (
                <TableHead key={sample.id || idx} className="min-w-[100px] text-center border-r">
                   <div className="text-[10px] font-black text-slate-600 truncate max-w-[120px] mx-auto" title={sample.sampleRef || `Sample ${idx+1}`}>
                     {sample.sampleRef || `Sample ${idx+1}`}
                   </div>
                   <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Evidence</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {controls.map((control) => {
              const tod = getTODStatus(control.id);
              return (
                <TableRow key={control.id} className="group hover:bg-white transition-colors">
                  <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-3">
                    <button 
                      onClick={() => onControlClick(control)}
                      className="text-left hover:underline decoration-indigo-300 decoration-2 underline-offset-4"
                    >
                      <div className="font-black text-slate-900 text-xs flex items-center gap-2">
                        {control.code || control.reference}
                        <ExternalLink className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5 max-w-[240px]">
                        {control.name}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-center border-r py-3 bg-slate-50/30 group-hover:bg-indigo-50/20 transition-colors">
                    <Badge className={cn("px-2 py-0.5 text-[9px] font-black uppercase border shadow-none pointer-events-none flex items-center gap-1 w-fit mx-auto", tod.color)}>
                      {tod.icon}
                      {tod.label}
                    </Badge>
                  </TableCell>
                  {record.samples?.map((sample, sIdx) => {
                    const res = (sample.controlResults as any)?.[control.id];
                    const isPassed = res?.implemented;
                    const evidenceUrl = res?.evidenceUrl;

                    return (
                      <TableCell key={`${control.id}-${sIdx}`} className="text-center border-r p-0 group-hover:bg-white transition-colors">
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
  );
}
