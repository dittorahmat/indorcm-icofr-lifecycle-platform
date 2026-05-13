import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_DRILLDOWN_DATA } from '@shared/ai-mock-data';

const MOCK_COMPANY = "PT BATUBARA NUSANTARA SEJAHTERA";

export function AIAnalyticsMockup() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-xl border border-indigo-500/30 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
          <BrainCircuit className="h-40 w-40 text-white" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500 hover:bg-indigo-600 text-xs font-black tracking-tighter uppercase">Enterprise AI</Badge>
            <div className="h-1 w-1 rounded-full bg-slate-500"></div>
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Digital Audit Core</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Digital Analytics Hub</h2>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Advanced Predictive Analytics & Continuous Control Monitoring for <strong>{MOCK_COMPANY}</strong> mining operations.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="text-right px-4 border-r border-slate-700">
            <p className="text-xs text-slate-500 font-bold uppercase">System Status</p>
            <div className="flex items-center gap-1 text-green-400 font-mono text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              OPTIMIZED
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase">Data Freshness</p>
            <p className="text-indigo-300 font-mono text-xs uppercase">Real-time Sync</p>
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
  const stockpileData = [
    { name: 'Jan', sales: 400, stockpile: 450 },
    { name: 'Feb', sales: 300, stockpile: 320 },
    { name: 'Mar', sales: 500, stockpile: 480 },
    { name: 'Apr', sales: 450, stockpile: 510 },
    { name: 'May', sales: 600, stockpile: 590 },
    { name: 'Jun', sales: 550, stockpile: 620 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" /> Analisis Pergerakan Stockpile vs Penjualan
          </CardTitle>
          <CardDescription>Correlation between mine output, sales, and inventory balance (Tonnes).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockpileData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="stockpile" stroke="#10b981" fillOpacity={1} fill="url(#colorStock)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Deteksi Selisih Timbang</CardTitle>
            <CardDescription>Weighbridge vs Stockpile Survey Variance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600">3.2% Variance</div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[32%]"></div>
              </div>
              <p className="text-xs text-muted-foreground">Threshold limit: 2.0%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900">Abnormal Journal Entries</CardTitle>
            <CardDescription>Detected by AI Pattern Matching.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">14</div>
            <p className="text-xs font-medium text-indigo-600 mt-1">Flagged for manual review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Analisis Cost per Ton</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockpileData.slice(0, 4)}>
                <Bar dataKey="stockpile" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs mt-4 font-mono text-slate-500 uppercase tracking-widest">Efficiency Baseline: $42.50/ton</p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold italic">Enterprise Risk Indicators (Mining)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Ghost Employee Check</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">0 Active</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Duplicate Vendor Payment</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">1 Flagged</span>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Procurement Split PO</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold">2 Potential</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
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
    { id: "fraud-detection", title: "Fraud Detection", icon: <ShieldAlert className="h-6 w-6" />, desc: "Anomali pada pengadaan jasa kontraktor dan klaim lembur.", status: "LIVE", color: "text-red-600 bg-red-50 border-red-100" },
    { id: "anomaly-journal", title: "Anomaly Journal Entry", icon: <FileSearch className="h-6 w-6" />, desc: "Pattern matching untuk mendeteksi 'Unusual Description' dan 'Account Mismatch'.", status: "LIVE", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { id: "predictive-control", title: "Predictive Control Failure", icon: <AlertTriangle className="h-6 w-6" />, desc: "Forecasting kegagalan kontrol berdasarkan tren historis (Early Warning).", status: "BETA", color: "text-amber-600 bg-amber-50 border-amber-100" },
    { id: "nlp-contracts", title: "NLP Contract Review", icon: <Search className="h-6 w-6" />, desc: "Review otomatis klausul 'Penalty' dan 'Escalation' pada kontrak PKP2B.", status: "LIVE", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { id: "vendor-risk", title: "Vendor Risk Scoring", icon: <UserCheck className="h-6 w-6" />, desc: "Scoring otomatis performa dan kepatuhan vendor kontraktor tambang.", status: "BETA", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { id: "predictive-maintenance", title: "Predictive Maintenance", icon: <Zap className="h-6 w-6" />, desc: "Korelasi biaya maintenance alat berat vs umur operasional.", status: "POC", color: "text-orange-600 bg-orange-50 border-orange-100" },
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
  const data = AI_DRILLDOWN_DATA[useCase.id];

  if (!data) return null;

  const mainColorClass = useCase.color.split(' ')[0]; // e.g., "text-red-600"
  
  const colorMap: Record<string, string> = {
    "text-red-600": "#dc2626",
    "text-indigo-600": "#4f46e5",
    "text-amber-600": "#d97706",
    "text-blue-600": "#2563eb",
    "text-purple-600": "#9333ea",
    "text-orange-600": "#ea580c"
  };

  const activeColor = colorMap[mainColorClass] || "#6366f1";

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
                <CardDescription className="text-current opacity-70">Analytical Workbench & Pattern Discovery</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white text-slate-900 font-bold uppercase tracking-tighter px-2 py-0.5">{useCase.status}</Badge>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10 uppercase tracking-tighter">Mining Cluster</Badge>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey={Object.keys(data.chart.data[0])[1]} fill={activeColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : data.chart.type === 'line' ? (
                <LineChart data={data.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey={Object.keys(data.chart.data[0])[1]} stroke={activeColor} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : data.chart.type === 'scatter' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey={Object.keys(data.chart.data[0])[0]} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey={Object.keys(data.chart.data[0])[1]} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data" data={data.chart.data} fill={activeColor} />
                </ScatterChart>
              ) : data.chart.type === 'radar' ? (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chart.data}>
                  <PolarGrid stroke="#e2e8f0" />
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
    { time: '10:42 AM', type: 'ALERT', msg: 'Potential PO Split detected: Vendor CV MAKMUR JAYA (3 POs < 100M in 24h).', severity: 'HIGH' },
    { time: '10:15 AM', type: 'ALERT', msg: 'Manual Price Override: Contract price $45.00 changed to $48.50 by User ADMIN_OPS.', severity: 'MEDIUM' },
    { time: '09:15 AM', type: 'LOG', msg: 'Daily Weighbridge variance check completed. Within tolerance (1.1%).', severity: 'INFO' },
    { time: '08:30 AM', type: 'ALERT', msg: 'New Vendor Quick Payment: PT BARU SUKSES (created today, paid in < 2h).', severity: 'HIGH' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Backdated journal entry detected in R2R (30 days delay). Ref: JV-9921.', severity: 'MEDIUM' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Negative stock detected in Warehouse 02 (Fuel/Diesel inventory).', severity: 'HIGH' },
    { time: '2 days ago', type: 'LOG', msg: 'Vendor master data change: Bank Account updated for PT ALAT BERAT.', severity: 'MEDIUM' },
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
                  alert.severity === 'HIGH' ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
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
        <Card className="bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-slate-400">Control Effectiveness Score</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black italic tracking-tighter">98.4</div>
            <p className="text-xs font-bold text-green-400 mt-2 flex items-center gap-1 uppercase">
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
