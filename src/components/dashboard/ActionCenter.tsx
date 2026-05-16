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
    <Card className="border-slate-200 shadow-md overflow-hidden bg-white rounded-xl">
      <CardHeader className="bg-slate-50 border-b py-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
             <Activity className="h-3.5 w-3.5 text-slate-900" /> {t('actionCenter.title')}
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded-full">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-slate-100">
        
        {/* Action 1: CSA */}
        <button 
          className="w-full flex items-center gap-4 p-5 hover:bg-indigo-50/30 transition-all duration-300 text-left group active:scale-[0.98] relative overflow-hidden"
          onClick={() => navigate('/csa')}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-indigo-100/50">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-black text-slate-900 text-sm tracking-tight">{t('actionCenter.csa.title')}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">{t('actionCenter.csa.description')}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-900">{csaCompletion}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Done</div>
          </div>
        </button>

        {/* Action 2: Deficiencies (Urgent) */}
        {openDeficienciesCount > 0 && (
          <button 
            className="w-full flex items-center gap-4 p-5 hover:bg-rose-50/50 transition-all duration-300 text-left group active:scale-[0.98] relative overflow-hidden"
            onClick={() => navigate('/deficiencies')}
          >
            <div className="absolute top-0 right-0 p-1">
              <div className="h-1 w-1 rounded-full bg-rose-500 animate-ping" />
            </div>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm border border-rose-100/50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-black text-slate-900 text-sm tracking-tight">{t('actionCenter.deficiency.title')}</h4>
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-0.5 truncate">{t('actionCenter.deficiency.description')}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-rose-600 text-white border-none font-black text-[10px] h-5 min-w-5 flex items-center justify-center rounded-md px-1">{openDeficienciesCount}</Badge>
            </div>
          </button>
        )}

        {/* Action 3: Reports */}
        <button 
          className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-300 text-left group active:scale-[0.98] relative overflow-hidden"
          onClick={() => navigate('/reports')}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm border border-slate-200/50">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-black text-slate-900 text-sm tracking-tight">{t('actionCenter.reports.title')}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">{t('actionCenter.reports.description')}</p>
          </div>
          <div className="text-right">
             <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors ml-auto" />
          </div>
        </button>
      </CardContent>
      <div className="p-3 bg-slate-50 border-t flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" /> System Integrity Check
        </span>
        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Compliant</span>
      </div>
    </Card>
  );
}
