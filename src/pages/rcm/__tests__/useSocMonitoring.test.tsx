import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Application, SOCReport, Vendor } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { strictT } from '@/test/mock-i18n';

vi.mock('@/lib/api-client', () => ({ api: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: strictT }) }));

import { useSocMonitoring } from '../useSocMonitoring';

const apiMock = vi.mocked(api);

const application: Application = {
  id: 'app-1',
  organizationId: 'org-1',
  name: 'SAP ERP',
  description: null,
  statusITGC: 'Effective',
  criticality: 'High',
  isSignificant: true,
  itgcAreas: [],
  businessOwners: [],
  applicationOwners: [],
  architectureDocUrl: null,
  architectureDocName: null,
  linkedControlCount: 1,
};

const report: SOCReport = {
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

const vendor: Vendor = {
  id: 'ven-1',
  organizationId: 'org-1',
  name: 'AWS',
  serviceType: null,
  contactPerson: null,
  createdAt: new Date(0),
};

let deleteFails = false;

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { invalidateSpy, wrapper };
}

describe('useSocMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteFails = false;
    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/applications') return Promise.resolve({ items: [application] });
      if (path === '/api/soc-reports') return Promise.resolve({ items: [report] });
      if (path === '/api/vendors') return Promise.resolve({ items: [vendor] });
      if (path === '/api/applications/app-1' && init?.method === 'DELETE') {
        return deleteFails ? Promise.reject(new Error('server exploded')) : Promise.resolve({});
      }
      return Promise.reject(new Error(`unexpected ${path}`));
    });
  });

  it('exposes the three collections from their owned query keys', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useSocMonitoring(), { wrapper });

    await waitFor(() => expect(result.current.applications).toHaveLength(1));
    expect(result.current.socReports).toHaveLength(1);
    expect(result.current.vendors).toHaveLength(1);
    expect(apiMock).toHaveBeenCalledWith('/api/applications');
    expect(apiMock).toHaveBeenCalledWith('/api/soc-reports');
    expect(apiMock).toHaveBeenCalledWith('/api/vendors');
  });

  it('invalidates the applications key and toasts success after a DELETE', async () => {
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useSocMonitoring(), { wrapper });
    await waitFor(() => expect(result.current.applications).toHaveLength(1));

    await act(async () => {
      result.current.removeApplication('app-1');
    });

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith('Application removed from library');
    expect(apiMock).toHaveBeenCalledWith('/api/applications/app-1', { method: 'DELETE' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['applications'] });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('surfaces a failed DELETE to the user and leaves the cache untouched', async () => {
    deleteFails = true;
    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useSocMonitoring(), { wrapper });
    await waitFor(() => expect(result.current.applications).toHaveLength(1));

    await act(async () => {
      result.current.removeApplication('app-1');
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith('Could not remove the application. Please try again.', {
      description: 'server exploded',
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['applications'] });
  });
});
