/**
 * The dashboard's layout algebra — grid placement, add/remove/patch rules, and
 * the widget catalog — as one pure module.
 *
 * Why it exists: the component re-implemented "spread every breakpoint,
 * recompute `maxPrevY`, patch the per-breakpoint width" in five handlers (two of
 * them near-identical) and re-derived `dataSource`/`vizType` a third time inside
 * the renderer, with no test between them. The algebra is what a reviewer reads;
 * the component is what the user sees.
 *
 * Every human-readable name here is an i18n KEY, never copy — and a default
 * title is never *written into* the stored layout, so the bundle stays the only
 * owner of the wording and a locale switch re-labels existing widgets.
 *
 * The interface deliberately excludes React state, the preferences mutation, the
 * grid component, and the widget render switch.
 */

export const BREAKPOINTS = ['lg', 'md', 'sm'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/** The grid columns each breakpoint offers — `ResponsiveGridLayout` uses the same. */
export const BREAKPOINT_COLS: Record<Breakpoint, number> = { lg: 12, md: 10, sm: 6 };

export type VizType = 'summary' | 'heatmap' | 'bar' | 'pie';

export interface WidgetMeta {
  /** Catalog id, and the default `dataSource` of a widget created from it. */
  id: string;
  /** i18n key for the widget's default title. */
  nameKey: string;
  defaultW: number;
  defaultH: number;
  minW: number;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  /** User-edited label. Absent means "render the catalog key". */
  title?: string;
  dataSource: string;
  vizType: VizType;
}

export type Layouts = Record<Breakpoint, WidgetLayout[]>;

export const WIDGET_CATALOG: readonly WidgetMeta[] = [
  { id: 'kpi-summary', nameKey: 'customizableDashboard.widgets.kpiSummary', defaultW: 12, defaultH: 2, minW: 6 },
  { id: 'risk-heatmap', nameKey: 'customizableDashboard.widgets.riskHeatmap', defaultW: 6, defaultH: 4, minW: 4 },
  { id: 'coso-heatmap', nameKey: 'customizableDashboard.widgets.cosoHeatmap', defaultW: 6, defaultH: 4, minW: 4 },
  { id: 'deficiencies-severity', nameKey: 'customizableDashboard.widgets.deficienciesSeverity', defaultW: 6, defaultH: 3, minW: 3 },
  { id: 'deficiency-status', nameKey: 'customizableDashboard.widgets.deficiencyStatus', defaultW: 6, defaultH: 3, minW: 3 },
];

/** The two pickers in the widget popover, as data (never duplicated JSX). */
export const VIZ_TYPE_OPTIONS: readonly { value: VizType; labelKey: string }[] = [
  { value: 'summary', labelKey: 'customizableDashboard.viz.summary' },
  { value: 'heatmap', labelKey: 'customizableDashboard.viz.heatmap' },
  { value: 'bar', labelKey: 'customizableDashboard.viz.bar' },
  { value: 'pie', labelKey: 'customizableDashboard.viz.pie' },
];

export const DATA_SOURCE_OPTIONS: readonly { value: string; labelKey: string }[] = [
  { value: 'kpi-summary', labelKey: 'customizableDashboard.widgets.kpiSummary' },
  { value: 'risk-heatmap', labelKey: 'customizableDashboard.sources.riskRegistry' },
  { value: 'coso-heatmap', labelKey: 'customizableDashboard.widgets.cosoHeatmap' },
  { value: 'deficiencies-severity', labelKey: 'customizableDashboard.widgets.deficienciesSeverity' },
  { value: 'deficiency-status', labelKey: 'customizableDashboard.widgets.deficiencyStatus' },
];

const CUSTOM_PREFIX = 'custom-';
const CUSTOM_TITLE_KEY = 'customizableDashboard.widgets.custom';

const eachLayout = (
  layouts: Layouts,
  map: (items: WidgetLayout[], breakpoint: Breakpoint) => WidgetLayout[],
): Layouts =>
  BREAKPOINTS.reduce(
    (next, breakpoint) => ({ ...next, [breakpoint]: map(layouts[breakpoint] ?? [], breakpoint) }),
    {} as Layouts,
  );

/** The title key to render when the layout row carries no user title. */
export function widgetTitleKey(id: string): string {
  if (id.startsWith(CUSTOM_PREFIX)) return CUSTOM_TITLE_KEY;
  return WIDGET_CATALOG.find((widget) => widget.id === id)?.nameKey ?? CUSTOM_TITLE_KEY;
}

export function defaultDataSourceFor(id: string): string {
  return id.startsWith(CUSTOM_PREFIX) ? 'deficiencies-severity' : id;
}

export function defaultVizTypeFor(id: string): VizType {
  if (id === 'kpi-summary') return 'summary';
  if (id === 'risk-heatmap' || id === 'coso-heatmap') return 'heatmap';
  if (id === 'deficiency-status') return 'pie';
  return 'bar';
}

/** The stored layouts, with no server preference yet. */
export function defaultLayouts(): Layouts {
  return {
    lg: [
      { i: 'kpi-summary', x: 0, y: 0, w: 12, h: 2, minW: 6, dataSource: 'kpi-summary', vizType: 'summary' },
      { i: 'risk-heatmap', x: 0, y: 2, w: 6, h: 4, minW: 4, dataSource: 'risk-heatmap', vizType: 'heatmap' },
      { i: 'coso-heatmap', x: 6, y: 2, w: 6, h: 4, minW: 4, dataSource: 'coso-heatmap', vizType: 'heatmap' },
      { i: 'deficiencies-severity', x: 0, y: 6, w: 6, h: 3, minW: 3, dataSource: 'deficiencies-severity', vizType: 'bar' },
      { i: 'deficiency-status', x: 6, y: 6, w: 6, h: 3, minW: 3, dataSource: 'deficiency-status', vizType: 'pie' },
    ],
    md: [
      { i: 'kpi-summary', x: 0, y: 0, w: 10, h: 2, minW: 6, dataSource: 'kpi-summary', vizType: 'summary' },
      { i: 'risk-heatmap', x: 0, y: 2, w: 5, h: 4, minW: 3, dataSource: 'risk-heatmap', vizType: 'heatmap' },
      { i: 'coso-heatmap', x: 5, y: 2, w: 5, h: 4, minW: 3, dataSource: 'coso-heatmap', vizType: 'heatmap' },
      { i: 'deficiencies-severity', x: 0, y: 6, w: 5, h: 3, minW: 3, dataSource: 'deficiencies-severity', vizType: 'bar' },
      { i: 'deficiency-status', x: 5, y: 6, w: 5, h: 3, minW: 3, dataSource: 'deficiency-status', vizType: 'pie' },
    ],
    sm: [
      { i: 'kpi-summary', x: 0, y: 0, w: 6, h: 2, minW: 4, dataSource: 'kpi-summary', vizType: 'summary' },
      { i: 'risk-heatmap', x: 0, y: 2, w: 6, h: 4, dataSource: 'risk-heatmap', vizType: 'heatmap' },
      { i: 'coso-heatmap', x: 0, y: 6, w: 6, h: 4, dataSource: 'coso-heatmap', vizType: 'heatmap' },
      { i: 'deficiencies-severity', x: 0, y: 10, w: 6, h: 3, dataSource: 'deficiencies-severity', vizType: 'bar' },
      { i: 'deficiency-status', x: 0, y: 13, w: 6, h: 3, dataSource: 'deficiency-status', vizType: 'pie' },
    ],
  };
}

function isWidgetLayout(row: unknown): row is WidgetLayout {
  if (!row || typeof row !== 'object') return false;
  const candidate = row as Record<string, unknown>;
  return typeof candidate.i === 'string' && candidate.i !== '';
}

/**
 * A stored preference is arbitrary JSON, so keep only rows that carry an id, and
 * fill a breakpoint the payload omits from the next larger one — which is what
 * `ResponsiveGridLayout` does itself, so an older `lg`-only payload keeps
 * rendering at every width instead of losing its widgets below `lg`.
 */
export function readStoredLayouts(stored: unknown): Layouts | undefined {
  if (!stored || typeof stored !== 'object') return undefined;
  const candidates = stored as Record<string, unknown>;
  if (!BREAKPOINTS.some((breakpoint) => Array.isArray(candidates[breakpoint]))) return undefined;

  const read: Partial<Layouts> = {};
  for (const breakpoint of BREAKPOINTS) {
    const rows = candidates[breakpoint];
    if (Array.isArray(rows)) read[breakpoint] = rows.filter(isWidgetLayout);
  }
  const fill = (breakpoint: Breakpoint, fallback?: WidgetLayout[]): WidgetLayout[] =>
    read[breakpoint] ?? fallback ?? [];
  return {
    lg: fill('lg', read.md ?? read.sm),
    md: fill('md', read.lg),
    sm: fill('sm', read.md ?? read.lg),
  };
}

/** The widget ids currently on the grid — the `lg` breakpoint is the roster. */
export function activeWidgetIds(layouts: Layouts): string[] {
  return layouts.lg.map((widget) => widget.i);
}

/** Appended below everything already placed, at the width this breakpoint allows. */
function appendWidget(layouts: Layouts, row: (breakpoint: Breakpoint) => Omit<WidgetLayout, 'x' | 'y'>): Layouts {
  return eachLayout(layouts, (items, breakpoint) => {
    const maxBottom = items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    return [...items, { ...row(breakpoint), x: 0, y: maxBottom }];
  });
}

const addWidth = (breakpoint: Breakpoint, wide: number): number =>
  breakpoint === 'sm' ? BREAKPOINT_COLS.sm : breakpoint === 'md' ? 5 : wide;

/** Removes the widget from every breakpoint, or adds it (catalog id) to each. */
export function toggleWidget(layouts: Layouts, id: string): Layouts {
  if (activeWidgetIds(layouts).includes(id)) {
    return eachLayout(layouts, (items) => items.filter((item) => item.i !== id));
  }
  const meta = WIDGET_CATALOG.find((widget) => widget.id === id);
  if (!meta) return layouts;
  return appendWidget(layouts, (breakpoint) => ({
    i: id,
    w: addWidth(breakpoint, meta.defaultW),
    h: meta.defaultH,
    minW: meta.minW,
    dataSource: id,
    vizType: defaultVizTypeFor(id),
  }));
}

/** Adds a custom chart card. The caller owns the id (it is time-derived). */
export function addCustomWidget(layouts: Layouts, id: string): Layouts {
  return appendWidget(layouts, (breakpoint) => ({
    i: id,
    w: addWidth(breakpoint, 6),
    h: 3,
    minW: 3,
    dataSource: 'deficiencies-severity',
    vizType: 'bar',
  }));
}

/** Applies popover edits to one widget across every breakpoint. */
export function patchWidget(layouts: Layouts, id: string, patch: Partial<WidgetLayout>): Layouts {
  return eachLayout(layouts, (items) => items.map((item) => (item.i === id ? { ...item, ...patch } : item)));
}

/**
 * Folds the grid's own `onLayoutChange` payload back in. The grid reports only
 * geometry, so widget metadata comes from the current layouts — and an absent
 * user title stays absent rather than being materialized into the saved data.
 */
export function reconcileLayout(layouts: Layouts, incoming: unknown): Layouts {
  if (!incoming || typeof incoming !== 'object') return layouts;
  const reported = incoming as Record<string, unknown>;
  return BREAKPOINTS.reduce((next, breakpoint) => {
    const rows = reported[breakpoint];
    if (!Array.isArray(rows)) {
      next[breakpoint] = layouts[breakpoint] ?? [];
      return next;
    }
    next[breakpoint] = rows.filter(isWidgetLayout).map((row) => {
      const existing = (layouts[breakpoint] ?? []).find((item) => item.i === row.i);
      return {
        ...row,
        ...(existing?.title !== undefined ? { title: existing.title } : {}),
        dataSource: row.dataSource ?? existing?.dataSource ?? defaultDataSourceFor(row.i),
        vizType: row.vizType ?? existing?.vizType ?? defaultVizTypeFor(row.i),
      };
    });
    return next;
  }, {} as Layouts);
}
