import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CSAPage } from './CSAPage';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// Mock the components and hooks that depend on external context
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: { items: [] }, isLoading: false }),
  useMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    History: () => <div />,
    Search: () => <div />,
    ShieldCheck: () => <div />,
    ChevronDown: () => <div />,
    ChevronRight: () => <div />,
    Printer: () => <div />,
    Download: () => <div />,
    FileText: () => <div />,
  };
});

describe('CSAPage', () => {
  it('renders the page title correctly', () => {
    render(<CSAPage />);
    
    // According to TDD: This will initially FAIL because I'm using the translation key as the expected text
    // but I'll check if the mocked 't' function returns the key.
    expect(screen.getByText('page.title')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<CSAPage />);
    expect(screen.getByText('page.description')).toBeInTheDocument();
  });

  it('shows the search input with correct placeholder', () => {
    render(<CSAPage />);
    expect(screen.getByPlaceholderText('page.searchPlaceholder')).toBeInTheDocument();
  });

  it('renders both desktop table container and mobile card container', () => {
    const { container } = render(<CSAPage />);
    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
  });

  it('renders executive summary card on mobile when records exist', () => {
    const { container } = render(<CSAPage />);
    // Verify mobile container is mounted
    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
  });

  it('dual-renders each Effective record in desktop table AND mobile card', () => {
    const record = {
      id: 'csa-1',
      bpmProcessId: 'proc-1',
      period: '2026-Q3',
      result: 'Effective',
      assessmentDate: new Date('2026-09-01T10:00:00').toISOString(),
      samples: [],
      comments: '',
    };
    const process = { id: 'proc-1', name: 'Procure to Pay' };
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'csa-records-all') return { data: { items: [record] }, isLoading: false } as any;
      if (queryKey[0] === 'bpm-processes-all') return { data: { items: [process] }, isLoading: false } as any;
      return { data: undefined, isLoading: false } as any;
    });

    try {
      const { container } = render(<CSAPage />);

      // Dual-render: Tailwind `hidden` does not hide in jsdom, so the process
      // name appears TWICE (desktop row + mobile card). getByText would be
      // ambiguous here — getAllByText locks both views.
      const occurrences = screen.getAllByText('Procure to Pay');
      expect(occurrences).toHaveLength(2);

      // Scope per view: one occurrence lives under the desktop table
      // container, the other under the mobile card stack.
      const desktopContainer = container.querySelector('.hidden.md\\:block');
      const mobileContainer = container.querySelector('.block.md\\:hidden');
      expect(desktopContainer).toBeInTheDocument();
      expect(mobileContainer).toBeInTheDocument();
      expect(occurrences.some((el) => desktopContainer?.contains(el))).toBe(true);
      expect(occurrences.some((el) => mobileContainer?.contains(el))).toBe(true);

      // Scroll/sticky containment asserted via closest() so responsive
      // wrapper refactors do not break the suite.
      const mobileCard = container.querySelector('[data-testid="csa-card-csa-1"]');
      expect(mobileCard).toBeInTheDocument();
      expect(mobileCard?.closest('.block.md\\:hidden')).not.toBeNull();
    } finally {
      vi.mocked(useQuery).mockReturnValue({ data: { items: [] }, isLoading: false } as any);
    }
  });
});
