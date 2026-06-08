import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RCMELCPage } from './RCMELCPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import React from 'react';

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
            <RCMELCPage />
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

describe('RCMELCPage Runtime Verification', () => {
  it('should render without crashing when wrapped in proper providers', async () => {
    const Wrapper = createWrapper();
    render(<Wrapper />);
    
    // Check if the page header (title) is rendered
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display the loading state initially', () => {
    const Wrapper = createWrapper();
    render(<Wrapper />);
    expect(screen.getByText(/loading matrix data/i)).toBeInTheDocument();
  });
});
