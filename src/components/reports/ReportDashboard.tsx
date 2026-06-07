import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { COSOHeatmap } from './COSOHeatmap';
import { useTranslation } from 'react-i18next';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

interface ReportDashboardProps {
  summaryData: any;
  isEffective: boolean;
}

export function ReportDashboard({ summaryData, isEffective }: ReportDashboardProps) {
  const { t } = useTranslation('reports');
  const { companyName } = useOrganizationBranding();

  const clusterName = companyName.toLowerCase().includes('bank') ? "Financial (BUMN Cluster)" : "Mining & Energy";

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader><CardTitle>Compliance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Entity Cluster</p>
                  <p className="text-lg font-bold">{clusterName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Last Review</p>
                  <p className="text-lg font-bold">May 11, 2026</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Auditor Sign-off</p>
                  <p className="text-lg font-bold text-green-600 flex items-center gap-1">Validated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Effectiveness</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", isEffective ? "text-green-600" : "text-red-600")}>
                {isEffective ? t('assessment.conclusionEffective').toUpperCase().replace('CONCLUSION: ', '') : t('assessment.conclusionIneffective').toUpperCase().replace('CONCLUSION: ', '')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Controls</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{summaryData?.totalControls || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Deficiencies</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-bold", (summaryData?.openDeficiencies || 0) > 0 ? "text-red-600" : "text-green-600")}>
                {summaryData?.openDeficiencies || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <COSOHeatmap />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Deficiencies by Severity</CardTitle></CardHeader>
          <CardContent>
            {(summaryData?.deficienciesBySeverity?.length > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summaryData?.deficienciesBySeverity || []}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                  <YAxis stroke="#888888" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm italic">
                No deficiency data available
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deficiency Status</CardTitle></CardHeader>
          <CardContent>
            {(summaryData?.deficienciesByStatus?.some((d: any) => d.count > 0)) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={summaryData?.deficienciesByStatus || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {(summaryData?.deficienciesByStatus || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Open' ? '#F97316' : '#16A34A'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm italic">
                No deficiency status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
