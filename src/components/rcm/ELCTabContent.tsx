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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-5 sm:p-6 rounded-xl text-white shadow-sm border border-slate-800 relative">
        <div className="space-y-1 relative z-10">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">{t('matrix.title_elc')}</h3>
          <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
            {t('matrix.subtitle_elc')}
          </p>
        </div>
        <Button onClick={() => onCreateControl({ level: 'ELC' })} className="h-10 min-h-[44px] gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all font-semibold text-xs uppercase tracking-wider px-4 rounded-lg relative z-10 shrink-0">
           <PlusCircle className="h-4 w-4" /> {t('matrix.properties.tambah_risiko_baru')}
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TableRow>
              <TableHead className="w-[320px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 px-6 py-3.5">{t('matrix.properties.coso_section')}</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">{t('matrix.risk_description')}</TableHead>
              <TableHead className="w-[160px] text-center font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">Audit Status</TableHead>
              <TableHead className="w-[80px] px-6 py-3.5"></TableHead>
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
                    "group transition-colors",
                    hasGap ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-slate-50/50"
                  )}>
                    <TableCell className="align-top py-6 px-6 border-r border-slate-100">
                      <div className="flex gap-3">
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 border transition-all",
                          hasGap 
                            ? "bg-rose-100 border-rose-300 text-rose-800" 
                            : "bg-indigo-50 border-indigo-200 text-indigo-700"
                        )}>
                          {principle.id}
                        </div>
                        <div className="space-y-0.5">
                           <span className={cn("text-sm font-semibold leading-tight block", hasGap ? "text-rose-900" : "text-slate-900")}>
                              {principle.name}
                           </span>
                           <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Prinsip {principle.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className="space-y-4">
                        {relatedControls.length > 0 ? relatedControls.map(ctrl => (
                          <div key={ctrl.id} className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group/item relative">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="text-xs font-mono h-5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">{ctrl.code || 'ELC'}</Badge>
                                 <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{ctrl.name}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/item:opacity-100 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all rounded-md" onClick={() => onEditControl(ctrl)}>
                                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-normal">{ctrl.description}</p>
                            <div className="flex items-center gap-6 mt-4">
                               <div className="flex items-center gap-2">
                                  <Target className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">{ctrl.frequency}</span>
                               </div>
                               {ctrl.attachmentUrl && (
                                 <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                                   <FileDown className="h-3.5 w-3.5" />
                                   <span className="text-xs font-medium uppercase tracking-wider">Policy Doc</span>
                                 </div>
                               )}
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-6 px-4 bg-rose-50/40 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900 rounded-lg">
                             <ShieldAlert className="h-5 w-5 text-rose-500 mb-1.5" />
                             <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider text-center">{t('matrix.properties.warnings.unsaved_changes')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-5">
                       {relatedControls.length > 0 ? (
                         <div className="flex flex-col items-center gap-1">
                            <Badge className="bg-emerald-600 text-white border-none font-semibold text-xs uppercase tracking-wider px-2.5 h-5 shadow-none">{t('common:status.mapped')}</Badge>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase">Effective</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-1">
                            <Badge className="bg-rose-600 text-white border-none font-semibold text-xs uppercase tracking-wider px-2.5 h-5">Critical Gap</Badge>
                            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase">Remediation Needed</span>
                         </div>
                       )}
                    </TableCell>
                    <TableCell className="text-right py-5 pr-6">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-md" 
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

      {/* Mobile Card Feed View */}
      <div className="md:hidden space-y-4">
        {COSO_PRINCIPLES.map((principle) => {
          const relatedControls = elcControls.filter(c => c.cosoPrinciples?.includes(principle.id as any));
          const hasGap = relatedControls.length === 0;

          return (
            <div key={`m-principle-${principle.id}`} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">Principle {principle.id}</span>
                    {hasGap ? (
                      <Badge className="bg-rose-600 text-white font-semibold text-xs h-5 px-1.5">Critical Gap</Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white font-semibold text-xs h-5 px-1.5">Mapped</Badge>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{principle.name}</h4>
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateControl({ level: 'ELC', cosoPrinciples: [principle.id as any], name: `Kontrol Prinsip ${principle.id}` })}
                  className="h-9 min-h-[44px] min-w-[44px] px-2.5 gap-1 shrink-0 text-indigo-600 border-indigo-200 font-bold text-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Tambah</span>
                </Button>
              </div>

              <div className="space-y-2">
                {relatedControls.length > 0 ? (
                  relatedControls.map(ctrl => (
                    <div key={ctrl.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">{ctrl.code}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 min-h-[44px] min-w-[44px] px-2.5 text-xs font-bold text-indigo-600 border-indigo-200"
                          onClick={() => onEditControl(ctrl)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{ctrl.description}</p>
                      <div className="text-xs text-slate-500 font-medium">Frequency: {ctrl.frequency}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-rose-50 border border-dashed border-rose-200 rounded text-center text-xs text-rose-700 font-medium">
                    Belum ada kontrol terpetakan untuk prinsip ini.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
