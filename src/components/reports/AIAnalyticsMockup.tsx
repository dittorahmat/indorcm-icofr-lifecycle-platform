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
  Plane,
  Radar as RadarIcon,
  RadioTower,
  AlertTriangle,
  Clock,
  ArrowLeft,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_AVIATION_DRILLDOWN_DATA } from '@shared/ai-aviation-data';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';
import { useTranslation } from 'react-i18next';

export function AIAnalyticsMockup() {
  const { companyName } = useOrganizationBranding();
  const { t } = useTranslation('reports');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-800 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold tracking-wider uppercase">{t('aiHub.badge')}</Badge>
            <div className="h-1 w-1 rounded-full bg-slate-500"></div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('aiHub.eyebrow')}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{t('aiHub.title')}</h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            {t('aiHub.subtitle', { companyName })}
          </p>
        </div>

        <div className="flex gap-6 items-center">
          <div className="text-right px-4 border-r border-slate-700">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('aiHub.systemStatus')}</p>
            <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-mono text-xs font-semibold mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('aiHub.online')}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('aiHub.dataFreshness')}</p>
            <p className="text-slate-200 font-mono text-xs uppercase mt-0.5">{t('aiHub.realtime')}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 shadow-sm rounded-lg">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
            <TrendingUp className="h-4 w-4" /> {t('aiHub.tabAnalytics')} (Slide 8)
          </TabsTrigger>
          <TabsTrigger value="ai-cases" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
            <BrainCircuit className="h-4 w-4" /> {t('aiHub.tabAiCases')} (Slide 9)
          </TabsTrigger>
          <TabsTrigger value="ccm" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-medium">
            <ShieldAlert className="h-4 w-4" /> {t('aiHub.tabCcm')} (Slide 10)
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
  const { t } = useTranslation('reports');
  const aviationTrendData = [
    { name: 'Jan', movements: 41200, billed: 384 },
    { name: 'Feb', movements: 39800, billed: 371 },
    { name: 'Mar', movements: 43500, billed: 402 },
    { name: 'Apr', movements: 42100, billed: 395 },
    { name: 'May', movements: 45800, billed: 428 },
    { name: 'Jun', movements: 44200, billed: 419 },
  ];

  const otpData = [
    { cluster: 'WIIF-East', otp: 94 },
    { cluster: 'WIIF-West', otp: 91 },
    { cluster: 'WAAF-North', otp: 89 },
    { cluster: 'WAAF-South', otp: 96 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" /> {t('aiHub.trendTitle')}
          </CardTitle>
          <CardDescription>{t('aiHub.trendDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aviationTrendData}>
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
                <Area yAxisId="left" type="monotone" dataKey="movements" name="Movements" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorFuel)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="billed" name="Billed (IDR B)" stroke="#0284c7" fillOpacity={1} fill="url(#colorMiles)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-lg border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t('aiHub.reconTitle')}</CardTitle>
            <CardDescription>{t('aiHub.reconDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">0.94% Variance</div>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[36%]"></div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{t('aiHub.reconThreshold', { value: '1.00%' })}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-50 border-sky-100 rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-sky-900">{t('aiHub.unreconciledTitle')}</CardTitle>
            <CardDescription className="text-sky-700">{t('aiHub.unreconciledDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-800">28 Items</div>
            <p className="text-xs font-semibold text-sky-600 mt-1">{t('aiHub.unreconciledNote')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">{t('aiHub.otpTitle')}</CardTitle>
          <CardDescription>{t('aiHub.otpDesc')}</CardDescription>
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
          <p className="text-center text-xs mt-3 font-mono text-slate-500 uppercase tracking-widest font-semibold">{t('aiHub.otpTarget', { value: '90%' })}</p>
        </CardContent>
      </Card>

      <Card className="col-span-2 rounded-lg border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">{t('aiHub.riskTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk1Title')}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk1Value')}</span>
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk1Desc')}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk2Title')}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk2Value')}</span>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk2Desc')}</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase">{t('aiHub.risk3Title')}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">{t('aiHub.risk3Value')}</span>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('aiHub.risk3Desc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AICasesTab() {
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const { t } = useTranslation('reports');

  const useCases = [
    { id: "track-anomaly", title: t('aiHub.caseTrackTitle'), icon: <RadarIcon className="h-6 w-6" />, desc: t('aiHub.caseTrackDesc'), status: "LIVE", color: "text-red-700 bg-red-50 border-red-200" },
    { id: "cns-maintenance", title: t('aiHub.caseCnsTitle'), icon: <RadioTower className="h-6 w-6" />, desc: t('aiHub.caseCnsDesc'), status: "LIVE", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { id: "route-charges-recon", title: t('aiHub.caseReconTitle'), icon: <FileCheck2 className="h-6 w-6" />, desc: t('aiHub.caseReconDesc'), status: "LIVE", color: "text-sky-700 bg-sky-50 border-sky-200" },
    { id: "movement-leakage", title: t('aiHub.caseLeakageTitle'), icon: <Plane className="h-6 w-6" />, desc: t('aiHub.caseLeakageDesc'), status: "LIVE", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { id: "vendor-invoice-nlp", title: t('aiHub.caseNlpTitle'), icon: <FileSearch className="h-6 w-6" />, desc: t('aiHub.caseNlpDesc'), status: "BETA", color: "text-purple-700 bg-purple-50 border-purple-200" },
    { id: "atc-roster", title: t('aiHub.caseRosterTitle'), icon: <DollarSign className="h-6 w-6" />, desc: t('aiHub.caseRosterDesc'), status: "LIVE", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
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
                      <span>{t('aiHub.modelPrecision', { value: '95.8%' })}</span>
                      <span className="group-hover:text-primary transition-colors">{t('aiHub.details')}</span>
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
  const { t } = useTranslation('reports');
  const data = AI_AVIATION_DRILLDOWN_DATA[useCase.id];

  if (!data) return (
    <div className="p-20 text-center">
      <CardTitle className="text-slate-400">{t('aiHub.dataUnavailable', { title: useCase.title })}</CardTitle>
      <Button variant="ghost" onClick={onBack} className="mt-4">{t('aiHub.backToCases')}</Button>
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
                <CardDescription className="text-current opacity-80 text-xs font-medium">{t('aiHub.workbench')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white text-slate-900 font-bold uppercase tracking-wider text-xs px-2 py-0.5">{useCase.status}</Badge>
              <Badge variant="outline" className="border-current/30 text-current bg-white/20 uppercase tracking-wider text-xs">{t('aiHub.clusterBadge')}</Badge>
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
                  <XAxis type="number" dataKey="speed" name="Ground Speed (Knots)" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="number" dataKey="consumption" name="Lateral Deviation (NM)" fontSize={12} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }} />
                  <Scatter name="Flight Tracks" data={data.chart.data} fill={activeColor} />
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
              <Search className="h-4 w-4 text-sky-600" /> {t('aiHub.discoveryLog')}
            </h3>
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">{t('aiHub.liveAnalysis')}</Badge>
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
  const { t } = useTranslation('reports');
  const alerts = [
    { time: '10:42 AM', type: 'ALERT', msg: 'GNSS Interference: RFI report in WIIF-E3 en-route sector affecting 4 flights, deviation up to 3.8 NM against flight plan.', severity: 'HIGH' },
    { time: '10:15 AM', type: 'ALERT', msg: 'Unidentified Track: 1 primary-only track detected in WAAF-N2 without verified flight plan at Makassar FIR.', severity: 'HIGH' },
    { time: '09:15 AM', type: 'LOG', msg: 'Daily route charges vs controlled movements reconciliation completed for JATSC Jakarta (Variance: 0.12%, within tolerance).', severity: 'INFO' },
    { time: '08:30 AM', type: 'ALERT', msg: 'ILS Calibration Expired: ILS CGK 07R calibration certificate lapsed 6 days ago, approach minima restricted.', severity: 'HIGH' },
    { time: 'Yesterday', type: 'ALERT', msg: 'Unreconciled Charges: 12 controlled movements older than 30 days without matched airline payment (WIIF Jakarta-East).', severity: 'MEDIUM' },
    { time: 'Yesterday', type: 'ALERT', msg: 'NOTAM Overdue: 3 NOTAMs past review date without revalidation (WAAF sectors).', severity: 'MEDIUM' },
    { time: '2 days ago', type: 'LOG', msg: 'ATC license compliance validated for 184 active controllers across FIRs.', severity: 'INFO' },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2 rounded-lg border-border">
        <CardHeader className="border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold">{t('aiHub.ccmTitle')}</CardTitle>
              <CardDescription>{t('aiHub.ccmDesc')}</CardDescription>
            </div>
            <Badge className="bg-sky-700 text-white font-semibold text-xs">{t('aiHub.liveFeed')}</Badge>
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
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('aiHub.effectivenessTitle')}</CardTitle>
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
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('aiHub.coverageTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase">
                  <span>{t('aiHub.automatedControls')}</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 w-[78%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold uppercase">
                  <span>{t('aiHub.manualControls')}</span>
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
