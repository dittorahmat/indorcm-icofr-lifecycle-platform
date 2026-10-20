import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, TrendingUp, ShieldAlert } from 'lucide-react';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';
import { useTranslation } from 'react-i18next';
import { AnalyticsTab, AICasesTab, CCMTab } from './ai-hub';

export function AIAnalyticsMockup() {
  const { companyName } = useOrganizationBranding();
  const { t } = useTranslation('reports');

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-800 relative flex-wrap gap-4 min-w-0 max-w-full">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold tracking-wider uppercase">
              {t('aiHub.badge')}
            </Badge>
            <div className="h-1 w-1 rounded-full bg-slate-500" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('aiHub.eyebrow')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{t('aiHub.title')}</h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            {t('aiHub.subtitle', { companyName })}
          </p>
        </div>

        <div className="flex gap-4 sm:gap-6 items-center flex-wrap w-full sm:w-auto">
          <div className="text-left sm:text-right px-0 sm:px-4 sm:border-r border-slate-700 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('aiHub.systemStatus')}</p>
            <div className="flex items-center sm:justify-end gap-1.5 text-emerald-400 font-mono text-xs font-semibold mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('aiHub.online')}
            </div>
          </div>
          <div className="text-left sm:text-right min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('aiHub.dataFreshness')}</p>
            <p className="text-slate-200 font-mono text-xs uppercase mt-0.5">{t('aiHub.realtime')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6 min-w-0 max-w-full">
        <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1">
          <TabsList className="flex sm:inline-flex w-max min-w-full sm:w-auto bg-slate-100 p-1 border border-slate-200 shadow-sm rounded-lg gap-1 min-h-[44px]">
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-semibold flex-1 sm:flex-none whitespace-nowrap min-h-[44px] px-4"
            >
              <TrendingUp className="h-4 w-4 shrink-0" /> {t('aiHub.tabAnalytics')} (Slide 8)
            </TabsTrigger>
            <TabsTrigger
              value="ai-cases"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-semibold flex-1 sm:flex-none whitespace-nowrap min-h-[44px] px-4"
            >
              <BrainCircuit className="h-4 w-4 shrink-0" /> {t('aiHub.tabAiCases')} (Slide 9)
            </TabsTrigger>
            <TabsTrigger
              value="ccm"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-semibold flex-1 sm:flex-none whitespace-nowrap min-h-[44px] px-4"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" /> {t('aiHub.tabCcm')} (Slide 10)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="ai-cases">
          <AICasesTab />
        </TabsContent>
        <TabsContent value="ccm">
          <CCMTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
