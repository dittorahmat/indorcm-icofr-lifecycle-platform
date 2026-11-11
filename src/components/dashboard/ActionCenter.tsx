import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ClipboardCheck, AlertTriangle, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ActionCenterProps {
  csaCompletion: number;
  openDeficienciesCount: number;
}

export function ActionCenter({ csaCompletion, openDeficienciesCount }: ActionCenterProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <Card className="border-slate-200 shadow-xs overflow-hidden bg-white rounded-lg">
      <CardHeader className="bg-slate-50/50 border-b py-4 px-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
             <Activity className="h-4 w-4 text-slate-900" aria-hidden="true" /> {t('actionCenter.title')}
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('actionCenter.status.systemLive', { defaultValue: 'System Live' })}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-slate-100">
        
        {/* Action 1: CSA */}
        <button 
          type="button"
          className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px]"
          onClick={() => navigate('/csa')}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-mancity-pattern group-hover:text-primary-foreground transition-all duration-300 shadow-sm border border-slate-200">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{t('actionCenter.csa.title')}</h4>
            <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 sm:line-clamp-1">{t('actionCenter.csa.description')}</p>
          </div>
          <div className="text-right shrink-0 min-w-[56px]">
            <div className="text-xs font-bold text-slate-900">{csaCompletion}%</div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('actionCenter.status.complete', { defaultValue: 'Complete' })}</div>
          </div>
        </button>

        {/* Action 2: Deficiencies (Urgent) */}
        {openDeficienciesCount > 0 && (
          <button 
            type="button"
            className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-destructive/5 transition-colors text-left group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px]"
            onClick={() => navigate('/deficiencies')}
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center group-hover:bg-destructive group-hover:text-destructive-foreground transition-all duration-300 shadow-sm border border-destructive/20">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{t('actionCenter.deficiency.title')}</h4>
              <p className="text-xs text-destructive font-medium mt-1 line-clamp-2 sm:line-clamp-1">{t('actionCenter.deficiency.description')}</p>
            </div>
            <div className="text-right shrink-0 min-w-[40px] flex justify-end">
              <Badge className="bg-destructive text-destructive-foreground border-none font-bold text-xs h-5 px-1.5 flex items-center justify-center rounded-md shrink-0">{openDeficienciesCount}</Badge>
            </div>
          </button>
        )}

        {/* Action 3: Reports */}
        <button 
          type="button"
          className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors text-left group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[52px]"
          onClick={() => navigate('/reports')}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:bg-mancity-pattern group-hover:text-primary-foreground transition-all duration-300 shadow-sm border border-slate-200">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{t('actionCenter.reports.title')}</h4>
            <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 sm:line-clamp-1">{t('actionCenter.reports.description')}</p>
          </div>
          <div className="text-right shrink-0 min-w-[24px]">
             <ArrowUpRight className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 transition-colors ml-auto" aria-hidden="true" />
          </div>
        </button>
      </CardContent>
      <div className="p-3.5 bg-slate-50 border-t flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> {t('actionCenter.status.auditTrailVerified', { defaultValue: 'Audit Trail Verified' })}
        </span>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t('actionCenter.status.sk5Compliant', { defaultValue: 'SK-5 Compliant' })}</span>
      </div>
    </Card>
  );
}
