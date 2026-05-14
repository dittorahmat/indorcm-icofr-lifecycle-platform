import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = [
  '#4f46e5', // Indigo 600
  '#0ea5e9', // Sky 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
];

interface ComplianceChartsProps {
  rcmData: any;
  deficiencyBySeverity: any;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg">
        <p className="text-xs font-bold text-slate-900 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
          <p className="text-xs font-medium text-slate-600">
            {payload[0].name}: <span className="font-bold text-slate-900">{payload[0].value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function ComplianceCharts({ rcmData, deficiencyBySeverity, isLoading }: ComplianceChartsProps) {
  const barData = React.useMemo(() => {
    return (rcmData?.items || []).map((r: any) => ({ 
      name: r.process, 
      controls: Array.isArray(r.controls) ? r.controls.length : 0 
    }));
  }, [rcmData]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">Controls by Process</CardTitle>
          </div>
          <CardDescription className="text-[11px] font-medium text-slate-500">Number of controls defined for each major process.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-6 pb-6">
          <div className="h-[300px] w-full">
            {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar 
                    dataKey="controls" 
                    name="Controls"
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-rose-600" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">Deficiencies by Severity</CardTitle>
          </div>
          <CardDescription className="text-[11px] font-medium text-slate-500">Breakdown of all open deficiencies.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-6 pb-6">
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            {isLoading ? <Skeleton className="h-full w-full rounded-full max-w-[200px] max-h-[200px]" /> : (!deficiencyBySeverity || deficiencyBySeverity.length === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">No deficiencies reported</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={deficiencyBySeverity} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={85} 
                    paddingAngle={5}
                    stroke="none"
                  >
                    {deficiencyBySeverity.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {!isLoading && deficiencyBySeverity && deficiencyBySeverity.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                {deficiencyBySeverity.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{entry.name}</span>
                    <span className="text-[10px] font-bold text-slate-900 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
