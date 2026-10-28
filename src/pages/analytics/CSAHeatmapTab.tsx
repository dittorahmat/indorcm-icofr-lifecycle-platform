import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { ControlDetailPanel } from './ControlDetailPanel';
import type { HeatmapResponse, ControlDetail } from './types';

export function CSAHeatmapTab() {
  const { t } = useTranslation('analytics');
  const { workingYear } = useFiscalYearStore();
  const [selectedControlId, setSelectedControlId] = useState<string | null>('REV-01');
  const [isListView, setIsListView] = useState<boolean>(false);

  const { data: heatmapResponse, isLoading } = useQuery<{ success: boolean; data: HeatmapResponse }>({
    queryKey: ['analytics-heatmap', workingYear],
    queryFn: () => api<{ success: boolean; data: HeatmapResponse }>(`/api/analytics/heatmap?year=${workingYear}`),
  });

  const matrix = heatmapResponse?.data?.matrix ?? {};
  const controls = heatmapResponse?.data?.controls ?? {};
  const selectedControl: ControlDetail | null = selectedControlId ? controls[selectedControlId] ?? null : null;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* View Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">{t('heatmap.title')}</h3>
          <p className="text-xs text-slate-500">{t('heatmap.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={!isListView ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsListView(false)}
            className="text-xs h-8"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            {t('heatmap.viewMatrix')}
          </Button>
          <Button
            variant={isListView ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsListView(true)}
            className="text-xs h-8"
          >
            <List className="w-3.5 h-3.5 mr-1.5" />
            {t('heatmap.viewList')}
          </Button>
        </div>
      </div>

      {/* Main Grid: Heatmap + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          {!isListView ? (
            <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
              <div className="min-w-[520px]">
                {/* 5x5 Grid Table */}
                <div className="grid grid-cols-6 gap-1.5 text-center text-xs">
                  {/* Axis Label */}
                  <div className="p-2 font-bold text-slate-400 flex items-center justify-center">
                    I / L
                  </div>
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div key={`l-head-${l}`} className="p-2 font-bold text-slate-600 bg-slate-50 rounded">
                      L{l}
                    </div>
                  ))}

                  {/* Matrix Rows (Impact 5 down to 1) */}
                  {[5, 4, 3, 2, 1].map((impact) => (
                    <React.Fragment key={`row-${impact}`}>
                      <div className="p-2 font-bold text-slate-600 bg-slate-50 rounded flex items-center justify-center">
                        I{impact}
                      </div>
                      {[1, 2, 3, 4, 5].map((likelihood) => {
                        const cellKey = `${likelihood}-${impact}`;
                        const cellControls = matrix[cellKey] || [];
                        const score = likelihood * impact;
                        const cellBg =
                          score >= 15
                            ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : score >= 8
                            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';

                        return (
                          <div
                            key={cellKey}
                            className={`min-h-[64px] p-1.5 border rounded-lg flex flex-col items-center justify-center gap-1 transition ${cellBg}`}
                          >
                            <span className="text-[10px] font-bold text-slate-400">
                              {score}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {cellControls.map((ctrl) => (
                                <button
                                  key={ctrl.id}
                                  onClick={() => setSelectedControlId(ctrl.id)}
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded shadow-2xs transition ${
                                    selectedControlId === ctrl.id
                                      ? 'bg-sky-700 text-white ring-2 ring-sky-400'
                                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-sky-50'
                                  }`}
                                >
                                  {ctrl.code}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Friendly Quadrant List View */
            <div className="space-y-3">
              {Object.values(controls).map((ctrl) => (
                <div
                  key={ctrl.id}
                  onClick={() => setSelectedControlId(ctrl.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedControlId === ctrl.id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sky-800">{ctrl.code}</span>
                    <p className="font-medium text-slate-700 mt-0.5">{ctrl.cycle}</p>
                    <p className="text-slate-500 text-[11px]">{ctrl.impact}</p>
                  </div>
                  <span className={`font-semibold text-xs ${ctrl.statusColor}`}>
                    {ctrl.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <ControlDetailPanel control={selectedControl} />
        </div>
      </div>
    </div>
  );
}
