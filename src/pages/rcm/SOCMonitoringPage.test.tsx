import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { Application, SOCReport } from '@shared/types';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { definePageQueryMock, resetPageQueryStore } from '@/test/mock-page-queries';

// Mutable query backing store: per-test data without per-test mock plumbing.
const pageState = vi.hoisted(() => ({
  records: [] as Application[],
  processes: [] as SOCReport[],
}));

vi.mock('@tanstack/react-query', () =>
  definePageQueryMock(pageState, { recordsKey: 'applications', processesKey: 'soc-reports' }),
);

vi.mock('@/lib/api-client', () => ({ api: vi.fn() }));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/hooks/use-confirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }));

// Keep the render focused on the page composition; each dialog is tested with
// its own surface elsewhere.
vi.mock('@/components/rcm/AddApplicationDialog', () => ({ AddApplicationDialog: () => null }));
vi.mock('@/components/rcm/ApplicationDetailDialog', () => ({ ApplicationDetailDialog: () => null }));
vi.mock('@/components/audit/AddVendorDialog', () => ({ AddVendorDialog: () => null }));
vi.mock('@/components/audit/AddSOCReportDialog', () => ({ AddSOCReportDialog: () => null }));
vi.mock('@/components/audit/SOCReviewDialog', () => ({ SOCReviewDialog: () => null }));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

import { SOCMonitoringPage } from './SOCMonitoringPage';

const application: Application = {
  id: 'app-1',
  organizationId: 'org-1',
  name: 'SAP ERP',
  description: null,
  statusITGC: 'Effective',
  criticality: 'High',
  isSignificant: true,
  itgcAreas: ['Access to Program and Data'],
  businessOwners: ['Budi'],
  applicationOwners: ['Siti'],
  architectureDocUrl: null,
  architectureDocName: null,
  linkedControlCount: 4,
};

const socReport: SOCReport = {
  id: 'soc-1',
  organizationId: 'org-1',
  vendorId: 'ven-1',
  vendorName: 'AWS Cloud',
  reportType: 'SOC 1 Type 2',
  periodStart: Date.UTC(2026, 0, 1),
  periodEnd: Date.UTC(2026, 11, 31),
  fileUrl: null,
  status: 'Valid',
  createdAt: Date.UTC(2026, 0, 1),
};

function renderPage() {
  return render(
    <UnsavedChangesProvider>
      <SidebarProvider>
        <SOCMonitoringPage />
      </SidebarProvider>
    </UnsavedChangesProvider>,
  );
}

describe('SOCMonitoringPage dual render', () => {
  beforeEach(() => {
    resetPageQueryStore(pageState);
  });

  it('renders each application in BOTH the mobile card and the desktop row', () => {
    pageState.records = [application];
    renderPage();

    // Tailwind `hidden` does not hide anything in jsdom, so the name appears
    // twice (mobile card + desktop row); getAllByText locks both views.
    expect(screen.getAllByText('SAP ERP')).toHaveLength(2);
    expect(screen.getAllByText('Yes')).toHaveLength(2);
    expect(screen.getAllByText('Effective')).toHaveLength(2);

    const card = screen.getByTestId('application-card-app-1');
    const row = screen.getByTestId('application-row-app-1');

    // Scroll/sticky wrappers asserted via closest(), never parentElement, so a
    // responsive wrapper refactor cannot silently break the suite.
    expect(card.closest('.block.md\\:hidden')).not.toBeNull();
    expect(card.closest('.hidden.md\\:block')).toBeNull();
    // The desktop row lives inside the horizontal-scroll wrapper; the mobile
    // card must not (it must never need a page-level sideways scroll).
    expect(row.closest('.hidden.md\\:block')).not.toBeNull();
    expect(row.closest('.overflow-x-auto')).not.toBeNull();
    expect(card.closest('.overflow-x-auto')).toBeNull();
  });

  it('renders BOTH empty states when the inventory is empty', () => {
    renderPage();

    expect(
      screen.getAllByText('No applications found. Click "Add Application" to start.'),
    ).toHaveLength(2);
  });

  it('keeps the SOC evaluation badge desktop-only (the deliberate view difference)', () => {
    pageState.processes = [socReport];
    renderPage();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'SOC Monitoring' }));

    expect(screen.getAllByText('AWS Cloud')).toHaveLength(2);
    expect(screen.getAllByText('Valid')).toHaveLength(2);

    const card = screen.getByTestId('soc-card-soc-1');
    const row = screen.getByTestId('soc-row-soc-1');
    expect(card.closest('.block.md\\:hidden')).not.toBeNull();
    expect(row.closest('.overflow-x-auto')).not.toBeNull();

    // Evaluation lives in the desktop table only.
    expect(within(card).queryByText('Pending Review')).toBeNull();
    expect(within(row).getByText('Pending Review')).toBeInTheDocument();
  });

  it('tones the Valid SOC badge from the shared seam', () => {
    pageState.processes = [socReport];
    renderPage();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'SOC Monitoring' }));

    const row = screen.getByTestId('soc-row-soc-1');
    expect(within(row).getByText('Valid').className).toContain('bg-green-100');
    expect(within(row).getByText('Valid').className).toContain('text-green-700');
  });
});
