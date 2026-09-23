import React from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutDashboard, Edit2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Control } from '@shared/types';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

interface TLCTabContentProps {
  filteredTlc: Control[];
  controlsLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditControl: (control: Control) => void;
}

export function TLCTabContent({ 
  filteredTlc, 
  controlsLoading, 
  searchTerm, 
  onSearchChange, 
  onEditControl 
}: TLCTabContentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder={t('matrix.subtitle_tlc')} 
            className="pl-11 h-11 bg-slate-50 border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl" 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
        <Button onClick={() => navigate('/rcm/tlc')} className="h-11 gap-3 bg-mancity-pattern hover:opacity-90 shadow-lg shadow-blue-100 transition-all font-bold text-xs uppercase tracking-widest px-6 rounded-xl text-primary-foreground">
          <LayoutDashboard className="h-4 w-4" /> Buka Matriks Horizontal
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TableRow>
              <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 px-4 py-3.5">{t('matrix.control_ref')}</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">{t('matrix.control_name')}</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">{t('matrix.nature')}</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center py-3.5">{t('matrix.risk_rating')}</TableHead>
              <TableHead className="w-[150px] text-center font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">{t('common:icofr.linkedTo')} ELC</TableHead>
              <TableHead className="w-[80px] py-3.5 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controlsLoading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">{t('common:status.pending')}...</TableCell></TableRow>
            ) : filteredTlc.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">{t('common:status.noData', { defaultValue: 'Tidak ada rekaman TLC ditemukan.' })}</TableCell></TableRow>
            ) : filteredTlc.map((ctrl, i) => (
              <TableRow key={ctrl.id} className={cn("group hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/40")}>
                <TableCell className="font-mono text-xs font-semibold text-slate-700 px-4 py-3">{ctrl.code}</TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs text-slate-900 font-medium leading-snug">{ctrl.name}</span>
                    <span className="text-xs text-slate-600 line-clamp-1 font-normal leading-normal">{ctrl.description}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className="text-xs font-medium uppercase tracking-wider h-6 px-2 bg-slate-50 border-slate-200 text-slate-700">
                    {ctrl.nature}
                  </Badge>
                </TableCell>
                <TableCell className="text-center py-3">
                  <Badge className={cn(
                    "text-xs font-medium h-6 px-2 uppercase tracking-wider shadow-none border", 
                    ctrl.riskRating === 'High' ? "bg-rose-50 text-rose-700 border-rose-200" : 
                    ctrl.riskRating === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {ctrl.riskRating}
                  </Badge>
                </TableCell>
                <TableCell className="text-center py-3">
                  <div className="flex justify-center">
                    {ctrl.relatedControlIds && ctrl.relatedControlIds.length > 0 ? (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold gap-1.5 py-0.5 px-2.5 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5" /> {ctrl.relatedControlIds.length} {t('status.mapped', { ns: 'common' })}
                      </Badge>
                    ) : <span className="text-xs text-slate-400 font-normal">No Link</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right py-3 px-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-md" 
                    onClick={() => onEditControl(ctrl)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
