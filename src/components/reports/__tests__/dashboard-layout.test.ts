import { describe, expect, it } from 'vitest';
import {
  BREAKPOINT_COLS,
  BREAKPOINTS,
  WIDGET_CATALOG,
  activeWidgetIds,
  addCustomWidget,
  defaultLayouts,
  patchWidget,
  readStoredLayouts,
  reconcileLayout,
  toggleWidget,
  widgetTitleKey,
  type Layouts,
} from '../dashboard-layout';

/**
 * The layout algebra, with known-good fixtures rather than values recomputed the
 * way the implementation computes them — a test that recomputes the expectation
 * can never disagree with the code it covers.
 */

const empty = (): Layouts => ({ lg: [], md: [], sm: [] });

const rowFor = (layouts: Layouts, breakpoint: (typeof BREAKPOINTS)[number], id: string) =>
  layouts[breakpoint].find((widget) => widget.i === id);

describe('defaultLayouts', () => {
  it('places the five catalog widgets on every breakpoint', () => {
    const layouts = defaultLayouts();
    for (const breakpoint of BREAKPOINTS) {
      expect(layouts[breakpoint].map((widget) => widget.i)).toEqual(WIDGET_CATALOG.map((widget) => widget.id));
    }
  });

  it('uses the catalog width on lg and the narrower grid on md/sm', () => {
    const layouts = defaultLayouts();
    expect(rowFor(layouts, 'lg', 'kpi-summary')?.w).toBe(12);
    expect(rowFor(layouts, 'md', 'kpi-summary')?.w).toBe(10);
    expect(rowFor(layouts, 'sm', 'kpi-summary')?.w).toBe(BREAKPOINT_COLS.sm);
  });

  it('carries no title copy — the bundle owns the wording', () => {
    for (const breakpoint of BREAKPOINTS) {
      for (const widget of defaultLayouts()[breakpoint]) {
        expect(widget.title).toBeUndefined();
      }
    }
  });

  it('names every catalog widget with an i18n key, not with copy', () => {
    for (const widget of WIDGET_CATALOG) {
      expect(widget.nameKey).toMatch(/^customizableDashboard\./);
    }
  });
});

describe('toggleWidget', () => {
  it('adds a catalog widget below everything placed, at the width its breakpoint allows', () => {
    const layouts = toggleWidget(empty(), 'risk-heatmap');
    expect(rowFor(layouts, 'lg', 'risk-heatmap')).toMatchObject({
      y: 0,
      w: 6,
      h: 4,
      minW: 4,
      dataSource: 'risk-heatmap',
      vizType: 'heatmap',
    });
    expect(rowFor(layouts, 'md', 'risk-heatmap')?.w).toBe(5);
    expect(rowFor(layouts, 'sm', 'risk-heatmap')?.w).toBe(BREAKPOINT_COLS.sm);
  });

  it('stacks the next widget under the bottom of the tallest one', () => {
    const withKpi = toggleWidget(empty(), 'kpi-summary');
    expect(rowFor(withKpi, 'lg', 'kpi-summary')?.y).toBe(0);

    const stacked = toggleWidget(withKpi, 'risk-heatmap');
    expect(rowFor(stacked, 'lg', 'risk-heatmap')?.y).toBe(2); // kpi-summary is h:2
    expect(rowFor(stacked, 'lg', 'kpi-summary')?.y).toBe(0);
  });

  it('removes an active widget from every breakpoint', () => {
    const layouts = defaultLayouts();
    const next = toggleWidget(layouts, 'coso-heatmap');
    for (const breakpoint of BREAKPOINTS) {
      expect(rowFor(next, breakpoint, 'coso-heatmap')).toBeUndefined();
    }
    expect(activeWidgetIds(next)).toEqual(['kpi-summary', 'risk-heatmap', 'deficiencies-severity', 'deficiency-status']);
  });

  it('ignores an id that is not in the catalog', () => {
    const layouts = defaultLayouts();
    expect(toggleWidget(layouts, 'not-a-widget')).toEqual(layouts);
  });
});

describe('addCustomWidget', () => {
  it('adds a bar card over the severity data, with the caller-owned id', () => {
    const layouts = addCustomWidget(empty(), 'custom-1700000000000');
    expect(rowFor(layouts, 'lg', 'custom-1700000000000')).toMatchObject({
      w: 6,
      h: 3,
      minW: 3,
      dataSource: 'deficiencies-severity',
      vizType: 'bar',
    });
    expect(rowFor(layouts, 'md', 'custom-1700000000000')?.w).toBe(5);
    expect(rowFor(layouts, 'sm', 'custom-1700000000000')?.w).toBe(BREAKPOINT_COLS.sm);
  });
});

describe('patchWidget', () => {
  it('applies the popover edit to the named widget on every breakpoint only', () => {
    const layouts = patchWidget(defaultLayouts(), 'deficiencies-severity', {
      title: 'Defisiensi per Tingkat Keparahan',
      vizType: 'pie',
    });
    for (const breakpoint of BREAKPOINTS) {
      expect(rowFor(layouts, breakpoint, 'deficiencies-severity')).toMatchObject({
        title: 'Defisiensi per Tingkat Keparahan',
        vizType: 'pie',
      });
      expect(rowFor(layouts, breakpoint, 'deficiency-status')?.title).toBeUndefined();
    }
  });
});

describe('reconcileLayout', () => {
  it('keeps the metadata the grid did not report', () => {
    const layouts = patchWidget(defaultLayouts(), 'kpi-summary', { title: 'Ringkasan', vizType: 'bar' });
    const next = reconcileLayout(layouts, {
      lg: [{ i: 'kpi-summary', x: 2, y: 0, w: 6, h: 3 }],
      md: [{ i: 'kpi-summary', x: 0, y: 0, w: 5, h: 2 }],
      sm: [{ i: 'kpi-summary', x: 0, y: 0, w: 6, h: 2 }],
    });
    expect(rowFor(next, 'lg', 'kpi-summary')).toMatchObject({
      x: 2,
      w: 6,
      title: 'Ringkasan',
      vizType: 'bar',
      dataSource: 'kpi-summary',
    });
  });

  it('does not write a default title into the stored rows', () => {
    const next = reconcileLayout(defaultLayouts(), {
      lg: [{ i: 'risk-heatmap', x: 0, y: 0, w: 6, h: 4 }],
      md: [{ i: 'risk-heatmap', x: 0, y: 0, w: 5, h: 4 }],
      sm: [{ i: 'risk-heatmap', x: 0, y: 0, w: 6, h: 4 }],
    });
    expect(rowFor(next, 'lg', 'risk-heatmap')?.title).toBeUndefined();
    expect(rowFor(next, 'lg', 'risk-heatmap')?.dataSource).toBe('risk-heatmap');
  });

  it('leaves a breakpoint the grid did not report untouched', () => {
    const layouts = defaultLayouts();
    const next = reconcileLayout(layouts, { lg: [{ i: 'kpi-summary', x: 0, y: 0, w: 12, h: 2 }] });
    expect(next.md).toEqual(layouts.md);
    expect(next.sm).toEqual(layouts.sm);
  });

  it('is a no-op when the grid reports nothing', () => {
    const layouts = defaultLayouts();
    expect(reconcileLayout(layouts, undefined)).toEqual(layouts);
  });
});

describe('readStoredLayouts', () => {
  it('rejects a payload with no known breakpoint', () => {
    expect(readStoredLayouts(null)).toBeUndefined();
    expect(readStoredLayouts({ theme: 'dark' })).toBeUndefined();
    expect(readStoredLayouts('lg')).toBeUndefined();
  });

  it('drops rows that carry no id and keeps the rest', () => {
    const read = readStoredLayouts({ lg: [{ i: 'kpi-summary', x: 0, y: 0, w: 12, h: 2 }, { x: 1 }] });
    expect(read?.lg.map((widget) => widget.i)).toEqual(['kpi-summary']);
  });

  it('mirrors a breakpoint the payload omits from the next larger one', () => {
    const read = readStoredLayouts({
      lg: [{ i: 'kpi-summary', x: 0, y: 0, w: 12, h: 2, dataSource: 'kpi-summary', vizType: 'summary' }],
    });
    expect(read?.md.map((widget) => widget.i)).toEqual(['kpi-summary']);
    expect(read?.sm.map((widget) => widget.i)).toEqual(['kpi-summary']);
  });
});

describe('widgetTitleKey', () => {
  it('resolves catalog ids to their key and everything else to the custom key', () => {
    expect(widgetTitleKey('kpi-summary')).toBe('customizableDashboard.widgets.kpiSummary');
    expect(widgetTitleKey('custom-123')).toBe('customizableDashboard.widgets.custom');
    expect(widgetTitleKey('legacy-unknown')).toBe('customizableDashboard.widgets.custom');
  });
});
