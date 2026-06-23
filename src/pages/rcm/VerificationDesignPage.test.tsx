import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerificationDesignPage } from './VerificationDesignPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import React from 'react';

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: {
        user: {
          role: 'Line 2',
        },
      },
    })),
  },
}));

// Mock api client
vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockResolvedValue({ items: [] }),
}));

// Create a wrapper with all necessary providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const routes = [
    {
      path: "/",
      element: (
        <UnsavedChangesProvider>
          <SidebarProvider>
            <VerificationDesignPage />
          </SidebarProvider>
        </UnsavedChangesProvider>
      ),
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ["/"],
  });
  
  return ({ children }: { children?: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('VerificationDesignPage Runtime Verification', () => {
  it('should render without crashing and show New Assessment button for Line 2', async () => {
    const Wrapper = createWrapper();
    const { container } = render(<Wrapper />);
    
    // Check if the page header (title) is rendered
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Verify New Assessment button is displayed
    const btn = container.querySelector('#btn-new-verification-assessment');
    expect(btn).toBeInTheDocument();
  });
});
