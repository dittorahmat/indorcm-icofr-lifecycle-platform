import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FiscalYearSelector } from '../FiscalYearSelector';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { NotificationBell } from '../NotificationBell';

const mockUseTheme = vi.fn();
let mockWorkingYear: string | undefined = '2026';

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock('@/context/UnsavedChangesContext', () => ({
  useUnsavedChangesContext: () => ({ isDirty: false }),
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('@/store/useFiscalYearStore', () => ({
  useFiscalYearStore: () => ({
    workingYear: mockWorkingYear,
    setWorkingYear: vi.fn(),
    customYears: [],
    addCustomYear: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === '/api/settings') return Promise.resolve({ customYears: [] });
    if (url === '/api/notifications') return Promise.resolve([]);
    if (url === '/api/notifications/unread-count') return Promise.resolve({ count: 0 });
    return Promise.resolve({});
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('MainHeader components contrast calibration (#157)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkingYear = '2026';
  });

  describe('FiscalYearSelector', () => {
    it('applies calibrated institutional contrast classes on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<FiscalYearSelector />, { wrapper: Wrapper });

      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('bg-surface-container/70');
      expect(trigger.className).toContain('text-foreground');
      expect(trigger.className).toContain('hover:bg-surface-container');
      expect(trigger.className).toContain('border-border/80');
      expect(trigger.className).not.toContain('bg-white/10');
      expect(trigger.className).not.toContain('text-white');
    });

    it('applies dark theme styling when dark mode is enabled', () => {
      mockUseTheme.mockReturnValue({ isDark: true });
      const Wrapper = createWrapper();
      render(<FiscalYearSelector />, { wrapper: Wrapper });

      const trigger = screen.getByRole('combobox');
      expect(trigger.className).toContain('bg-slate-800');
      expect(trigger.className).toContain('text-slate-100');
      expect(trigger.className).toContain('border-slate-700');
    });

    it('safely renders mobile FY badge when workingYear is present vs fallback', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      const { unmount } = render(<FiscalYearSelector />, { wrapper: Wrapper });

      // When workingYear is '2026', mobile span renders 'FY 26'
      expect(screen.getByText('FY 26')).toBeInTheDocument();
      unmount();

      // When workingYear is undefined/empty, mobile span safely falls back to 'FY'
      mockWorkingYear = undefined;
      render(<FiscalYearSelector />, { wrapper: Wrapper });
      expect(screen.getByText('FY')).toBeInTheDocument();
      expect(screen.queryByText(/FY undefined/i)).not.toBeInTheDocument();
    });
  });

  describe('LanguageSwitcher', () => {
    it('uses text-muted-foreground and surface-container hover on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<LanguageSwitcher />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-muted-foreground');
      expect(button.className).toContain('hover:text-foreground');
      expect(button.className).toContain('hover:bg-surface-container');
      expect(button.className).not.toContain('text-white/70');
      expect(button.className).not.toContain('hover:bg-white/10');
    });

    it('uses slate contrast on dark theme', () => {
      mockUseTheme.mockReturnValue({ isDark: true });
      const Wrapper = createWrapper();
      render(<LanguageSwitcher />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-slate-300');
      expect(button.className).toContain('hover:text-white');
      expect(button.className).toContain('hover:bg-slate-800');
    });
  });

  describe('NotificationBell', () => {
    it('applies calibrated text-muted-foreground and surface-container hover on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<NotificationBell />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-muted-foreground');
      expect(button.className).toContain('hover:text-foreground');
      expect(button.className).toContain('hover:bg-surface-container');
      expect(button.className).toContain('dark:hover:bg-slate-800');
      expect(button.className).not.toContain('hover:bg-white/10');
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });
});
