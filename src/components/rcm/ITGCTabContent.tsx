import React from 'react';
import { motion } from 'framer-motion';
import { Search, Fingerprint, Lock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Control } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ITGCTabContentProps {
  filteredItgc: Control[];
  controlsLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditControl: (control: Control) => void;
}

export function ITGCTabContent({ 
  filteredItgc, 
  controlsLoading, 
  searchTerm, 
  onSearchChange, 
  onEditControl 
}: ITGCTabContentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap min-w-0 max-w-full bg-white p-3 sm:p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder={t('matrix.subtitle_itgc')} 
            className="pl-10 h-9 sm:h-8 min-h-[44px] sm:min-h-0 bg-slate-50 border-slate-200 text-base sm:text-xs font-medium focus:bg-white rounded-lg transition-all" 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
        <Button onClick={() => navigate('/rcm/itgc')} variant="outline" className="h-9 sm:h-8 min-h-[44px] sm:min-h-0 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all font-bold text-xs uppercase tracking-wider px-3.5 rounded-lg shrink-0">
          <Fingerprint className="h-4 w-4" /> {t('matrix.open_matrix_itgc')}
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-slate-200 rounded-lg bg-white shadow-sm overflow-x-auto max-w-full touch-pan-x overscroll-x-contain">
        <Table className="min-w-[960px]">
          <TableHeader className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TableRow>
              <TableHead className="w-[140px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 px-3 py-2.5">Domain</TableHead>
              <TableHead className="w-[130px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-2.5">{t('matrix.control_ref')}</TableHead>
              <TableHead className="min-w-[280px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-2.5">{t('matrix.control_name')}</TableHead>
              <TableHead className="w-[150px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center py-2.5">{t('matrix.automated_type')}</TableHead>
              <TableHead className="w-[160px] font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 py-2.5">{t('matrix.supporting_app')}</TableHead>
              <TableHead className="w-[60px] text-right px-3 py-2.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controlsLoading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">{t('common:status.pending')}...</TableCell></TableRow>
            ) : filteredItgc.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">{t('common:status.noData', { defaultValue: 'Tidak ada rekaman ITGC ditemukan.' })}</TableCell></TableRow>
            ) : filteredItgc.map((ctrl, i) => (
              <TableRow key={ctrl.id} className={cn("group hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/40")}>
                <TableCell className="px-3 py-2">
                  <Badge variant="outline" className="text-xs font-medium text-indigo-700 border-indigo-200 bg-indigo-50/50 uppercase tracking-wider px-2 h-5">
                    {ctrl.itgcDomain || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold text-slate-700 py-2">{ctrl.code}</TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-xs text-slate-900 font-medium leading-snug">{ctrl.name}</span>
                    <span className="text-xs text-slate-600 line-clamp-1 font-normal leading-normal">{ctrl.description}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center py-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium uppercase tracking-wider px-2 h-5">
                    {ctrl.automatedSubNature || 'Manual'}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{ctrl.itApplication || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-3 py-2">
                  <Button variant="ghost" size="icon" aria-label="Edit control" className="h-8 w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:h-7 md:w-7 text-slate-400 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:!opacity-100 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-md" onClick={() => onEditControl(ctrl)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Feed View */}
      <div className="md:hidden space-y-3">
        {controlsLoading ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-400">
            {t('common:status.pending')}...
          </div>
        ) : filteredItgc.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
            {t('common:status.noData', { defaultValue: 'Tidak ada rekaman ITGC ditemukan.' })}
          </div>
        ) : (
          filteredItgc.map((ctrl) => (
            <div key={ctrl.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                      {ctrl.code}
                    </span>
                    <Badge variant="outline" className="text-xs font-medium text-indigo-700 border-indigo-200 bg-indigo-50/50 uppercase px-1.5 h-5">
                      {ctrl.itgcDomain || 'Domain'}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{ctrl.name}</h4>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEditControl(ctrl)}
                  className="h-9 min-h-[44px] min-w-[44px] px-2.5 gap-1 shrink-0 text-indigo-600 border-indigo-200 font-bold text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              </div>

              {ctrl.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                  {ctrl.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs flex-wrap gap-2">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {ctrl.automatedSubNature || 'Manual'}
                </span>
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{ctrl.itApplication || '-'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
