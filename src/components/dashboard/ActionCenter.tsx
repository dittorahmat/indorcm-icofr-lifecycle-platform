import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ClipboardCheck, AlertTriangle, FileText, ArrowUpRight } from 'lucide-react';
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
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
           <Activity className="h-4 w-4 text-slate-900" /> {t('actionCenter.title')}
        </CardTitle>
        <CardDescription className="text-xs font-medium text-slate-500 mt-1">{t('actionCenter.description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-slate-100">
        
        {/* Action 1: CSA */}
        <button 
          className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
          onClick={() => navigate('/todo')}
        >
          <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.csa.title')}</h4>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{t('actionCenter.csa.description')}</p>
          </div>
          <div className="text-right relative z-10">
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-900 font-bold text-xs group-hover:border-slate-900 transition-colors">{csaCompletion}%</Badge>
            <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-900 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
          </div>
        </button>

        {/* Action 2: Deficiencies (Urgent) */}
        {openDeficienciesCount > 0 && (
          <button 
            className="w-full flex items-center gap-4 p-5 hover:bg-rose-50/50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
            onClick={() => navigate('/deficiencies')}
          >
            <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/5 transition-colors" />
            <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.deficiency.title')}</h4>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{t('actionCenter.deficiency.description')}</p>
            </div>
            <div className="text-right relative z-10">
              <Badge className="bg-rose-600 text-white border-none font-bold text-xs ring-2 ring-white group-hover:ring-rose-100 transition-all">{openDeficienciesCount}</Badge>
              <ArrowUpRight className="h-3 w-3 text-rose-300 group-hover:text-rose-600 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
            </div>
          </button>
        )}

        {/* Action 3: Reports */}
        <button 
          className="w-full flex items-center gap-4 p-5 hover:bg-emerald-50/50 transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
          onClick={() => navigate('/reports')}
        >
          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
          <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 relative z-10 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h4 className="font-display font-extrabold text-slate-900 text-sm">{t('actionCenter.reports.title')}</h4>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{t('actionCenter.reports.description')}</p>
          </div>
          <div className="text-right relative z-10">
            <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 font-bold text-xs uppercase group-hover:bg-emerald-100 transition-colors">{t('common:status.active')}</Badge>
            <ArrowUpRight className="h-3 w-3 text-emerald-300 group-hover:text-emerald-600 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" />
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
