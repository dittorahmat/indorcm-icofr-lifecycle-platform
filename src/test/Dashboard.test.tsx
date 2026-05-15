import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Dashboard } from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock API client
vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockResolvedValue({ items: [] }),
}));

// Mock AppLayout (to simplify the test)
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

// Mock Lucide icons to avoid rendering complexity
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Dashboard Component', () => {
  it('renders dashboard with primary sections', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify Title (from PageHeader)
    expect(screen.getByText('title')).toBeInTheDocument();

    // Verify Action Center
    expect(screen.getByText('actionCenter.title')).toBeInTheDocument();

    // Verify KPI section
    expect(screen.getByText('kpis.ready')).toBeInTheDocument();
    expect(screen.getByText('kpis.cycleReadiness')).toBeInTheDocument();
  });
});
