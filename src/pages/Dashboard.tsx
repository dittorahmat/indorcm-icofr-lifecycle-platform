import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MainHeader } from '@/components/layout/MainHeader';
import { api } from '@/lib/api-client';
import type { RCM, Deficiency } from '@shared/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
const COLORS = ['#16A34A', '#F97316', '#DC2626']; // Green, Orange, Red
const kpiData = [
  { title: 'Control Coverage', value: '98.7%', icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
  { title: 'Open Deficiencies', value: '12', icon: <AlertTriangle className="h-6 w-6 text-orange-500" /> },
  { title: 'Overdue Tasks', value: '3', icon: <Clock className="h-6 w-6 text-red-500" /> },
];
export function Dashboard() {
  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm'),
  });
  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });
  const deficiencyBySeverity = React.useMemo(() => {
    if (!deficienciesData) return [];
    const counts = deficienciesData.items.reduce((acc, def) => {
      acc[def.severity] = (acc[def.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [deficienciesData]);
  const isLoading = rcmLoading || deficienciesLoading;
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {kpiData.map((kpi, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    {kpi.icon}
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-bold">{kpi.value}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Controls by Process</CardTitle>
                  <CardDescription>Number of controls defined for each major process.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <BarChart data={rcmData?.items.map(r => ({ name: r.process, controls: r.controls.length }))}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="controls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Deficiencies by Severity</CardTitle>
                  <CardDescription>Breakdown of all open deficiencies.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> : (
                      <PieChart>
                        <Pie data={deficiencyBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {deficiencyBySeverity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}