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

interface ScopingHealthDashboardProps {
  glData: GLRow[];
}

export function ScopingHealthDashboard({ glData }: ScopingHealthDashboardProps) {
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
            Data Integrity (SK-5 P13)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Balance Check:</span>
            {balanceStatus.isBalanced ? (
              <Badge className="bg-green-600 text-xs">BALANCED</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">UNBALANCED</Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Total Net Balance</p>
            <p className={cn("font-mono font-bold", balanceStatus.isBalanced ? "text-green-700" : "text-destructive")}>
              Rp {balanceStatus.total.toLocaleString('id-ID')}
            </p>
          </div>
          {!balanceStatus.isBalanced && (
            <p className="text-xs text-destructive mt-2 italic">
              * WARNING: GL data should sum to zero. Check for missing journal entries.
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
                Benford's Law Analysis (Fraud Risk - P8)
              </CardTitle>
              <CardDescription className="text-xs">Digit distribution analysis for anomaly detection.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 border-slate-200">
              Forensic View
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
                  <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={12} />
                  <Line type="monotone" dataKey="standard" name="Standard" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="w-48 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-center gap-1 font-bold text-amber-700 mb-1">
                <AlertCircle className="h-3 w-3" /> GUIDANCE
              </div>
              Deviations from the red line (Standard) may indicate numeric manipulation. Consider rating <strong>HIGH</strong> on <strong>Rule 1</strong> if significant variances are found.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
