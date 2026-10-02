import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { 
  BrainCircuit, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Search, 
  FileSearch, 
  Ship, 
  Zap, 
  AlertTriangle,
  Clock,
  ArrowLeft,
  Anchor,
  Compass,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_MARITIME_DRILLDOWN_DATA } from '@shared/ai-maritime-data';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

export function AIAnalyticsMockup() {
  const { companyName } = useOrganizationBranding();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-800 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold tracking-wider uppercase">Continuous Monitoring</Badge>
            <div className="h-1 w-1 rounded-full bg-slate-500"></div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">ICOFR Maritime Analytics</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Digital Control Analytics Hub</h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Continuous Control Monitoring & Automated Maritime Anomaly Detection for <strong>{companyName}</strong>.
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
            <p className="text-slate-200 font-mono text-xs uppercase mt-0.5">Real-time Telemetry</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 shadow-sm rounded-lg">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
            <TrendingUp className="h-4 w-4" /> Data Analytics (Slide 8)
          </TabsTrigger>
          <TabsTrigger value="ai-cases" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
            <BrainCircuit className="h-4 w-4" /> AI Use Cases (Slide 9)
          </TabsTrigger>
          <TabsTrigger value="ccm" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
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
  const maritimeTrendData = [
    { name: 'Jan', fuel: 4120, miles: 38400 },
    { name: 'Feb', fuel: 3980, miles: 37100 },
    { name: 'Mar', fuel: 4350, miles: 40200 },
    { name: 'Apr', fuel: 4210, miles: 39500 },
    { name: 'May', fuel: 4580, miles: 42800 },
    { name: 'Jun', fuel: 4420, miles: 41900 },
  ];

  const otpData = [
    { cluster: 'Penumpang', otp: 94 },
    { cluster: 'Tol Laut', otp: 91 },
    { cluster: 'Perintis', otp: 89 },
    { cluster: 'Ternak', otp: 96 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" /> Bunker Fuel Consumption vs Nautical Miles Sailed
          </CardTitle>
          <CardDescription>Correlation between fleet sailing distance (NM) and MDO/HFO fuel consumption (Kiloliter).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maritimeTrendData}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMiles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="fuel" name="Bunker (KL)" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorFuel)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="miles" name="Nautical Miles" stroke="#0284c7" fillOpacity={1} fill="url(#colorMiles)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-lg border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Bunker Discrepancy Rate</CardTitle>
            <CardDescription>Aggregate soundings vs BDN tolerance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">1.82% Variance</div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[36%]"></div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">SK-5 Audit Threshold: &le; 2.00%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-50 border-sky-100 rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-sky-900">Unreconciled PSO & Port Clearance</CardTitle>
            <CardDescription className="text-sky-700">Passenger tickets vs Kemenhub manifests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-800">28 Items</div>
            <p className="text-xs font-semibold text-sky-600 mt-1">Pending verification for PSO invoice submission</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Fleet On-Time Performance (OTP)</CardTitle>
          <CardDescription>Sailing punctuality by vessel cluster.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={otpData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="cluster" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="otp" name="OTP %" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs mt-3 font-mono text-slate-500 uppercase tracking-widest font-semibold">National KPI Target: &ge; 90%</p>
        </CardContent>
      </Card>

      <Card className="col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Enterprise Risk Indicators (Maritime Logistics)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Off-Manifest Container Alert</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">3 Units</span>
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Held at Makassar & Surabaya ports</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Dry-Docking Cost Overrun</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">2 Vessels</span>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">RAB exceeded &gt; 10% during overhaul</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">Bunkering Density Anomaly</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">4 Events</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">BDN density mismatch &gt; 3%</p>
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
    { id: "bunker-anomaly", title: "Bunker & Fuel Anomaly Engine", icon: <Ship className="h-6 w-6" />, desc: "Detects bunker fuel anomalies by correlating SFOC telemetry with vessel speed and sea conditions.", status: "LIVE", color: "text-red-700 bg-red-50 border-red-200" },
    { id: "predictive-docking", title: "Predictive Dry-Docking & Spares", icon: <Anchor className="h-6 w-6" />, desc: "Multi-dimensional evaluation of shipyard repair costs and spare part lead-time variances.", status: "LIVE", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { id: "pso-ticket-recon", title: "Automated PSO & Ticket Recon", icon: <FileCheck2 className="h-6 w-6" />, desc: "Reconciles passenger e-ticketing and port gate scans against Kemenhub PSO subsidy ceilings.", status: "LIVE", color: "text-sky-700 bg-sky-50 border-sky-200" },
    { id: "cargo-leakage", title: "Cargo Demurrage & Slot Audit", icon: <Compass className="h-6 w-6" />, desc: "Identifies unbilled container demurrage and unverified reefer plug-in power logs.", status: "LIVE", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { id: "port-disbursement-nlp", title: "Port Disbursement & Agency NLP", icon: <FileSearch className="h-6 w-6" />, desc: "NLP audit of maritime agency tug and pilotage invoices against official Pelindo tariffs.", status: "BETA", color: "text-purple-700 bg-purple-50 border-purple-200" },
    { id: "crew-payroll", title: "Crew Payroll & Per Diem Validation", icon: <DollarSign className="h-6 w-6" />, desc: "Validates seafarer sailing allowance claims against official Master logbook sign-on records.", status: "LIVE", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="relative min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedCaseId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
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
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {useCases.map((uc) => (
              <div key={uc.id}>
                <Card 
                  className="h-full hover:shadow-md transition-shadow overflow-hidden group cursor-pointer rounded-lg border-border"
                  onClick={() => setSelectedCaseId(uc.id)}
                >
                  <CardHeader className={cn("pb-4 h-full", uc.color)}>
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-border">{uc.icon}</div>
                      <Badge variant="outline" className="bg-white text-xs font-semibold">{uc.status}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-base font-bold tracking-tight">{uc.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{uc.desc}</p>
                    <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span>Model Precision: 95.8%</span>
                      <span className="group-hover:text-primary transition-colors">Details &rarr;</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIDrilldownView({ useCase, onBack }: { useCase: any, onBack: () => void }) {
  const data = AI_MARITIME_DRILLDOWN_DATA[useCase.id];

  if (!data) return (
    <div className="p-20 text-center">
      <CardTitle className="text-slate-400">Data for {useCase.title} not available in Maritime Mockup</CardTitle>
      <Button variant="ghost" onClick={onBack} className="mt-4">Back to Cases</Button>
    </div>
  );

  const mainColorClass = useCase.color.split(' ')[0];
  
  const colorMap: Record<string, string> = {
    "text-red-700": "#b91c1c",
    "text-amber-700": "#b45309",
    "text-sky-700": "#0369a1",
    "text-blue-700": "#1d4ed8",
    "text-purple-700": "#7e22ce",
    "text-emerald-700": "#047857"
  };

  const activeColor = colorMap[mainColorClass] || "#0369a1";

  return (
    <div className="h-full">
      <Card className="min-h-[600px] border-border shadow-md overflow-hidden flex flex-col h-full rounded-lg">
        <CardHeader className={cn("pb-6 transition-colors", useCase.color)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/40 rounded-lg transition-colors text-current group"
                aria-label="Back to use cases"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="p-2 bg-white rounded-lg shadow-sm border border-border">{useCase.icon}</div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">{useCase.title}</CardTitle>
                <CardDescription className="text-current opacity-80 text-xs font-medium">PELNI Maritime Analytical Workbench</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white text-slate-900 font-bold uppercase tracking-wider text-xs px-2 py-0.5">{useCase.status}</Badge>
              <Badge variant="outline" className="border-current/30 text-current bg-white/20 uppercase tracking-wider text-xs">Maritime Logistics Cluster</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8 flex-1 overflow-auto">

        {/* Metric Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.metrics.map((m, i) => (
            <div key={i} className="p-4 rounded-lg border bg-slate-50 border-slate-200 shadow-sm space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold tracking-tight text-slate-900">{m.value}</span>
                {m.trend && (
                  <TrendingUp className={cn(
                    "h-4 w-4",
                    m.trend === 'up' ? "text-emerald-600" : "text-amber-600"
                  )} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-600" /> {data.chart.title}
            </h3>
            <span className="text-xs font-mono text-slate-500">Visualization: {data.chart.type.toUpperCase()}</span>
          </div>
          
          <div className="h-[300px] w-full bg-slate-50/50 rounded-lg border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height="100%">
              {data.chart.type === 'bar' ? (
                <BarChart data={data.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey={Object.keys(data.chart.data[0])[1]} fill={activeColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : data.chart.type === 'line' ? (
                <LineChart data={data.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey={Object.keys(data.chart.data[0])[0]} fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey={Object.keys(data.chart.data[0])[1]} stroke={activeColor} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : data.chart.type === 'scatter' ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" dataKey="speed" name="Speed (Knots)" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="number" dataKey="consumption" name="SFOC (g/kWh)" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }} />
                  <Scatter name="Vessel Voyages" data={data.chart.data} fill={activeColor} />
                </ScatterChart>
              ) : data.chart.type === 'radar' ? (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chart.data}>
                  <PolarGrid stroke="hsl(var(--muted))" />
                  <PolarAngleAxis dataKey="subject" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={12} />
                  <Radar name="Score" dataKey="A" stroke={activeColor} fill={activeColor} fillOpacity={0.4} />
                </RadarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">Unsupported chart type</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Findings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-600" /> Maritime Discovery Log
            </h3>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">Live Analysis</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold uppercase tracking-wider border-b">
                  {Object.keys(data.findings[0]).map(k => (
                    <th key={k} className="pb-2 px-2">{k.toUpperCase().replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.findings.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {Object.values(f).map((v: any, j) => (
                      <td key={j} className="py-3 px-2 font-medium">
                        {v === 'High' || v === 'Critical' || v === 'Inspection Required' ? (
                          <Badge className="bg-red-600 text-white text-xs h-5 uppercase font-semibold">{v}</Badge>
                        ) : v === 'Low' || v === 'Within RAB' || v === 'Verified' ? (
                          <Badge className="bg-emerald-600 text-white text-xs h-5 uppercase font-semibold">{v}</Badge>
                        ) : v === 'Medium' || v === 'Flagged' || v === 'Under Review' || v === 'Held at Gate' ? (
                          <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 text-xs h-5 uppercase font-semibold">{v}</Badge>
                        ) : (
                          <span className="text-slate-800">{v}</span>
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
    </div>
  );
}

function CCMTab() {
  const alerts = [
    { time: '10:42 AM', type: 'ALERT', msg: 'Bunker Discrepancy: KM Kelud recorded 12,000L bunker fill at Tanjung Priok with density variance -4.2% against BDN certificate.', severity: 'HIGH' },
    { time: '10:15 AM', type: 'ALERT', msg: 'Off-Manifest Cargo: 2 container units detected on board KM Sinabung without verified e-manifest at Makassar Port.', severity: 'HIGH' },
    { time: '09:15 AM', type: 'LOG', msg: 'Daily PSO revenue vs passenger ticket reconciliation completed for Cabang Surabaya (Variance: 0.12%, within tolerance).', severity: 'INFO' },
    { time: '08:30 AM', type: 'ALERT', msg: 'Dry-docking Emergency PO: Overhaul repair job order created for KM Bukit Siguntang exceeding authorization threshold (> Rp 500M).', severity: 'HIGH' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Port Disbursement Variance: Stevedoring rate on invoice #INV-PLD-8891 higher than Pelindo official tariff rate (Branch Belawan).', severity: 'MEDIUM' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Backdated Voyage Log: Fuel logbook entry submitted 8 days after voyage completion (Trayek R-14).', severity: 'MEDIUM' },
    { time: '2 days ago', type: 'LOG', msg: 'Annual Survey Certificate compliance validated for 18 active vessels in fleet.', severity: 'INFO' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2 rounded-lg border-border">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">Continuous Control Monitoring (CCM)</CardTitle>
              <CardDescription>Live automated monitoring of key maritime & shipping controls.</CardDescription>
            </div>
            <Badge className="bg-sky-700 text-white font-semibold text-xs">LIVE FEED</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {alerts.map((alert, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                <div className={cn(
                  "mt-1.5 h-2 w-2 rounded-full shrink-0",
                  alert.severity === 'HIGH' ? "bg-red-500" :
                  alert.severity === 'MEDIUM' ? "bg-amber-500" : "bg-sky-500"
                )} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {alert.time}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-xs h-5 px-1.5 font-bold uppercase",
                      alert.type === 'ALERT' ? "border-red-200 text-red-700 bg-red-50" : "border-slate-200 text-slate-600 bg-slate-50"
                    )}>{alert.type}</Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">{alert.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-slate-900 text-white border-slate-800 shadow-sm relative rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fleet Control Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight">98.4%</div>
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1 uppercase">
              <TrendingUp className="h-3 w-3" /> +1.2% from prior cycle
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">Monitoring Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase">
                  <span>Automated Maritime Controls</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 w-[78%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase">
                  <span>Manual Operational Controls</span>
                  <span>52%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[52%]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
