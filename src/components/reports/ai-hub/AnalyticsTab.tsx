import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PERURI_PRODUCTION_TRENDS, PERURI_QUALITY_BENCHMARKS } from '@shared/ai-peruri-data';

export function AnalyticsTab() {
  const { t } = useTranslation('reports');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 min-w-0 max-w-full">
      <Card className="col-span-1 md:col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> {t('aiHub.trendTitle')}
          </CardTitle>
          <CardDescription>{t('aiHub.trendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
            <div className="min-w-[300px] h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PERURI_PRODUCTION_TRENDS}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="volume" name={t('aiHub.chartVolume')} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="billed" name={t('aiHub.chartBilled')} stroke="#0284c7" fillOpacity={1} fill="url(#colorBilled)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-lg border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('aiHub.reconTitle')}</CardTitle>
            <CardDescription>{t('aiHub.reconDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {t('aiHub.reconVarianceValue', { value: '0.24%' })}
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[28%]" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{t('aiHub.reconThreshold', { value: '0.85%' })}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-50 border-sky-100 rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-sky-900">{t('aiHub.unreconciledTitle')}</CardTitle>
            <CardDescription className="text-sky-700">{t('aiHub.unreconciledDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-800">
              {t('aiHub.unreconciledCount', { count: 14 })}
            </div>
            <p className="text-xs font-semibold text-sky-600 mt-1">{t('aiHub.unreconciledNote')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">{t('aiHub.otpTitle')}</CardTitle>
          <CardDescription>{t('aiHub.otpDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
            <div className="min-w-[300px] h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PERURI_QUALITY_BENCHMARKS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="cluster" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis domain={[95, 100]} fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="rate" name={t('aiHub.chartQualityPass')} fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-center text-xs mt-3 font-mono text-slate-500 uppercase tracking-widest font-semibold">
            {t('aiHub.otpTarget', { value: '99.0%' })}
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">{t('aiHub.riskTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk1Title')}</p>
              <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk1Value')}</span>
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk1Desc')}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk2Title')}</p>
              <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk2Value')}</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk2Desc')}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk3Title')}</p>
              <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk3Value')}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk3Desc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
