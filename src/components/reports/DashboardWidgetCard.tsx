import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATA_SOURCE_OPTIONS, VIZ_TYPE_OPTIONS, type WidgetLayout } from './dashboard-layout';

interface DashboardWidgetCardProps {
  item: WidgetLayout;
  /** Already resolved: the row's own title, else the catalog key through `t()`. */
  title: string;
  onPatch: (patch: Partial<WidgetLayout>) => void;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * The frame around one widget: drag handle, title, the settings popover and the
 * remove button. The popover's two pickers are driven by the option arrays in
 * `dashboard-layout` rather than by hand-written `SelectItem` lists.
 */
export function DashboardWidgetCard({ item, title, onPatch, onRemove, children }: DashboardWidgetCardProps) {
  const { t } = useTranslation('reports');

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-full">
      <div className="widget-header bg-slate-50/50 border-b px-4 py-2 cursor-move flex items-center justify-between no-print flex-wrap gap-2">
        <span className="text-xs font-black text-slate-500 tracking-wider uppercase truncate max-w-[70%]">{title}</span>

        <div className="flex items-center gap-1 no-print">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                <Settings2 className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 sm:w-80 p-4 space-y-4 z-[9999]" align="end">
              <h4 className="font-bold text-xs text-slate-700">{t('customizableDashboard.config.title')}</h4>

              <div className="space-y-1">
                <Label htmlFor={`widget-title-${item.i}`} className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('customizableDashboard.config.widgetTitle')}
                </Label>
                <Input
                  id={`widget-title-${item.i}`}
                  value={item.title ?? title}
                  onChange={(event) => onPatch({ title: event.target.value })}
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('customizableDashboard.config.dataSource')}
                </Label>
                <Select
                  value={item.dataSource}
                  onValueChange={(value) => onPatch({ dataSource: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('customizableDashboard.config.vizType')}
                </Label>
                <Select value={item.vizType} onValueChange={(value) => onPatch({ vizType: value as WidgetLayout['vizType'] })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIZ_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center min-h-[120px] overflow-hidden">{children}</div>
    </div>
  );
}
