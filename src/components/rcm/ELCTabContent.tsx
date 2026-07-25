import React from 'react';
import { motion } from 'framer-motion';
import { Zap, PlusCircle, ShieldAlert, Target, FileDown, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Control } from '@shared/types';
import { COSO_PRINCIPLES } from '@/lib/constants';

import { useTranslation } from 'react-i18next';

interface ELCTabContentProps {
  elcControls: Control[];
  onEditControl: (control: Control) => void;
  onCreateControl: (initialData: Partial<Control>) => void;
}

export function ELCTabContent({ elcControls, onEditControl, onCreateControl }: ELCTabContentProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between gap-6 bg-mancity-pattern p-8 rounded-[2.5rem] text-primary-foreground shadow-2xl shadow-indigo-200 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
        <div className="space-y-2 relative z-10">
          <h3 className="text-2xl font-display font-bold tracking-tight text-primary-foreground">{t('matrix.title_elc')}</h3>
          <p className="text-primary-foreground/60 text-sm font-medium leading-relaxed max-w-xl">
            {t('matrix.subtitle_elc')}
          </p>
        </div>
        <Button onClick={() => onCreateControl({ level: 'ELC' })} className="h-12 gap-3 bg-white text-primary-foreground hover:bg-slate-100 shadow-xl transition-all font-bold text-xs uppercase tracking-widest px-8 rounded-2xl relative z-10 shrink-0">
           <PlusCircle className="h-4 w-4 text-primary" /> {t('matrix.properties.tambah_risiko_baru')}
        </Button>
      </div>

      <div className="border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[350px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 px-8 py-6">{t('matrix.properties.coso_section')}</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('matrix.risk_description')}</TableHead>
              <TableHead className="w-[180px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Audit Status</TableHead>
              <TableHead className="w-[100px] px-8 py-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COSO_PRINCIPLES.map((principle) => {
              const relatedControls = elcControls.filter(c => c.cosoPrinciples?.includes(principle.id as any));
              const hasGap = relatedControls.length === 0;
              
              return (
                <React.Fragment key={principle.id}>
                  {(principle.id === 1 || principle.id === 6 || principle.id === 10 || principle.id === 13 || principle.id === 16) && (
                    <TableRow className="bg-slate-100/50 border-y border-slate-200/60">
                      <TableCell colSpan={4} className="py-3 px-8">
                        <div className="flex items-center gap-3">
                          <Zap className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="text-[11px] font-bold uppercase text-slate-900 tracking-[0.25em]">{principle.component}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={cn(
                    "group transition-all duration-300",
                    hasGap ? "bg-rose-50/40 hover:bg-rose-50/60" : "hover:bg-slate-50/50"
                  )}>
                    <TableCell className="align-top py-8 px-8 border-r border-slate-100/50">
                      <div className="flex gap-4">
                        <div className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all",
                          hasGap 
                            ? "bg-rose-100 border-rose-200 text-rose-700 animate-pulse" 
                            : "bg-indigo-50 border-indigo-100 text-indigo-700"
                        )}>
                          {principle.id}
                        </div>
                        <div className="space-y-1">
                           <span className={cn("text-base font-display font-bold leading-tight block", hasGap ? "text-rose-900" : "text-slate-900")}>
                              {principle.name}
                           </span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Prinsip {principle.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className="space-y-4">
                        {relatedControls.length > 0 ? relatedControls.map(ctrl => (
                          <div key={ctrl.id} className="flex flex-col p-5 border border-slate-100 rounded-2xl bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group/item relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 rounded-full -mr-12 -mt-12 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="text-xs font-mono h-5 border-slate-200 bg-slate-50 text-slate-600 font-bold">{ctrl.code || 'ELC'}</Badge>
                                 <span className="text-xs font-normal text-slate-800 leading-snug">{ctrl.name}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover/item:opacity-100 group-hover:bg-slate-100 transition-all rounded-lg" onClick={() => onEditControl(ctrl)}>
                                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed italic font-normal">"{ctrl.description}"</p>
                            <div className="flex items-center gap-6 mt-5 relative z-10">
                               <div className="flex items-center gap-2">
                                  <Target className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{ctrl.frequency}</span>
                               </div>
                               {ctrl.attachmentUrl && (
                                 <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 cursor-pointer">
                                   <FileDown className="h-4 w-4" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Policy Doc</span>
                                 </div>
                               )}
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-6 px-4 bg-rose-50/30 border border-dashed border-rose-200 rounded-2xl">
                             <ShieldAlert className="h-6 w-6 text-rose-400 mb-2" />
                             <span className="text-[11px] text-rose-500 font-bold uppercase tracking-widest text-center">{t('matrix.properties.warnings.unsaved_changes')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-6">
                       {relatedControls.length > 0 ? (
                         <div className="flex flex-col items-center gap-1.5">
                            <Badge className="bg-emerald-500 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 h-6 shadow-sm shadow-emerald-100">{t('common:status.mapped')}</Badge>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Effective</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-1.5">
                            <Badge className="bg-rose-500 text-white border-none font-bold text-[9px] uppercase tracking-widest px-3 h-6 animate-pulse">Critical Gap</Badge>
                            <span className="text-[9px] font-bold text-rose-600 uppercase">Remediation Needed</span>
                         </div>
                       )}
                    </TableCell>
                    <TableCell className="text-right py-6 pr-8">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-2xl" 
                        onClick={() => onCreateControl({ level: 'ELC', cosoPrinciples: [principle.id as any], name: `Kontrol Prinsip ${principle.id}` })}
                       >
                          <PlusCircle className="h-5 w-5" />
                       </Button>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
