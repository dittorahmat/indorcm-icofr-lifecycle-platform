import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { AI_AVIATION_DRILLDOWN_DATA } from '@shared/ai-aviation-data';

vi.mock('@/hooks/use-organization-branding', () => ({
  useOrganizationBranding: () => ({ companyName: 'AirNav Indonesia' }),
}));

// Recharts ResponsiveContainer measures layout via ResizeObserver (absent in jsdom)
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'aiHub.badge': 'Continuous Monitoring',
        'aiHub.eyebrow': 'ICOFR Aviation Analytics',
        'aiHub.title': 'Digital Control Analytics Hub',
        'aiHub.subtitle': 'Continuous Control Monitoring for AirNav Indonesia.',
        'aiHub.systemStatus': 'System Status',
        'aiHub.online': 'ONLINE',
        'aiHub.dataFreshness': 'Data Freshness',
        'aiHub.realtime': 'Real-time Surveillance',
        'aiHub.tabAnalytics': 'Data Analytics',
        'aiHub.tabAiCases': 'AI Use Cases',
        'aiHub.tabCcm': 'CCM Monitoring',
        'aiHub.trendTitle': 'Traffic Movements vs Route Charges Billed',
        'aiHub.trendDesc': 'Controlled movements vs billed charges.',
        'aiHub.reconTitle': 'Billing Reconciliation Variance',
        'aiHub.reconDesc': 'Plan vs billed tolerance.',
        'aiHub.unreconciledTitle': 'Unreconciled Route Charges',
        'aiHub.unreconciledDesc': 'Plans vs invoices vs payments.',
        'aiHub.unreconciledNote': 'Pending verification for invoicing',
        'aiHub.otpTitle': 'FIR Handover On-Time Performance (OTP)',
        'aiHub.otpDesc': 'Handover punctuality by FIR sector.',
        'aiHub.riskTitle': 'Enterprise Risk Indicators (Air Navigation)',
        'aiHub.risk1Title': 'Unidentified Track Alert',
        'aiHub.risk1Value': '1 Track',
        'aiHub.risk1Desc': 'Held for identification in Makassar FIR',
        'aiHub.risk2Title': 'CNS Maintenance Overrun',
        'aiHub.risk2Value': '2 Stations',
        'aiHub.risk2Desc': 'RAB exceeded > 10% during overhaul',
        'aiHub.risk3Title': 'GNSS Interference Events',
        'aiHub.risk3Value': '4 Events',
        'aiHub.risk3Desc': 'RFI reports affecting en-route sectors',
        'aiHub.caseTrackTitle': 'Track Anomaly & Deviation Engine',
        'aiHub.caseTrackDesc': 'Flight plan deviation detection.',
        'aiHub.caseCnsTitle': 'Predictive CNS Maintenance',
        'aiHub.caseCnsDesc': 'ILS, radar, ADS-B maintenance evaluation.',
        'aiHub.caseReconTitle': 'Automated Route Charges Recon',
        'aiHub.caseReconDesc': 'Movements vs invoices reconciliation.',
        'aiHub.caseLeakageTitle': 'Movement & Slot Leakage Audit',
        'aiHub.caseLeakageDesc': 'Unbilled movement detection.',
        'aiHub.caseNlpTitle': 'Vendor Invoice & Contract NLP',
        'aiHub.caseNlpDesc': 'CNS vendor invoice audit.',
        'aiHub.caseRosterTitle': 'ATC Roster & License Validation',
        'aiHub.caseRosterDesc': 'Controller allowance validation.',
        'aiHub.modelPrecision': `Model Precision: ${options?.value ?? ''}`,
        'aiHub.details': 'Details',
        'aiHub.workbench': 'AirNav Analytical Workbench',
        'aiHub.clusterBadge': 'Air Navigation Cluster',
        'aiHub.discoveryLog': 'Aviation Discovery Log',
        'aiHub.liveAnalysis': 'Live Analysis',
        'aiHub.ccmTitle': 'Continuous Control Monitoring (CCM)',
        'aiHub.ccmDesc': 'Live monitoring of air navigation controls.',
        'aiHub.liveFeed': 'LIVE FEED',
        'aiHub.effectivenessTitle': 'Airspace Control Effectiveness',
        'aiHub.coverageTitle': 'Monitoring Coverage',
        'aiHub.automatedControls': 'Automated Air Navigation Controls',
        'aiHub.manualControls': 'Manual Operational Controls',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('AIAnalyticsMockup (AirNav aviation)', () => {
  it('aviation drilldown data exposes six AirNav engines with metrics, chart, and findings', () => {
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

  it('renders aviation analytics header without maritime labels', () => {
    render(<AIAnalyticsMockup />);
    expect(screen.getByText('Digital Control Analytics Hub')).toBeTruthy();
    expect(screen.getByText('Traffic Movements vs Route Charges Billed')).toBeTruthy();
    expect(screen.getByText('FIR Handover On-Time Performance (OTP)')).toBeTruthy();
    expect(screen.queryByText(/Bunker/i)).toBeNull();
    expect(screen.queryByText(/Maritime/i)).toBeNull();
    expect(screen.queryByText(/PELNI/i)).toBeNull();
    expect(screen.queryByText(/PSO/i)).toBeNull();
  });

  it('lists six aviation AI use cases and opens drilldown workbench on click', async () => {
    const user = userEvent.setup();
    render(<AIAnalyticsMockup />);
    const byFullText = (text: string) => screen.getByText((_, el) => el?.textContent?.trim() === text);
    await user.click(screen.getByRole('tab', { name: /AI Use Cases/ }));
    expect(byFullText('Track Anomaly & Deviation Engine')).toBeTruthy();
    expect(byFullText('Predictive CNS Maintenance')).toBeTruthy();
    expect(byFullText('Automated Route Charges Recon')).toBeTruthy();
    expect(byFullText('ATC Roster & License Validation')).toBeTruthy();
    await user.click(byFullText('Track Anomaly & Deviation Engine'));
    expect(await screen.findByText((_, el) => el?.textContent?.trim() === 'AirNav Analytical Workbench')).toBeTruthy();
    expect(await screen.findByText((_, el) => el?.textContent?.trim() === 'Aviation Discovery Log')).toBeTruthy();
  });

  it('renders aviation CCM alerts without maritime content', async () => {
    const user = userEvent.setup();
    render(<AIAnalyticsMockup />);
    const byFullText = (text: string) => screen.getByText((_, el) => el?.textContent?.trim() === text);
    await user.click(screen.getByRole('tab', { name: /CCM Monitoring/ }));
    expect(byFullText('Continuous Control Monitoring (CCM)')).toBeTruthy();
    expect(screen.getByText(/GNSS Interference/)).toBeTruthy();
    expect(screen.queryByText(/Bunker/i)).toBeNull();
    expect(screen.queryByText(/KM Kelud/i)).toBeNull();
  });
});

