import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// High-end Corporate Navy/Slate Palette
const COLORS = [
  '#0f172a', // Slate 900 (Navy)
  '#4f46e5', // Indigo 600
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#e11d48', // Rose 600
];

interface ComplianceChartsProps {
  barData: any[];
  deficiencyBySeverity: any;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border-none shadow-2xl rounded-xl ring-1 ring-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        {payload.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill || item.color }} />
            <p className="text-xs font-bold text-slate-900">
              {item.name}: <span className="font-display font-extrabold ml-1">{item.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ComplianceCharts({ barData, deficiencyBySeverity, isLoading }: ComplianceChartsProps) {
  const { t } = useTranslation('dashboard');
  
  const totalDeficiencies = React.useMemo(() => {
    if (!deficiencyBySeverity) return 0;
    return deficiencyBySeverity.reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [deficiencyBySeverity]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* BAR CHART: CONTROLS BY PROCESS */}
      <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="bg-slate-50 border-b py-5 px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-900" />
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">{t('charts.controlsByProcess.title')}</CardTitle>
          </div>
          <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('charts.controlsByProcess.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-6 pb-6">
          <div className="h-[300px] w-full">
            {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('charts.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={9} 
                    fontWeight={800}
                    tickLine={false} 
                    axisLine={false}
                    dy={12}
                    textAnchor="middle"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={9} 
                    fontWeight={800}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }} />
                  <Bar 
                    dataKey="controls" 
                    name={t('charts.controls')}
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PIE CHART: DEFICIENCIES */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="bg-slate-50 border-b py-5 px-6">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-rose-600" />
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">{t('charts.deficienciesBySeverity.title')}</CardTitle>
          </div>
          <CardDescription className="text-[11px] font-medium text-slate-500 mt-1">{t('charts.deficienciesBySeverity.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-6 pb-6">
          <div className="min-h-[400px] w-full flex flex-col items-center justify-between relative">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="relative h-48 w-48 rounded-full border-8 border-slate-100 border-t-slate-900 animate-spin" />
              </div>
            ) : (!deficiencyBySeverity || deficiencyBySeverity.length === 0) ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('charts.noDeficiencies')}</div>
            ) : (
              <>
                <div className="w-full h-[240px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie 
                        data={deficiencyBySeverity} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={70}
                        outerRadius={95} 
                        paddingAngle={4}
                        stroke="none"
                        animationBegin={200}
                        animationDuration={1200}
                      >
                        {deficiencyBySeverity.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Total Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('badges.new')}</span>
                    <span className="text-4xl font-display font-black text-slate-900 leading-none">{totalDeficiencies}</span>
                  </div>
                </div>
                
                <div className="mt-8 space-y-2.5 w-full border-t border-slate-100 pt-6">
                  {deficiencyBySeverity.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">{entry.name}</span>
                      </div>
                      <span className="text-xs font-display font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded group-hover:bg-slate-900 group-hover:text-white transition-all">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
