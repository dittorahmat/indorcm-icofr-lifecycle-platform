import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Save, Send, ShieldCheck, FileSpreadsheet, 
  Target, TrendingUp, ShieldAlert, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation, SimulationStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScopingEditorHeaderProps {
  simState: MaterialitySimulation;
  isLocked: boolean;
  onBack: () => void;
  onSave: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
  snapshotFilename?: string;
  omValue?: number;
  pmValue?: number;
}

export function ScopingEditorHeader({
  simState,
  isLocked,
  onBack,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
  snapshotFilename,
  omValue = 0,
  pmValue = 0
}: ScopingEditorHeaderProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start text-slate-900 dark:text-white">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-10 w-10 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold tracking-tight">{simState.name}</h1>
              <StatusBadge status={simState.status} />
            </div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-indigo-50/50 border-indigo-100 text-indigo-700 font-bold px-2 py-0">
                {simState.basis}
              </Badge>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                {snapshotFilename || 'Active Snapshot'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isLocked && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onSave} 
                disabled={isSaving}
                className="h-10 border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                <Save className="h-4 w-4 mr-2 text-slate-500" /> {t('editor.saveDraft')}
              </Button>
              <Button 
                onClick={onSubmit} 
                className="h-10 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all" 
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" /> {simState.status === 'Rejected' ? t('editor.resubmitToCfo') : t('editor.submitToCfo')}
              </Button>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold uppercase tracking-wider shadow-sm">
              <ShieldCheck className="h-4 w-4" /> {t('editor.lockedMessage')}
            </div>
          )}
        </div>
      </div>

      {/* HERO STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative group overflow-hidden bg-slate-900 rounded-2xl p-4 text-white shadow-xl shadow-slate-200">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
             <Target className="h-3 w-3 text-indigo-400" /> Overall Materiality (OM)
           </p>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold tracking-tight">Rp {omValue.toLocaleString('id-ID')}</span>
              <Badge variant="outline" className="bg-white/10 border-white/20 text-indigo-300 text-[10px] font-mono">
                {simState.omPercentage}%
              </Badge>
           </div>
        </div>

        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
             <TrendingUp className="h-3 w-3 text-blue-500" /> Performance Materiality (PM)
           </p>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold tracking-tight text-slate-900">Rp {pmValue.toLocaleString('id-ID')}</span>
              <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 text-[10px] font-mono">
                -{simState.haircutPercentage}% HC
              </Badge>
           </div>
        </div>

        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
             <ShieldAlert className="h-3 w-3 text-rose-500" /> Significant Locations
           </p>
           <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold tracking-tight text-slate-900">{simState.locationCount || 1} UNIT</span>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Multiplier Applied</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const { t } = useTranslation('scoping');
  const base = "font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 border-none shadow-sm";
  
  switch (status) {
    case 'Approved': 
      return <Badge className={cn(base, "bg-emerald-600 text-white")}>{t('status.approved')}</Badge>;
    case 'Pending CFO': 
      return <Badge className={cn(base, "bg-amber-500 text-white")}>{t('status.pendingCfo')}</Badge>;
    case 'Pending Komut': 
      return <Badge className={cn(base, "bg-blue-600 text-white")}>{t('status.pendingKomut')}</Badge>;
    case 'Rejected': 
      return <Badge className={cn(base, "bg-rose-600 text-white")}>{t('status.rejected')}</Badge>;
    default: 
      return <Badge className={cn(base, "bg-slate-200 text-slate-600 shadow-none")}>{t('status.draft')}</Badge>;
  }
}
