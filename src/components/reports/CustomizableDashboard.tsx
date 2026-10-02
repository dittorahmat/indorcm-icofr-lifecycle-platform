import React, { useState, useEffect } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { COSOHeatmap } from './COSOHeatmap';
import { RiskHeatmap } from './RiskHeatmap';
import { useUserPreferences, useSaveUserPreferences } from '@/hooks/useUserPreferences';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  Grid3X3, Settings2, RotateCcw, LayoutGrid, CheckCircle2, 
  Eye, EyeOff, Loader2, Plus, Trash2 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

interface CustomizableDashboardProps {
  summaryData: any;
  isEffective: boolean;
}

const AVAILABLE_WIDGETS = [
  { id: 'kpi-summary', name: 'Compliance KPI Summary', defaultW: 12, defaultH: 2, minW: 6 },
  { id: 'risk-heatmap', name: 'Risk Heatmap (SK-5/2024)', defaultW: 6, defaultH: 4, minW: 4 },
  { id: 'coso-heatmap', name: 'COSO 17 Principles Heatmap', defaultW: 6, defaultH: 4, minW: 4 },
  { id: 'deficiencies-severity', name: 'Deficiencies by Severity', defaultW: 6, defaultH: 3, minW: 3 },
  { id: 'deficiency-status', name: 'Deficiency Status Details', defaultW: 6, defaultH: 3, minW: 3 }
];

const getDefaultTitle = (id: string) => {
  const widget = AVAILABLE_WIDGETS.find(w => w.id === id);
  return widget ? widget.name : 'Custom Chart';
};

const getDefaultDataSource = (id: string) => {
  if (id.startsWith('custom-')) return 'deficiencies-severity';
  return id;
};

const getDefaultVizType = (id: string) => {
  if (id === 'kpi-summary') return 'summary';
  if (id === 'risk-heatmap') return 'heatmap';
  if (id === 'coso-heatmap') return 'heatmap';
  if (id === 'deficiencies-severity') return 'bar';
  if (id === 'deficiency-status') return 'pie';
  return 'bar';
};

const defaultLayouts: any = {
  lg: [
    { i: 'kpi-summary', x: 0, y: 0, w: 12, h: 2, minW: 6, title: 'Compliance KPI Summary', dataSource: 'kpi-summary', vizType: 'summary' },
    { i: 'risk-heatmap', x: 0, y: 2, w: 6, h: 4, minW: 4, title: 'Risk Heatmap (SK-5/2024)', dataSource: 'risk-heatmap', vizType: 'heatmap' },
    { i: 'coso-heatmap', x: 6, y: 2, w: 6, h: 4, minW: 4, title: 'COSO 17 Principles Heatmap', dataSource: 'coso-heatmap', vizType: 'heatmap' },
    { i: 'deficiencies-severity', x: 0, y: 6, w: 6, h: 3, minW: 3, title: 'Deficiencies by Severity', dataSource: 'deficiencies-severity', vizType: 'bar' },
    { i: 'deficiency-status', x: 6, y: 6, w: 6, h: 3, minW: 3, title: 'Deficiency Status Details', dataSource: 'deficiency-status', vizType: 'pie' }
  ],
  md: [
    { i: 'kpi-summary', x: 0, y: 0, w: 10, h: 2, minW: 6, title: 'Compliance KPI Summary', dataSource: 'kpi-summary', vizType: 'summary' },
    { i: 'risk-heatmap', x: 0, y: 2, w: 5, h: 4, minW: 3, title: 'Risk Heatmap (SK-5/2024)', dataSource: 'risk-heatmap', vizType: 'heatmap' },
    { i: 'coso-heatmap', x: 5, y: 2, w: 5, h: 4, minW: 3, title: 'COSO 17 Principles Heatmap', dataSource: 'coso-heatmap', vizType: 'heatmap' },
    { i: 'deficiencies-severity', x: 0, y: 6, w: 5, h: 3, minW: 3, title: 'Deficiencies by Severity', dataSource: 'deficiencies-severity', vizType: 'bar' },
    { i: 'deficiency-status', x: 5, y: 6, w: 5, h: 3, minW: 3, title: 'Deficiency Status Details', dataSource: 'deficiency-status', vizType: 'pie' }
  ],
  sm: [
    { i: 'kpi-summary', x: 0, y: 0, w: 6, h: 2, minW: 4, title: 'Compliance KPI Summary', dataSource: 'kpi-summary', vizType: 'summary' },
    { i: 'risk-heatmap', x: 0, y: 2, w: 6, h: 4, title: 'Risk Heatmap (SK-5/2024)', dataSource: 'risk-heatmap', vizType: 'heatmap' },
    { i: 'coso-heatmap', x: 0, y: 6, w: 6, h: 4, title: 'COSO 17 Principles Heatmap', dataSource: 'coso-heatmap', vizType: 'heatmap' },
    { i: 'deficiencies-severity', x: 0, y: 10, w: 6, h: 3, title: 'Deficiencies by Severity', dataSource: 'deficiencies-severity', vizType: 'bar' },
    { i: 'deficiency-status', x: 0, y: 13, w: 6, h: 3, title: 'Deficiency Status Details', dataSource: 'deficiency-status', vizType: 'pie' }
  ]
};

export function CustomizableDashboard({ summaryData, isEffective }: CustomizableDashboardProps) {
  const { t } = useTranslation(['reports', 'common']);
  const { companyName } = useOrganizationBranding();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layouts, setLayouts] = useState<any>(defaultLayouts);
  const { width, containerRef, mounted } = useContainerWidth();

  const { data: currentUser } = useQuery<any>({
    queryKey: ['currentUser'],
    queryFn: () => api<any>('/api/user/me'),
  });

  const { data: savedPrefs, isLoading: isPrefsLoading } = useUserPreferences();
  const savePrefMutation = useSaveUserPreferences();

  useEffect(() => {
    if (savedPrefs?.layout) {
      setLayouts(savedPrefs.layout);
    } else if (currentUser?.role) {
      setLayouts(defaultLayouts);
    }
  }, [savedPrefs, currentUser]);

  const activeWidgets = React.useMemo(() => {
    const currentLg = layouts.lg || [];
    return currentLg.map((w: any) => w.i);
  }, [layouts]);

  const handleToggleWidget = (id: string) => {
    const isCurrentlyActive = activeWidgets.includes(id);
    let updatedLayouts = { ...layouts };

    if (isCurrentlyActive) {
      Object.keys(updatedLayouts).forEach((breakpoint) => {
        updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter((item: any) => item.i !== id);
      });
    } else {
      const widgetMeta = AVAILABLE_WIDGETS.find(w => w.id === id);
      if (widgetMeta) {
        Object.keys(updatedLayouts).forEach((breakpoint) => {
          const maxPrevY = updatedLayouts[breakpoint].reduce((max: number, item: any) => Math.max(max, item.y + item.h), 0);
          updatedLayouts[breakpoint] = [
            ...updatedLayouts[breakpoint],
            {
              i: id,
              x: 0,
              y: maxPrevY,
              w: breakpoint === 'sm' ? 6 : (breakpoint === 'md' ? 5 : widgetMeta.defaultW),
              h: widgetMeta.defaultH,
              minW: widgetMeta.minW,
              title: widgetMeta.name,
              dataSource: id,
              vizType: getDefaultVizType(id)
            }
          ];
        });
      }
    }

    setLayouts(updatedLayouts);
    savePrefMutation.mutateDebounced(updatedLayouts);
  };

  const handleAddCustomWidget = () => {
    const customId = `custom-${Date.now()}`;
    let updatedLayouts = { ...layouts };

    Object.keys(updatedLayouts).forEach((breakpoint) => {
      const maxPrevY = updatedLayouts[breakpoint].reduce((max: number, item: any) => Math.max(max, item.y + item.h), 0);
      updatedLayouts[breakpoint] = [
        ...updatedLayouts[breakpoint],
        {
          i: customId,
          x: 0,
          y: maxPrevY,
          w: breakpoint === 'sm' ? 6 : (breakpoint === 'md' ? 5 : 6),
          h: 3,
          minW: 3,
          title: 'Custom Chart Card',
          dataSource: 'deficiencies-severity',
          vizType: 'bar'
        }
      ];
    });

    setLayouts(updatedLayouts);
    savePrefMutation.mutate(updatedLayouts);
  };

  const handleUpdateWidgetSettings = (id: string, updates: { title?: string; dataSource?: string; vizType?: string }) => {
    let updatedLayouts = { ...layouts };
    Object.keys(updatedLayouts).forEach((breakpoint) => {
      updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map((item: any) => {
        if (item.i === id) {
          return {
            ...item,
            ...updates
          };
        }
        return item;
      });
    });
    setLayouts(updatedLayouts);
    savePrefMutation.mutateDebounced(updatedLayouts);
  };

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    const mergedLayouts = { ...allLayouts };
    Object.keys(mergedLayouts).forEach((breakpoint) => {
      mergedLayouts[breakpoint] = mergedLayouts[breakpoint].map((item: any) => {
        const existingItem = layouts[breakpoint]?.find((w: any) => w.i === item.i);
        return {
          ...item,
          title: existingItem?.title || getDefaultTitle(item.i),
          dataSource: existingItem?.dataSource || getDefaultDataSource(item.i),
          vizType: existingItem?.vizType || getDefaultVizType(item.i),
        };
      });
    });
    setLayouts(mergedLayouts);
    savePrefMutation.mutateDebounced(mergedLayouts);
  };

  const handleResetLayout = () => {
    setLayouts(defaultLayouts);
    savePrefMutation.mutate(defaultLayouts);
  };

  const clusterName = companyName.toLowerCase().includes('bank') ? "Financial (BUMN Cluster)" : "Mining & Energy";

  const renderWidgetContent = (item: any) => {
    const source = item.dataSource || getDefaultDataSource(item.i);
    const type = item.vizType || getDefaultVizType(item.i);

    let dataPayload: any[] = [];
    if (source === 'deficiencies-severity') {
      dataPayload = summaryData?.deficienciesBySeverity || [];
    } else if (source === 'deficiency-status') {
      dataPayload = summaryData?.deficienciesByStatus || [];
    }

    if (type === 'heatmap') {
      if (source === 'coso-heatmap') {
        return <COSOHeatmap />;
      }
      return <RiskHeatmap />;
    }

    if (type === 'summary') {
      if (source === 'kpi-summary') {
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-full items-center p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase">Entity Cluster</p>
              <p className="text-sm font-bold text-slate-800">{clusterName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase">Last Review</p>
              <p className="text-sm font-bold text-slate-800">July 20, 2026</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase">Conclusion</p>
              <span className={cn("text-sm font-bold uppercase", isEffective ? "text-green-600" : "text-red-600")}>
                {isEffective ? 'Effective' : 'Ineffective'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-black uppercase">Total Controls</p>
              <p className="text-sm font-bold text-slate-800">{summaryData?.totalControls || 0}</p>
            </div>
          </div>
        );
      }

      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 h-full items-center px-4">
          {dataPayload.map((d: any, idx: number) => (
            <div key={idx} className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground font-black uppercase truncate">{d.name}</p>
              <p className="text-2xl font-black text-primary">{d.count}</p>
            </div>
          ))}
          {dataPayload.length === 0 && (
            <div className="col-span-1 sm:col-span-3 text-center text-xs text-slate-400 italic">No summary metrics available</div>
          )}
        </div>
      );
    }

    if (type === 'bar') {
      if (dataPayload.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No data available</div>;
      }
      return (
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={dataPayload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#888888" fontSize={9} />
            <YAxis stroke="#888888" fontSize={9} />
            <ChartTooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'pie') {
      const hasData = dataPayload.some(d => d.count > 0);
      if (!hasData) {
        return <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">No data available</div>;
      }
      return (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={dataPayload} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={36} label={{ fontSize: 8 }}>
              {dataPayload.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Open' || entry.name === 'High' ? '#ef4444' : (entry.name === 'Medium' || entry.name === 'In Progress' ? '#f59e0b' : '#10b981')} />
              ))}
            </Pie>
            <ChartTooltip />
            <Legend wrapperStyle={{ fontSize: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">Unsupported format</div>;
  };

  if (isPrefsLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderedItems = layouts.lg || [];

  return (
    <div className="flex flex-col gap-6 pt-4 relative min-h-[600px]">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{t('customizableDashboard.title')}</span>
          {savePrefMutation.isPending && (
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('customizableDashboard.saving')}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-xs font-bold bg-white text-slate-700"
            onClick={handleAddCustomWidget}
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            Add Custom Chart
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-xs font-bold"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {isSidebarOpen ? t('customizableDashboard.closeCatalog') : t('customizableDashboard.widgetCatalog')}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold"
            onClick={handleResetLayout}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('customizableDashboard.resetLayout')}
          </Button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex gap-6 w-full">
        {/* Responsive Grid Layout Container */}
        <div ref={containerRef} className="flex-1 min-w-0">
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              width={width}
              breakpoints={{ lg: 1200, md: 996, sm: 768 }}
              cols={{ lg: 12, md: 10, sm: 6 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              dragConfig={{ handle: '.widget-header' }}
              margin={[16, 16]}
            >
              {renderedItems.map((item: any) => {
                return (
                  <div key={item.i} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-full">
                    {/* Widget Header */}
                    <div className="widget-header bg-slate-50/50 border-b px-4 py-2 cursor-move flex items-center justify-between no-print">
                      <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase truncate max-w-[70%]">
                        {item.title || getDefaultTitle(item.i)}
                      </span>
                      
                      <div className="flex items-center gap-1 no-print">
                        {/* Popover Configuration Trigger */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                              <Settings2 className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 space-y-4 z-[9999]" align="end">
                            <h4 className="font-bold text-xs text-slate-700">Widget Configuration</h4>
                            
                            {/* Widget Title */}
                            <div className="space-y-1">
                              <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Widget Title</Label>
                              <Input
                                value={item.title || getDefaultTitle(item.i)}
                                onChange={(e) => handleUpdateWidgetSettings(item.i, { title: e.target.value })}
                                className="h-8 text-xs font-semibold"
                              />
                            </div>

                            {/* Data Source */}
                            <div className="space-y-1">
                              <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Data Source</Label>
                              <Select
                                value={item.dataSource || getDefaultDataSource(item.i)}
                                onValueChange={(val) => handleUpdateWidgetSettings(item.i, { dataSource: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kpi-summary">Compliance KPI Summary</SelectItem>
                                  <SelectItem value="risk-heatmap">Risk Assessment Registry</SelectItem>
                                  <SelectItem value="coso-heatmap">COSO 17 Principles</SelectItem>
                                  <SelectItem value="deficiencies-severity">Deficiencies by Severity</SelectItem>
                                  <SelectItem value="deficiency-status">Deficiencies by Status</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Visualization type */}
                            <div className="space-y-1">
                              <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Visualization Type</Label>
                              <Select
                                value={item.vizType || getDefaultVizType(item.i)}
                                onValueChange={(val) => handleUpdateWidgetSettings(item.i, { vizType: val })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="summary">KPI Card Group</SelectItem>
                                  <SelectItem value="heatmap">Matriks Heatmap</SelectItem>
                                  <SelectItem value="bar">Bar Chart (Kolom)</SelectItem>
                                  <SelectItem value="pie">Donut Chart (Lingkaran)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Remove Widget Button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-rose-600"
                          onClick={() => handleToggleWidget(item.i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Widget Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-center min-h-[120px] overflow-hidden">
                      {renderWidgetContent(item)}
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>
          )}
        </div>

        {/* Collapsible Sidebar widget catalog */}
        {isSidebarOpen && (
          <div className="w-80 bg-slate-50 border rounded-xl p-4 shadow-sm space-y-4 no-print border-slate-200 transition-all">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-700">{t('customizableDashboard.addRemoveWidgets')}</span>
              <Badge variant="outline" className="text-[10px] text-slate-500">
                {activeWidgets.length} {t('customizableDashboard.active')}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {AVAILABLE_WIDGETS.map((widget) => {
                const isActive = activeWidgets.includes(widget.id);
                return (
                  <div key={widget.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-xs transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor={`widget-switch-${widget.id}`} className="text-xs font-bold text-slate-800 cursor-pointer">
                        {widget.name}
                      </Label>
                    </div>
                    <Switch
                      id={`widget-switch-${widget.id}`}
                      checked={isActive}
                      onCheckedChange={() => handleToggleWidget(widget.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
