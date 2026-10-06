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
    <Card className="border-slate-200 overflow-hidden shadow-xs bg-white rounded-lg">
      <CardHeader className="bg-slate-50/50 border-b py-4 sm:py-5 px-3.5 sm:px-6 min-w-0 max-w-full">
        <div className="flex justify-between items-center flex-wrap gap-2 min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800 truncate">
              <LayoutDashboard className="h-4 w-4 text-slate-900 shrink-0" aria-hidden="true" /> {t('coso.title')}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-1 line-clamp-2 sm:line-clamp-1">{t('coso.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3.5 sm:p-6 min-w-0 max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 min-w-0 max-w-full">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />) : (
            COSO_COMPONENTS.map((comp) => (
              <div key={comp.name} className="space-y-2.5 sm:space-y-4 min-w-0 max-w-full">
                <div className="flex items-center gap-2 px-1 min-w-0">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", comp.color)} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate leading-none">{comp.name}</span>
                </div>
                <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2 min-w-0">
                  {comp.principles.map(pNum => {
                    const c = cosoCoverage.find(cov => cov.principle === pNum);
                    const isCovered = (c?.count ?? 0) > 0;
                    return (
                      <div 
                        key={pNum} 
                        className={cn(
                          "h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-300 cursor-default border",
                          isCovered
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                            : 'bg-white border-dashed border-slate-200 text-slate-400'
                        )}
                        title={`${c?.count || 0} controls mapped to Principle ${pNum}`}
                      >
                        <span className={cn("text-xs font-bold uppercase tracking-tight", isCovered ? "text-slate-300" : "text-slate-400")}>P{pNum}</span>
                        <span className="text-sm font-bold leading-none mt-0.5">{c?.count || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6 text-xs uppercase font-bold tracking-wider text-slate-500 border-t border-slate-100 pt-4 sm:pt-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 bg-slate-900 rounded-sm" /> 
            {t('coso.covered')}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 bg-white border border-dashed border-slate-300 rounded-sm" /> 
            {t('coso.zeroCoverage')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
