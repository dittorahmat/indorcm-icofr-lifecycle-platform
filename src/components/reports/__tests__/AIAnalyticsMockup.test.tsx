import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { AI_AVIATION_DRILLDOWN_DATA } from '@shared/ai-aviation-data';
import {
  AI_PERURI_DRILLDOWN_DATA,
  PERURI_PRODUCTION_TRENDS,
  PERURI_QUALITY_BENCHMARKS,
  PERURI_CCM_ALERTS,
} from '@shared/ai-peruri-data';
import reportsEn from '@/i18n/locales/en/reports.json';
import reportsId from '@/i18n/locales/id/reports.json';
import { AIDrilldownView } from '@/components/reports/ai-hub/AIDrilldownView';
import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('@/hooks/use-organization-branding', () => ({
  useOrganizationBranding: () => ({ companyName: 'PT Peruri' }),
}));

// Recharts ResponsiveContainer measures layout via ResizeObserver (absent in jsdom)
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      validateI18nKey(key);
      const subKey = key.replace(/^aiHub\./, '');
      const parts = subKey.split('.');
      let current: unknown = reportsEn.aiHub;
      for (const p of parts) {
        if (current && typeof current === 'object' && p in current) {
          current = (current as Record<string, unknown>)[p];
        } else {
          current = undefined;
          break;
        }
      }
      const raw = typeof current === 'string' ? current : (options?.defaultValue as string | undefined);
      if (raw && typeof raw === 'string') {
        let interpolated = raw;
        if (options) {
          for (const [k, v] of Object.entries(options)) {
            interpolated = interpolated.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          }
        }
        return interpolated;
      }
      return (options?.defaultValue as string | undefined) ?? key;
    },
  }),
}));

describe('AIAnalyticsMockup (PT Peruri Hybrid Operations)', () => {
  it('preserves legacy AirNav aviation drilldown data for backward compatibility and archival reference', () => {
    const ids = Object.keys(AI_AVIATION_DRILLDOWN_DATA).sort();
    expect(ids).toEqual(
      ['atc-roster', 'cns-maintenance', 'movement-leakage', 'route-charges-recon', 'track-anomaly', 'vendor-invoice-nlp'].sort()
    );
    for (const engine of Object.values(AI_AVIATION_DRILLDOWN_DATA)) {
      expect(engine.metrics.length).toBeGreaterThan(0);
      expect(engine.chart.title.length).toBeGreaterThan(0);
      expect(engine.chart.data.length).toBeGreaterThan(0);
      expect(engine.findings.length).toBeGreaterThan(0);
    }
  });

  it('exposes 6 Peruri hybrid ecosystem drilldown engines with complete metrics, charts, and inspection findings', () => {
    const ids = Object.keys(AI_PERURI_DRILLDOWN_DATA).sort();
    expect(ids).toEqual(
      [
        'banknote-vision-defect',
        'bi-order-delivery-recon',
        'excise-passport-leakage',
        'govtech-digital-sla',
        'raw-material-press-maintenance',
        'raw-material-procurement-nlp',
      ].sort()
    );

    const chartTypes = new Set(Object.values(AI_PERURI_DRILLDOWN_DATA).map((d) => d.chart.type));
    expect(chartTypes.has('scatter')).toBe(true);
    expect(chartTypes.has('radar')).toBe(true);
    expect(chartTypes.has('bar')).toBe(true);
    expect(chartTypes.has('line')).toBe(true);

    for (const engine of Object.values(AI_PERURI_DRILLDOWN_DATA)) {
      expect(engine.metrics.length).toBeGreaterThan(0);
      expect(engine.chart.title.length).toBeGreaterThan(0);
      expect(engine.chart.data.length).toBeGreaterThan(0);
      expect(engine.findings.length).toBeGreaterThan(0);
    }

    expect(PERURI_PRODUCTION_TRENDS.length).toBeGreaterThanOrEqual(6);
    expect(PERURI_QUALITY_BENCHMARKS.length).toBe(4);
    expect(PERURI_CCM_ALERTS.length).toBeGreaterThanOrEqual(5);
  });

  it('renders Peruri analytics tab with hybrid banknote, coin, and GovTech metrics without legacy aviation labels', () => {
    render(<AIAnalyticsMockup />);
    expect(screen.getByText('Digital Control Analytics Hub')).toBeTruthy();
    expect(screen.getByText('Banknote & Coin Production vs Delivery Billings')).toBeTruthy();
    expect(screen.getByText('Print Yield & Delivery Reconciliation')).toBeTruthy();
    expect(screen.getByText('0.24% Variance')).toBeTruthy();
    expect(screen.getByText('14 Batches')).toBeTruthy();
    expect(screen.getByText('Production Quality & Defect Tolerance')).toBeTruthy();
    expect(screen.getByText('Security Substrate & Ink Discrepancy')).toBeTruthy();
    expect(screen.getByText('Quality Inspection Rejection Spike')).toBeTruthy();
    expect(screen.getByText('Excise & Passport Numbering Anomaly')).toBeTruthy();

    // Verify absence of AirNav / maritime legacy labels
    expect(screen.queryByText(/AirNav/i)).toBeNull();
    expect(screen.queryByText(/Traffic Movements vs Route Charges/i)).toBeNull();
    expect(screen.queryByText(/FIR Handover/i)).toBeNull();
    expect(screen.queryByText(/CNS Maintenance/i)).toBeNull();
    expect(screen.queryByText(/GNSS Interference/i)).toBeNull();
    expect(screen.queryByText(/Bunker/i)).toBeNull();
    expect(screen.queryByText(/PELNI/i)).toBeNull();
  });

  it('lists all 6 Peruri AI use cases and allows interactive drilldown to workbench and discovery log for all cases', async () => {
    const user = userEvent.setup();
    render(<AIAnalyticsMockup />);

    await user.click(screen.getByRole('tab', { name: /AI Use Cases/ }));

    const expectedCases = [
      {
        title: 'Banknote Print Defect Vision Anomaly Detection',
        findingSample: 'BN-2026-100K-08',
      },
      {
        title: 'Security Substrate & Ink Variance Maintenance',
        findingSample: 'Intaglio Press KBA #03',
      },
      {
        title: 'Bank Indonesia Order & Delivery Reconciliation',
        findingSample: 'SPK-BI/2026/041',
      },
      {
        title: 'Excise Stamps & Passport Serialization Audit',
        findingSample: 'PC-HT-2026-SERI3',
      },
      {
        title: 'Security Material Vendor Contract NLP',
        findingSample: 'PO-RAW-2026-081',
      },
      {
        title: 'GovTech & Digital Trust SLA Monitoring',
        findingSample: 'e-Meterai Enterprise API',
      },
    ];

    for (const testCase of expectedCases) {
      const cardTitle = await screen.findByText(testCase.title);
      expect(cardTitle).toBeTruthy();

      await user.click(cardTitle);
      expect(await screen.findByText((_, el) => el?.textContent?.trim() === 'Peruri Analytical Workbench')).toBeTruthy();
      expect(await screen.findByText((_, el) => el?.textContent?.trim() === 'Quality & Operational Discovery Log')).toBeTruthy();
      expect(await screen.findByText(testCase.findingSample)).toBeTruthy();

      // Return back to cases grid
      const backBtn = screen.getByRole('button', { name: /Back to Cases/i });
      await user.click(backBtn);
      expect(await screen.findByText(testCase.title)).toBeTruthy();
    }
  });

  it('renders Peruri CCM continuous monitoring with high-security alerts and automated control coverage', async () => {
    const user = userEvent.setup();
    render(<AIAnalyticsMockup />);
    const byFullText = (text: string) => screen.getByText((_, el) => el?.textContent?.trim() === text);

    await user.click(screen.getByRole('tab', { name: /CCM Monitoring/ }));
    expect(byFullText('Continuous Control Monitoring (CCM)')).toBeTruthy();
    expect(screen.getByText(/Khazanah Bahan Baku: Dual-biometric vault access/)).toBeTruthy();
    expect(screen.getByText(/Security Thread Anomaly: Substrate spool lot mismatch/)).toBeTruthy();
    expect(screen.getByText(/Pita Cukai Serialization/)).toBeTruthy();
    expect(screen.getByText(/e-Meterai HSM Root Cert/)).toBeTruthy();
    expect(screen.getByText('Peruri Security Control Effectiveness')).toBeTruthy();
    expect(screen.getByText('+1.2% from prior cycle')).toBeTruthy();
    expect(screen.getByText('Automated Security & Digital Controls')).toBeTruthy();
    expect(screen.getByText('Manual Quality & Vault Protocols')).toBeTruthy();

    // Verify absence of aviation alerts
    expect(screen.queryByText(/GNSS Interference/i)).toBeNull();
    expect(screen.queryByText(/ILS Calibration/i)).toBeNull();
    expect(screen.queryByText(/Makassar FIR/i)).toBeNull();
  });

  it('renders graceful fallback when useCase is undefined or data is missing', () => {
    const onBack = vi.fn();
    const { rerender } = render(<AIDrilldownView useCase={undefined} onBack={onBack} />);
    expect(screen.getByRole('button', { name: /Back to Cases/i })).toBeTruthy();

    const dummyUseCase = {
      id: 'non-existent-case',
      title: 'Unknown Scenario',
      icon: <span />,
      desc: 'Description',
      status: 'LIVE' as const,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      precision: '99%',
    };
    rerender(<AIDrilldownView useCase={dummyUseCase} onBack={onBack} />);
    expect(screen.getByText(/Data for Unknown Scenario not available in Peruri Mockup/i)).toBeTruthy();
  });

  it('verifies 100% key parity between en and id reports locale bundles for aiHub', () => {
    function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getLeafKeys(v as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    }

    const enKeys = getLeafKeys(reportsEn.aiHub as Record<string, unknown>);
    const idKeys = getLeafKeys(reportsId.aiHub as Record<string, unknown>);

    expect(idKeys).toEqual(enKeys);
  });
});
