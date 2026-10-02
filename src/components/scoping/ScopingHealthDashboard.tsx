import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  calculateBenfordDistribution, 
  BENFORD_STANDARD 
} from '@/lib/compliance-utils';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Line, ComposedChart 
} from 'recharts';
import { GLRow } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { ScopingComplianceResult } from '@/pages/scoping/services/materiality-calc';

interface ScopingHealthDashboardProps {
  glData: GLRow[];
  scopingCompliance?: ScopingComplianceResult | null;
}

export function ScopingHealthDashboard({ glData, scopingCompliance }: ScopingHealthDashboardProps) {
  const { t } = useTranslation('scoping');
  const benfordData = React.useMemo(() => {
    if (glData.length === 0) return [];
    const distribution = calculateBenfordDistribution(glData.map(r => Math.abs(r.balance)));
    return distribution.map((val, i) => ({
      digit: i + 1,
      actual: parseFloat(val.toFixed(1)),
      standard: BENFORD_STANDARD[i],
    }));
  }, [glData]);

  const balanceStatus = React.useMemo(() => {
    const total = glData.reduce((sum, row) => sum + row.balance, 0);
    const isBalanced = Math.abs(total) < 1; // Tolerance 1 IDR
    return { total, isBalanced };
  }, [glData]);

  if (glData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Integrity Check */}
      <Card className={cn(
        "md:col-span-1 border-l-4",
        balanceStatus.isBalanced ? "border-l-green-500 bg-green-50/10" : "border-l-destructive bg-destructive/5"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
            <ShieldCheck className={cn("h-4 w-4", balanceStatus.isBalanced ? "text-green-600" : "text-destructive")} />
            {t('health.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">{t('health.balanceCheck')}</span>
            {balanceStatus.isBalanced ? (
              <Badge className="bg-green-600 text-xs">BALANCED</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">UNBALANCED</Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">{t('health.netBalance')}</p>
            <p className={cn("font-mono font-bold", balanceStatus.isBalanced ? "text-green-700" : "text-destructive")}>
              Rp {balanceStatus.total.toLocaleString('id-ID')}
            </p>
          </div>
          {!balanceStatus.isBalanced && (
            <p className="text-xs text-destructive mt-2 italic">
              {t('health.unbalancedWarning')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Benford's Law Analysis */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-primary">
                <BarChart3 className="h-4 w-4" />
                {t('health.benfordTitle')}
              </CardTitle>
              <CardDescription className="text-xs">{t('health.benfordDesc')}</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
              {t('health.forensicView')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="h-[120px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={benfordData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="digit" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                    formatter={(val: number) => [`${val}%`]}
                  />
                  <Bar dataKey="actual" name={t('intake.benford.actual')} fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={12} />
                  <Line type="monotone" dataKey="standard" name={t('intake.benford.standard')} stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="w-48 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-center gap-1 font-bold text-amber-700 mb-1">
                <AlertCircle className="h-3 w-3" /> GUIDANCE
              </div>
              {t('health.guidance')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2/3 Scoping Compliance Card */}
      {scopingCompliance && (
        <Card className={cn(
          "col-span-1 md:col-span-3 border-l-4",
          scopingCompliance.isOverallCompliant ? "border-l-emerald-500 bg-emerald-50/10" : "border-l-amber-500 bg-amber-50/10"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-primary">
              <ShieldCheck className={cn("h-4 w-4", scopingCompliance.isOverallCompliant ? "text-emerald-600" : "text-amber-500")} />
              {t('health.complianceCheck')}
            </CardTitle>
            <CardDescription className="text-xs">{t('health.complianceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">{t('health.assetsCoverage')}</span>
                <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                  <span className={scopingCompliance.aggregateCompliance.assets.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                    {scopingCompliance.aggregateCompliance.assets.percentage.toFixed(1)}%
                  </span>
                  <Badge variant={scopingCompliance.aggregateCompliance.assets.isCompliant ? "default" : "secondary"} className="text-xs font-bold h-4 px-1 bg-white border border-slate-200 shadow-none">
                    {scopingCompliance.aggregateCompliance.assets.isCompliant ? t('health.compliant') : t('health.nonCompliant')}
                  </Badge>
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">{t('health.liabilitiesCoverage')}</span>
                <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                  <span className={scopingCompliance.aggregateCompliance.liabilities.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                    {scopingCompliance.aggregateCompliance.liabilities.percentage.toFixed(1)}%
                  </span>
                  <Badge variant={scopingCompliance.aggregateCompliance.liabilities.isCompliant ? "default" : "secondary"} className="text-xs font-bold h-4 px-1 bg-white border border-slate-200 shadow-none">
                    {scopingCompliance.aggregateCompliance.liabilities.isCompliant ? t('health.compliant') : t('health.nonCompliant')}
                  </Badge>
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">{t('health.revenueCoverage')}</span>
                <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                  <span className={scopingCompliance.aggregateCompliance.revenue.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                    {scopingCompliance.aggregateCompliance.revenue.percentage.toFixed(1)}%
                  </span>
                  <Badge variant={scopingCompliance.aggregateCompliance.revenue.isCompliant ? "default" : "secondary"} className="text-xs font-bold h-4 px-1 bg-white border border-slate-200 shadow-none">
                    {scopingCompliance.aggregateCompliance.revenue.isCompliant ? t('health.compliant') : t('health.nonCompliant')}
                  </Badge>
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400">{t('health.expensesCoverage')}</span>
                <p className="text-xs font-black flex items-center gap-1.5 mt-0.5">
                  <span className={scopingCompliance.aggregateCompliance.expenses.isCompliant ? "text-emerald-600" : "text-amber-600"}>
                    {scopingCompliance.aggregateCompliance.expenses.percentage.toFixed(1)}%
                  </span>
                  <Badge variant={scopingCompliance.aggregateCompliance.expenses.isCompliant ? "default" : "secondary"} className="text-xs font-bold h-4 px-1 bg-white border border-slate-200 shadow-none">
                    {scopingCompliance.aggregateCompliance.expenses.isCompliant ? t('health.compliant') : t('health.nonCompliant')}
                  </Badge>
                </p>
              </div>
            </div>

            {/* Non-compliant FSLIs Alert */}
            {!scopingCompliance.isOverallCompliant && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  {t('health.nonCompliantFslis')}
                </div>
                <ul className="list-disc pl-5 font-medium space-y-0.5">
                  {scopingCompliance.fsliCoverages.filter(c => !c.isCompliant).map(c => (
                    <li key={c.fsliName}>
                      {c.fsliName}: <span className="font-black">{c.coveragePercentage.toFixed(1)}%</span> (Consolidated: {c.consolidatedBalance.toLocaleString('id-ID')})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
