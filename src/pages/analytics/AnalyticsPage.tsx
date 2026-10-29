import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, Flame, CircleDot, Radar, PieChart as PieIcon } from 'lucide-react';
import { ExecutiveKpiCards } from './ExecutiveKpiCards';
import { ExecutiveCharts } from './ExecutiveCharts';
import { CSAHeatmapTab } from './CSAHeatmapTab';
import { RiskExposureTab } from './RiskExposureTab';
import { TestingEvaluationTab } from './TestingEvaluationTab';
import { RemediationDODTab } from './RemediationDODTab';
import type { AnalyticsSummary, AnalyticsTab } from './types';

const VALID_TABS: AnalyticsTab[] = [
  'analytics-overview',
  'csa-heatmap',
  'bubble-analytics',
  'tod-toe-charts',
  'remediation-dod-charts',
];

export function AnalyticsPage() {
  const { t } = useTranslation('analytics');
  const [searchParams, setSearchParams] = useSearchParams();
  const { workingYear } = useFiscalYearStore();

  const currentTab = (searchParams.get('tab') as AnalyticsTab) || 'analytics-overview';
  const activeTab: AnalyticsTab = VALID_TABS.includes(currentTab) ? currentTab : 'analytics-overview';

  const setTab = (tab: AnalyticsTab) => {
    setSearchParams({ tab });
  };

  const { data: summary, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics-summary', workingYear],
    queryFn: () => api<AnalyticsSummary>(`/api/analytics/summary?year=${workingYear}`),
  });

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0 max-w-full w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {t('title')}
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t('liveEngine')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 pb-2 overflow-x-auto max-w-full touch-pan-x">
          <nav className="flex space-x-2 min-w-max">
            <button
              onClick={() => setTab('analytics-overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                activeTab === 'analytics-overview'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              {t('tabs.overview')}
            </button>

            <button
              onClick={() => setTab('csa-heatmap')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                activeTab === 'csa-heatmap'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              {t('tabs.csaHeatmap')}
            </button>

            <button
              onClick={() => setTab('bubble-analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                activeTab === 'bubble-analytics'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
              {t('tabs.bubble')}
            </button>

            <button
              onClick={() => setTab('tod-toe-charts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                activeTab === 'tod-toe-charts'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Radar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              {t('tabs.todToe')}
            </button>

            <button
              onClick={() => setTab('remediation-dod-charts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                activeTab === 'remediation-dod-charts'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              {t('tabs.remediation')}
            </button>
          </nav>
        </div>

        {/* Tab Contents */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : summary ? (
          <div>
            {activeTab === 'analytics-overview' && (
              <div className="space-y-6">
                <ExecutiveKpiCards data={summary} />
                <ExecutiveCharts data={summary} />
              </div>
            )}
            {activeTab === 'csa-heatmap' && (
              <CSAHeatmapTab />
            )}
            {activeTab === 'bubble-analytics' && (
              <RiskExposureTab />
            )}
            {activeTab === 'tod-toe-charts' && (
              <TestingEvaluationTab />
            )}
            {activeTab === 'remediation-dod-charts' && (
              <RemediationDODTab />
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
