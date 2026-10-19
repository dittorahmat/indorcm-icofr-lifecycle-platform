import { useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Loader2, Plus, RotateCcw, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { DashboardWidgetBody, type DashboardSummary } from './dashboard-widget-body';
import { useDashboardDraft } from './useDashboardDraft';
import { BREAKPOINT_COLS, WIDGET_CATALOG, activeWidgetIds, widgetTitleKey, type WidgetLayout } from './dashboard-layout';

interface CustomizableDashboardProps {
  summaryData?: DashboardSummary;
  isEffective: boolean;
}

const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };

/**
 * The dashboard orchestrator: it composes the control bar, the grid and the
 * catalog, and hands every layout edit to the draft. The algebra lives in
 * `dashboard-layout.ts`, the draft (and its cache-as-truth write) in
 * `useDashboardDraft`, the widget content in `dashboard-widget-body`.
 */
export function CustomizableDashboard({ summaryData, isEffective }: CustomizableDashboardProps) {
  const { t } = useTranslation(['reports', 'common']);
  const { companyName } = useOrganizationBranding();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth();
  const draft = useDashboardDraft();

  const titleOf = (item: WidgetLayout) => item.title ?? t(widgetTitleKey(item.i));
  const clusterName = companyName.toLowerCase().includes('bank') ? 'Financial (BUMN Cluster)' : 'Mining & Energy';
  const activeWidgets = activeWidgetIds(draft.layouts);

  if (draft.isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4 relative min-h-[600px]">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{t('customizableDashboard.title')}</span>
          {draft.isSaving && (
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('customizableDashboard.saving')}
            </Badge>
          )}
        </div>

        <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-bold bg-white text-slate-700 w-full min-[420px]:w-auto justify-center min-h-[44px]"
            onClick={() => draft.addCustomWidget()}
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            {t('customizableDashboard.addCustomChart')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-bold w-full min-[420px]:w-auto justify-center min-h-[44px]"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {isSidebarOpen ? t('customizableDashboard.closeCatalog') : t('customizableDashboard.widgetCatalog')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold w-full min-[420px]:w-auto justify-center min-h-[44px]"
            onClick={() => draft.reset()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('customizableDashboard.resetLayout')}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 w-full">
        <div ref={containerRef} className="flex-1 min-w-0">
          {mounted && (
            <ResponsiveGridLayout
              className="layout"
              layouts={draft.layouts}
              width={width}
              breakpoints={GRID_BREAKPOINTS}
              cols={BREAKPOINT_COLS}
              rowHeight={100}
              onLayoutChange={(_current, all) => draft.reconcile(all)}
              dragConfig={{ handle: '.widget-header' }}
              margin={[16, 16]}
            >
              {draft.layouts.lg.map((item) => (
                <div key={item.i}>
                  <DashboardWidgetCard
                    item={item}
                    title={titleOf(item)}
                    onPatch={(patch) => draft.patchWidget(item.i, patch)}
                    onRemove={() => draft.toggleWidget(item.i)}
                  >
                    <DashboardWidgetBody
                      item={item}
                      summaryData={summaryData}
                      isEffective={isEffective}
                      clusterName={clusterName}
                    />
                  </DashboardWidgetCard>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>

        {isSidebarOpen && (
          <div className="w-80 bg-slate-50 border rounded-xl p-4 shadow-sm space-y-4 no-print border-slate-200 transition-all">
            <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700">{t('customizableDashboard.addRemoveWidgets')}</span>
              <Badge variant="outline" className="text-xs text-slate-500">
                {activeWidgets.length} {t('customizableDashboard.active')}
              </Badge>
            </div>

            <div className="space-y-3">
              {WIDGET_CATALOG.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-xs transition-all flex-wrap gap-2"
                >
                  <Label htmlFor={`widget-switch-${widget.id}`} className="text-xs font-bold text-slate-800 cursor-pointer">
                    {t(widget.nameKey)}
                  </Label>
                  <Switch
                    id={`widget-switch-${widget.id}`}
                    checked={activeWidgets.includes(widget.id)}
                    onCheckedChange={() => draft.toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
