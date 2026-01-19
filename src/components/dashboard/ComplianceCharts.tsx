import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#16A34A', '#F97316', '#DC2626'];

interface ComplianceChartsProps {
  rcmData: any;
  deficiencyBySeverity: any;
  isLoading: boolean;
}

export function ComplianceCharts({ rcmData, deficiencyBySeverity, isLoading }: ComplianceChartsProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Controls by Process</CardTitle>
          <CardDescription>Number of controls defined for each major process.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <BarChart data={rcmData?.items.map((r: any) => ({ name: r.process, controls: r.controls.length }))}>
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
                  {deficiencyBySeverity.map((_entry: any, index: number) => (
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
  );
}
