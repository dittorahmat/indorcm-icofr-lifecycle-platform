import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PERURI_CCM_ALERTS } from '@shared/ai-peruri-data';
import { useTranslation } from 'react-i18next';

export function CCMTab() {
  const { t } = useTranslation('reports');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 min-w-0 max-w-full">
      <Card className="md:col-span-2 rounded-lg border-border">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">{t('aiHub.ccmTitle')}</CardTitle>
              <CardDescription>{t('aiHub.ccmDesc')}</CardDescription>
            </div>
            <Badge className="bg-sky-700 text-white font-semibold text-xs">{t('aiHub.liveFeed')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {PERURI_CCM_ALERTS.map((alert, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                <div
                  className={cn(
                    'mt-1.5 h-2 w-2 rounded-full shrink-0',
                    alert.severity === 'HIGH'
                      ? 'bg-red-500'
                      : alert.severity === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                  )}
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" />{' '}
                      {alert.time === 'Yesterday'
                        ? t('aiHub.timeYesterday')
                        : alert.time === '2 days ago'
                          ? t('aiHub.time2DaysAgo')
                          : alert.time}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs h-5 px-1.5 font-bold uppercase',
                        alert.type === 'ALERT'
                          ? 'border-red-200 text-red-700 bg-red-50'
                          : 'border-slate-200 text-slate-600 bg-slate-50'
                      )}
                    >
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed break-words">{alert.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('aiHub.effectivenessTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">98.4%</div>
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1 uppercase">
              <TrendingUp className="h-3 w-3" /> {t('aiHub.cycleImprovement')}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('aiHub.coverageTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase flex-wrap gap-2">
                  <span>{t('aiHub.automatedControls')}</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 w-[78%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase flex-wrap gap-2">
                  <span>{t('aiHub.manualControls')}</span>
                  <span>52%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[52%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
