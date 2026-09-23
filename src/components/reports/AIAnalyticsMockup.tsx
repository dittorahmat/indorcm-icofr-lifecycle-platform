import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { 
  BrainCircuit, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Search, 
  FileSearch, 
  UserCheck, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_DRILLDOWN_DATA } from '@shared/ai-mock-data';
import { AI_BANKING_DRILLDOWN_DATA } from '@shared/ai-banking-data';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

export function AIAnalyticsMockup() {
  const { companyName } = useOrganizationBranding();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold tracking-wider uppercase">Continuous Monitoring</Badge>
            <div className="h-1 w-1 rounded-full bg-slate-500"></div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">ICOFR Analytics Core</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Digital Control Analytics Hub</h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Continuous Control Monitoring & Automated Fraud Detection for <strong>{companyName}</strong>.
          </p>
        </div>

        <div className="flex gap-6 items-center">
          <div className="text-right px-4 border-r border-slate-700">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Status</p>
            <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-mono text-xs font-semibold mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ONLINE
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Data Freshness</p>
            <p className="text-slate-200 font-mono text-xs uppercase mt-0.5">Real-time Sync</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 border border-slate-200/60 shadow-sm">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
            <TrendingUp className="h-4 w-4" /> Data Analytics (Slide 8)
          </TabsTrigger>
          <TabsTrigger value="ai-cases" className="data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
            <BrainCircuit className="h-4 w-4" /> AI Use Cases (Slide 9)
          </TabsTrigger>
          <TabsTrigger value="ccm" className="data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
            <ShieldAlert className="h-4 w-4" /> CCM Monitoring (Slide 10)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="ai-cases">
          <AICasesTab />
        </TabsContent>
        <TabsContent value="ccm">
          <CCMTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AnalyticsTab() {
  const bankingTrendData = [
    { name: 'Jan', loans: 400, casa: 450 },
    { name: 'Feb', loans: 420, casa: 460 },
    { name: 'Mar', loans: 450, casa: 480 },
    { name: 'Apr', loans: 480, casa: 510 },
    { name: 'May', loans: 520, casa: 540 },
    { name: 'Jun', loans: 550, casa: 580 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" /> Loan Disbursement vs CASA Growth
          </CardTitle>
          <CardDescription>Correlation between credit expansion and stable funding mix (Billion IDR).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bankingTrendData}>
                <defs>
                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCasa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="loans" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLoans)" strokeWidth={2} />
                <Area type="monotone" dataKey="casa" stroke="#10b981" fillOpacity={1} fill="url(#colorCasa)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Non-Performing Loan (NPL)</CardTitle>
            <CardDescription>Aggregate credit risk status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">2.14% Gross</div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[42%]"></div>
              </div>
              <p className="text-xs text-muted-foreground">OJK Threshold: 5.0%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900">Suspense Account Aging</CardTitle>
            <CardDescription>Items &gt; 3 days requiring resolution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">142</div>
            <p className="text-xs font-medium text-indigo-600 mt-1">Pending items flagged by AI</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">LDR (Loan to Deposit Ratio)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankingTrendData.slice(0, 4)}>
                <Bar dataKey="loans" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs mt-4 font-mono text-slate-500 uppercase tracking-widest">Baseline: 85% - 92%</p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold italic">Enterprise Risk Indicators (Banking)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Dormant Account Reactivations</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">12 Flagged</span>
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Unauthorized Rate Overrides</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">2 Critical</span>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">AML Smurfing Patterns</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">5 Clusters</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AICasesTab() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);

  const useCases = [
    { id: "aml-detection", title: "AML Pattern Engine", icon: <ShieldAlert className="h-6 w-6" />, desc: "Detects structured money laundering patterns using high-velocity scatter analysis.", status: "LIVE", color: "text-red-600 bg-red-50 border-red-100" },
    { id: "credit-portfolio", title: "Loan Portfolio Predictor", icon: <BarChart3 className="h-6 w-6" />, desc: "Multi-dimensional risk assessment of loan clusters using radar variance.", status: "BETA", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { id: "suspense-monitoring", title: "Suspense Account NLP", icon: <Search className="h-6 w-6" />, desc: "Automated reconciliation of suspense items using semantic mismatch detection.", status: "LIVE", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { id: "fraud-transactions", title: "Internal Fraud Detection", icon: <FileSearch className="h-6 w-6" />, desc: "Identifies unauthorized overrides and journal description anomalies.", status: "LIVE", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { id: "kyc-onboarding", title: "KYC Sentiment Score", icon: <UserCheck className="h-6 w-6" />, desc: "Automated scoring of customer onboarding risk using open-source intelligence.", status: "BETA", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { id: "liquidity-forecast", title: "Predictive Liquidity", icon: <Zap className="h-6 w-6" />, desc: "Forecasting ATM cash requirements and data center operational health.", status: "POC", color: "text-orange-600 bg-orange-50 border-orange-100" },
  ];

  return (
    <div className="relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedCaseId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <AIDrilldownView 
              useCase={useCases.find(u => u.id === selectedCaseId)} 
              onBack={() => setSelectedCaseId(null)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {useCases.map((uc) => (
              <motion.div layoutId={`card-${uc.id}`} key={uc.id}>
                <Card 
                  className="h-full hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                  onClick={() => setSelectedCaseId(uc.id)}
                >
                  <CardHeader className={cn("pb-4 h-full", uc.color)}>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white rounded-lg shadow-sm">{uc.icon}</div>
                      <Badge variant="outline" className="bg-white/50 text-xs font-bold">{uc.status}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg font-black tracking-tight">{uc.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{uc.desc}"</p>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Model Accuracy: 94.2%</span>
                      <span className="group-hover:text-primary transition-colors">Details →</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIDrilldownView({ useCase, onBack }: { useCase: any, onBack: () => void }) {
  const data = AI_BANKING_DRILLDOWN_DATA[useCase.id];

  if (!data) return (
    <div className="p-20 text-center">
      <CardTitle className="text-slate-300">Data for {useCase.title} not available in Banking Mockup</CardTitle>
      <Button variant="ghost" onClick={onBack} className="mt-4">Back to Cases</Button>
    </div>
  );

  const mainColorClass = useCase.color.split(' ')[0]; // e.g., "text-red-600"
  
  const colorMap: Record<string, string> = {
    "text-red-600": "#e11d48", // Rose 600
    "text-indigo-600": "#4f46e5", // Indigo 600
    "text-amber-600": "#f59e0b", // Amber 500
    "text-blue-600": "#2563eb", // Blue 600
    "text-purple-600": "#9333ea", // Purple 600
    "text-orange-600": "#ea580c" // Orange 600
  };

  const activeColor = colorMap[mainColorClass] || "#4f46e5";

  return (
    <motion.div layoutId={`card-${useCase.id}`} className="h-full">
      <Card className="min-h-[600px] border-slate-200/60 shadow-xl overflow-hidden flex flex-col h-full">
        <CardHeader className={cn("pb-6 transition-colors duration-500", useCase.color)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-current group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="p-2 bg-white rounded-lg shadow-sm">{useCase.icon}</div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tighter">{useCase.title}</CardTitle>
                <CardDescription className="text-current opacity-70">Banking Analytical Workbench</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white text-slate-900 font-bold uppercase tracking-tighter px-2 py-0.5">{useCase.status}</Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10 uppercase tracking-tighter">Financial Cluster</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8 flex-1 overflow-auto">

        {/* Metric Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.metrics.map((m, i) => (
            <div key={i} className="p-4 rounded-xl border bg-slate-50/50 border-slate-200/60 shadow-sm space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tracking-tight">{m.value}</span>
                {m.trend && (
                  <TrendingUp className={cn(
                    "h-4 w-4",
                    m.trend === 'up' ? "text-green-500" : "text-red-500"
                  )} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-600 flex items-center gap-2">
              <Activity className="h-4 w-4" /> {data.chart.title}
            </h3>
            <span className="text-xs font-mono text-slate-400">Visualization: {data.chart.type.toUpperCase()}</span>
          </div>
          
          <div className="h-[300px] w-full bg-slate-50/30 rounded-xl border border-dashed border-slate-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              {data.chart.type === 'bar' ? (
                <BarChart data={data.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey={Object.keys(data.chart.data[0])[1]} fill={activeColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : data.chart.type === 'line' ? (
                <LineChart data={data.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey={Object.keys(data.chart.data[0])[1]} stroke={activeColor} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : data.chart.type === 'scatter' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="number" dataKey={Object.keys(data.chart.data[0])[1]} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data" data={data.chart.data} fill={activeColor} />
                </ScatterChart>
              ) : data.chart.type === 'radar' ? (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chart.data}>
                  <PolarGrid stroke="hsl(var(--muted))" />
                  <PolarAngleAxis dataKey="subject" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} />
                  <Radar name="Score" dataKey="A" stroke={activeColor} fill={activeColor} fillOpacity={0.6} />
                </RadarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300 italic">Unsupported chart type</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Findings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-600 flex items-center gap-2">
              <Search className="h-4 w-4" /> Discovery Log (Mock Data)
            </h3>
            <Badge variant="outline" className="text-xs font-black uppercase tracking-tighter">Real-time Analysis</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-widest border-b">
                  {Object.keys(data.findings[0]).map(k => (
                    <th key={k} className="pb-2 px-2">{k.toUpperCase().replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.findings.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(f).map((v: any, j) => (
                      <td key={j} className="py-3 px-2 font-medium">
                        {v === 'High' || v === 'Critical' || v === 'Fail' ? (
                          <Badge className="bg-red-500 text-xs h-4 uppercase">{v}</Badge>
                        ) : v === 'Pass' || v === 'Good' || v === 'Low Risk' ? (
                          <Badge className="bg-green-500 text-xs h-4 uppercase">{v}</Badge>
                        ) : (
                          <span className="text-slate-700">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

function CCMTab() {
  const alerts = [
    { time: '10:42 AM', type: 'ALERT', msg: 'Potential Smurfing detected: Account #8821-XX (5 deposits < 10M in 4h).', severity: 'HIGH' },
    { time: '10:15 AM', type: 'ALERT', msg: 'Unauthorized Rate Override: SME Loan #992 changed from 8.5% to 6.0% by User ADMIN_OPS.', severity: 'HIGH' },
    { time: '09:15 AM', type: 'LOG', msg: 'Daily Suspense Account variance check completed. Within tolerance (0.4%).', severity: 'INFO' },
    { time: '08:30 AM', type: 'ALERT', msg: 'Dormant Account Reactivation: Account #1029-XX (Inactive 2 yrs) rapid debit: 500M.', severity: 'HIGH' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Backdated GL entry detected in Treasury (15 days delay). Ref: TR-9921.', severity: 'MEDIUM' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Duplicate CIF detected: Same KTP found for 2 different Customer IDs.', severity: 'MEDIUM' },
    { time: '2 days ago', type: 'LOG', msg: 'Customer master data change: Limit increase for Corporate Client ID-001.', severity: 'INFO' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Continuous Control Monitoring (CCM)</CardTitle>
              <CardDescription>Live automated monitoring of key internal controls.</CardDescription>
            </div>
            <Badge className="bg-indigo-600">LIVE FEED</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {alerts.map((alert, i) => (
              <div key={i} className="p-4 hover:bg-slate-50/80 transition-colors flex gap-4 items-start">
                <div className={cn(
                  "mt-1 h-2 w-2 rounded-full shrink-0",
                  alert.severity === 'HIGH' ? "bg-red-500" :
                  alert.severity === 'MEDIUM' ? "bg-amber-500" : "bg-blue-500"
                )} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {alert.time}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-xs h-4 px-1 font-black",
                      alert.type === 'ALERT' ? "border-red-200 text-red-700 bg-red-50" : "border-slate-200 text-slate-600 bg-slate-50"
                    )}>{alert.type}</Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-700">{alert.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Control Effectiveness Score</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">98.4</div>
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1 uppercase">
              <TrendingUp className="h-3 w-3" /> +1.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tighter text-slate-500">Monitoring Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Automated Controls</span>
                  <span>82%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[82%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Manual Controls Covered</span>
                  <span>45%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[45%]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
