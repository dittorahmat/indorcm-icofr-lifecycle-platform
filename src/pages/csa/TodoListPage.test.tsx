import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoListPage } from './TodoListPage';
import React from 'react';

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'csa-schedules') {
      return {
        data: {
          items: [
            {
              id: 'sched-1',
              bpmProcessId: 'proc-1',
              description: 'Evaluasi Kas & Bank',
              type: 'CSA',
              plannedDate: new Date().toISOString(),
              status: 'In Progress',
            },
          ],
        },
        isLoading: false,
      };
    }
    return { data: { items: [] }, isLoading: false };
  }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
  }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: { language: 'id' },
  }),
}));

vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: vi.fn(),
}));

describe('TodoListPage Responsive Views', () => {
  it('renders both desktop calendar grid container and mobile agenda view container', () => {
    const { container } = render(<TodoListPage />);
    
    // Desktop container with hidden md:flex
    const desktopGrid = container.querySelector('.hidden.md\\:flex');
    expect(desktopGrid).toBeInTheDocument();

    // Mobile container with md:hidden
    const mobileAgenda = container.querySelector('.md\\:hidden');
    expect(mobileAgenda).toBeInTheDocument();

    // Verify task title appears in mobile view
    expect(screen.getAllByText('Evaluasi Kas & Bank').length).toBeGreaterThan(0);
  });
});
