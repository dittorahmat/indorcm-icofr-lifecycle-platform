import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Save, ShieldCheck, FileSpreadsheet, 
  Target, TrendingUp, ShieldAlert, Settings2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation, SimulationStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface ScopingEditorHeaderProps {
  simState: MaterialitySimulation;
  isLocked: boolean;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  snapshotFilename?: string;
  omValue?: number;
  pmValue?: number;
  isParamsOpen?: boolean;
  onToggleParams?: () => void;
}

export function ScopingEditorHeader({
  simState,
  isLocked,
  onBack,
  onSave,
  isSaving,
  snapshotFilename,
  omValue = 0,
  pmValue = 0,
  isParamsOpen = false,
  onToggleParams
}: ScopingEditorHeaderProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start text-slate-900 dark:text-white">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <SidebarTrigger className="h-8 w-8 text-slate-700 bg-white border border-slate-200 shadow-sm" />
          {onToggleParams && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleParams}
              className={cn(
                "h-8 gap-1.5 text-slate-700 bg-white border border-slate-200 shadow-sm transition-all px-2.5 text-xs font-black uppercase tracking-widest",
                isParamsOpen && "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {isParamsOpen ? t('params.hide', 'Hide Parameters') : t('params.show', 'Show Parameters')}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold tracking-tight leading-none">{simState.name}</h1>
              <StatusBadge status={(simState.workflowStatus || simState.status) as SimulationStatus} />
            </div>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap min-w-0">
              <Badge variant="outline" className="bg-indigo-50/50 border-indigo-100 text-indigo-700 font-semibold px-2 py-0 text-xs rounded-md">
                {simState.basis}
              </Badge>
              {simState.materialityJustification?.entityCharacteristics && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold px-2 py-0 text-xs rounded-md flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  {t('scoping:justification.statusComplete')}
                </Badge>
              )}
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                {snapshotFilename || t('editor.activeSnapshot')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLocked && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onSave} 
                disabled={isSaving}
                className="h-8 border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs px-3"
              >
                <Save className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> {t('editor.saveDraft')}
              </Button>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold uppercase tracking-wider shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" /> {t('editor.lockedMessage')}
            </div>
          )}
        </div>
      </div>

      {/* HERO STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative group overflow-hidden bg-mancity-pattern rounded-lg p-2.5 text-primary-foreground shadow-md shadow-blue-100/50">
           <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70 mb-0.5 flex items-center gap-1">
              <Target className="h-2.5 w-2.5 text-primary-foreground/60" /> {t('params.omValue')} (OM)
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
               <span className="text-lg font-display font-bold tracking-tight break-all">Rp {omValue.toLocaleString('id-ID')}</span>
               <Badge variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-xs font-mono py-0 px-1">
                {simState.omPercentage}%
              </Badge>
           </div>
        </div>

        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5 text-blue-500" /> {t('params.pmValue')} (PM)
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
               <span className="text-lg font-display font-bold tracking-tight text-slate-900 break-all">Rp {pmValue.toLocaleString('id-ID')}</span>
               <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 text-xs font-mono py-0 px-1">
                -{simState.haircutPercentage}% HC
              </Badge>
           </div>
        </div>

        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/50 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
              <ShieldAlert className="h-2.5 w-2.5 text-rose-500" /> {t('params.locations')}
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
               <span className="text-lg font-display font-bold tracking-tight text-slate-900">{simState.locationCount || 1} {t('editor.unitSuffix')}</span>
               <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">{t('editor.multiplierApplied')}</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const { t } = useTranslation('scoping');
  const base = "font-bold uppercase tracking-wider text-xs px-2 py-0.5 border-none shadow-sm";
  
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
