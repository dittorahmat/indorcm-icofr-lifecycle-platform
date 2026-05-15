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
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder={t('matrix.subtitle_itgc')} 
            className="pl-11 h-11 bg-slate-50 border-slate-200 text-sm font-medium focus:bg-white rounded-xl transition-all" 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
        <Button onClick={() => navigate('/rcm/itgc')} variant="outline" className="h-11 gap-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all font-bold text-xs uppercase tracking-widest px-6 rounded-xl">
          <Fingerprint className="h-4 w-4" /> Buka Matriks ITGC
        </Button>
      </div>

      <div className="border border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Domain</TableHead>
              <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">{t('matrix.control_ref')}</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">{t('matrix.control_name')}</TableHead>
              <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center py-5">{t('matrix.automated_type')}</TableHead>
              <TableHead className="w-[150px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-5">{t('matrix.supporting_app')}</TableHead>
              <TableHead className="w-[100px] px-6 py-5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controlsLoading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400">{t('common:status.pending')}...</TableCell></TableRow>
            ) : filteredItgc.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-400 italic">Tidak ada rekaman ITGC ditemukan.</TableCell></TableRow>
            ) : filteredItgc.map((ctrl, i) => (
              <TableRow key={ctrl.id} className={cn("group hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/30")}>
                <TableCell className="px-6 py-4">
                  <Badge variant="outline" className="text-[9px] font-bold text-indigo-700 border-indigo-100 bg-indigo-50/50 uppercase tracking-widest px-2 h-6">
                    {ctrl.itgcDomain || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[11px] font-bold text-slate-500 py-4">{ctrl.code}</TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-display font-bold text-slate-900 leading-tight">{ctrl.name}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1 italic">"{ctrl.description}"</span>
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <Badge className="bg-slate-900 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2.5 h-6">
                    {ctrl.automatedSubNature || 'Manual'}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{ctrl.itApplication || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-6 py-4">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all rounded-xl" onClick={() => onEditControl(ctrl)}>
                    <Edit2 className="h-4 w-4" />
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
