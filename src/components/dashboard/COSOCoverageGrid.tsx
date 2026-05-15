import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const COSO_COMPONENTS = [
  { name: 'Control Environment', principles: [1, 2, 3, 4, 5], color: 'bg-blue-600' },
  { name: 'Risk Assessment', principles: [6, 7, 8, 9], color: 'bg-indigo-600' },
  { name: 'Control Activities', principles: [10, 11, 12], color: 'bg-slate-900' },
  { name: 'Information & Comm', principles: [13, 14, 15], color: 'bg-emerald-600' },
  { name: 'Monitoring Activities', principles: [16, 17], color: 'bg-amber-600' },
];

interface COSOCoverageGridProps {
  cosoCoverage: { principle: number; count: number }[];
  isLoading: boolean;
}

export function COSOCoverageGrid({ cosoCoverage, isLoading }: COSOCoverageGridProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
      <CardHeader className="bg-slate-50/50 border-b py-5 px-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-900">
              <LayoutDashboard className="h-4 w-4 text-slate-900" /> {t('coso.title')}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1">{t('coso.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : (
            COSO_COMPONENTS.map((comp) => (
              <div key={comp.name} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={cn("h-1.5 w-1.5 rounded-full", comp.color)} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate leading-none">{comp.name}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {comp.principles.map(pNum => {
                    const c = cosoCoverage.find(cov => cov.principle === pNum);
                    return (
                      <div 
                        key={pNum} 
                        className={cn(
                          "h-10 flex flex-col items-center justify-center rounded transition-all duration-300 cursor-default",
                          (c?.count ?? 0) > 0 
                            ? 'bg-slate-900 border border-slate-900 text-white shadow-sm ring-1 ring-slate-900/5' 
                            : 'bg-white border border-dashed border-slate-200 text-slate-300 opacity-60'
                        )}
                        title={`${c?.count || 0} controls mapped to Principle ${pNum}`}
                      >
                        <span className={cn("text-xs font-bold tracking-tighter uppercase", (c?.count ?? 0) > 0 ? "text-slate-400" : "text-slate-200")}>P{pNum}</span>
                        <span className="text-xs font-display font-extrabold leading-none mt-0.5">{c?.count || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-8 flex gap-6 text-xs uppercase font-bold tracking-wider text-slate-400 border-t pt-5">
          <div className="flex items-center gap-2"><div className="h-2 w-2 bg-slate-900 rounded-full" /> {t('coso.covered')}</div>
          <div className="flex items-center gap-2"><div className="h-2 w-2 bg-white border border-dashed border-slate-200 rounded-full" /> {t('coso.zeroCoverage')}</div>
        </div>
      </CardContent>
    </Card>
  );
}
