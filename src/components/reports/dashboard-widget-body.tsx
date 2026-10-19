import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { COSOHeatmap } from './COSOHeatmap';
import { RiskHeatmap } from './RiskHeatmap';
import { defaultDataSourceFor, defaultVizTypeFor, type WidgetLayout } from './dashboard-layout';

/** One `{ name, count }` row of the report summary the widgets chart. */
export interface DashboardMetric {
  name: string;
  count: number;
}

export interface DashboardSummary {
  totalControls?: number;
  deficienciesBySeverity?: DashboardMetric[];
  deficienciesByStatus?: DashboardMetric[];
}

interface DashboardWidgetBodyProps {
  item: WidgetLayout;
  summaryData?: DashboardSummary;
  isEffective: boolean;
  /** The entity cluster the report is scoped to — resolved by the caller. */
  clusterName: string;
}

/** Severity/status rows keep their own colour: red for the worst, amber for in-flight. */
const PIE_COLOURS: Record<string, string> = {
  Open: '#ef4444',
  High: '#ef4444',
  Medium: '#f59e0b',
  'In Progress': '#f59e0b',
};
const PIE_DEFAULT_COLOUR = '#10b981';

/**
 * One widget's content: the visualization switch, and nothing else.
 *
 * Kept apart from the layout algebra and the card chrome so the three concerns
 * read as three files: what the grid does with a widget, how a widget is framed,
 * and what it renders.
 */
export function DashboardWidgetBody({ item, summaryData, isEffective, clusterName }: DashboardWidgetBodyProps) {
  const { t } = useTranslation('reports');
  const source = item.dataSource || defaultDataSourceFor(item.i);
  const type = item.vizType || defaultVizTypeFor(item.i);

  if (type === 'heatmap') {
    return source === 'coso-heatmap' ? <COSOHeatmap /> : <RiskHeatmap />;
  }

  const payload: DashboardMetric[] =
    source === 'deficiencies-severity'
      ? summaryData?.deficienciesBySeverity ?? []
      : source === 'deficiency-status'
        ? summaryData?.deficienciesByStatus ?? []
        : [];

  if (type === 'summary') {
    if (source === 'kpi-summary') {
      return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-full items-center p-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-black uppercase">{t('customizableDashboard.kpi.entityCluster')}</p>
            <p className="text-sm font-bold text-slate-800">{clusterName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-black uppercase">{t('customizableDashboard.kpi.lastReview')}</p>
            <p className="text-sm font-bold text-slate-800">July 20, 2026</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-black uppercase">{t('customizableDashboard.kpi.conclusion')}</p>
            <span className={cn('text-sm font-bold uppercase', isEffective ? 'text-green-600' : 'text-red-600')}>
              {isEffective ? t('customizableDashboard.kpi.effective') : t('customizableDashboard.kpi.ineffective')}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-black uppercase">{t('customizableDashboard.kpi.totalControls')}</p>
            <p className="text-sm font-bold text-slate-800">{summaryData?.totalControls ?? 0}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 h-full items-center px-4">
        {payload.map((metric) => (
          <div key={metric.name} className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground font-black uppercase truncate">{metric.name}</p>
            <p className="text-2xl font-black text-primary">{metric.count}</p>
          </div>
        ))}
        {payload.length === 0 && (
          <div className="col-span-1 sm:col-span-3 text-center text-xs text-slate-400">
            {t('customizableDashboard.noSummaryMetrics')}
          </div>
        )}
      </div>
    );
  }

  if (type === 'bar') {
    if (payload.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-xs">{t('customizableDashboard.noData')}</div>
      );
    }
    return (
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
        <div className="min-w-[280px] h-[220px]">
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={payload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} fontWeight={600} />
              <YAxis stroke="#888888" fontSize={12} fontWeight={600} />
              <ChartTooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    if (!payload.some((metric) => metric.count > 0)) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-xs">{t('customizableDashboard.noData')}</div>
      );
    }
    return (
      <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
        <div className="min-w-[280px] h-[220px]">
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={payload} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius="60%" label={{ fontSize: 12, fontWeight: 600 }}>
                {payload.map((metric) => (
                  <Cell key={metric.name} fill={PIE_COLOURS[metric.name] ?? PIE_DEFAULT_COLOUR} />
                ))}
              </Pie>
              <ChartTooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-slate-400 text-xs">{t('customizableDashboard.unsupported')}</div>
  );
}
