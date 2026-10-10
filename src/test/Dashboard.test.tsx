import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Dashboard } from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Mock translations to serialize params for verification
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key}:${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

// Mock API client
vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

// Mock AppLayout
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock PageHeader
vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, children }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    CheckCircle: () => <span>CheckCircle</span>,
    AlertTriangle: () => <span>AlertTriangle</span>,
    Clock: () => <span>Clock</span>,
    ShieldCheck: () => <span>ShieldCheck</span>,
    Zap: () => <span>Zap</span>,
    ClipboardCheck: () => <span>ClipboardCheck</span>,
    FileText: () => <span>FileText</span>,
    LayoutDashboard: () => <span>LayoutDashboard</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    Target: () => <span>Target</span>,
    ShieldAlert: () => <span>ShieldAlert</span>,
    TrendingUp: () => <span>TrendingUp</span>,
    Activity: () => <span>Activity</span>,
    ArrowUpRight: () => <span>ArrowUpRight</span>,
  };
});

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Dashboard Component', () => {
  it('renders dashboard with primary sections', async () => {
    vi.mocked(api).mockResolvedValue({ items: [] });
    
    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('actionCenter.title')).toBeInTheDocument();
    expect(screen.getByText('kpis.ready')).toBeInTheDocument();
  });

  // Flaky under full-suite load (Render + React Query settle >5s when CPU-starved);
  // generous timeout keeps the suite deterministic. Solo runs finish in ~1s.
  it('calculates metrics dynamically based on controls and deficiencies data', { timeout: 20000 }, async () => {
    const mockControls = {
      items: [
        { id: '1', year: 2026, lastCsaDate: 12345, line2Validation: { status: 'Validated' } }, 
        { id: '2', year: 2026, lastCsaDate: null, line2Validation: { status: 'Pending' } },   
        { id: '3', year: 2026, lastCsaDate: null, line2Validation: { status: 'Rejected' } },  
        { id: '4', year: 2026, lastCsaDate: null, line2Validation: { status: 'Pending' } },   
      ]
    };

    const mockDeficiencies = {
      items: [
        { id: 'd1', severity: 'High', status: 'Remediated', identifiedDate: new Date('2026-01-01').getTime() },
        { id: 'd2', severity: 'Low', status: 'Open', identifiedDate: new Date('2026-01-02').getTime() }
      ]
    };

    const mockActionPlans = {
      items: [
        { id: 'ap1', deficiencyId: 'd1', actualCompletionDate: new Date('2026-01-11').getTime() }
      ]
    };

    vi.mocked(api).mockImplementation((url: string) => {
      if (url.includes('/api/controls')) return Promise.resolve(mockControls);
      if (url.includes('/api/deficiencies')) return Promise.resolve(mockDeficiencies);
      if (url.includes('/api/actionplans')) return Promise.resolve(mockActionPlans);
      return Promise.resolve({ items: [] });
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Wait for the component to render with loaded data
    await waitFor(() => {
      // 1 of 3 completed is Validated -> 33.3%
      expect(screen.getByText(/kpis.line2Percent:{"percent":33.3}/)).toBeInTheDocument();
      // Remediation velocity -> 10 days (2026-01-11 to 2026-01-01)
      expect(screen.getByText(/kpis.remediationAvgDays:{"days":10}/)).toBeInTheDocument();
    });
  });
});
