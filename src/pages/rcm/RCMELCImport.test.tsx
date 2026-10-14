import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { strictT } from '@/test/mock-i18n';
import {
  definePageQueryMock,
  resetPageQueryStore,
  type PageQueryBackingStore,
} from '@/test/mock-page-queries';
import { RCMELCPage } from './RCMELCPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

const pageState: PageQueryBackingStore = vi.hoisted(() => ({
  records: [],
  processes: [],
}));

vi.mock('@tanstack/react-query', () =>
  definePageQueryMock(pageState, {
    recordsKey: 'controls-elc',
    processesKey: 'organizations-list',
  }),
);

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <UnsavedChangesProvider>
            <SidebarProvider>
              <RCMELCPage />
            </SidebarProvider>
          </UnsavedChangesProvider>
        ),
      },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('RCMELCPage import entry point', () => {
  beforeEach(() => {
    resetPageQueryStore(pageState);
  });

  it('renders an Import RCM button in the header', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /import rcm/i }),
    ).toBeInTheDocument();
  });

  it('opens the shared wizard with the ELC flavor preselected', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /import rcm/i }));
    expect(
      await screen.findByRole('radio', { name: /entity level/i }),
    ).toBeChecked();
  });
});
