import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MainHeader } from '../MainHeader';
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

vi.mock('@/hooks/use-current-role', () => ({
  useCurrentRole: () => ({ role: 'Admin', isLoading: false }),
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" data-testid="sidebar-trigger" {...props} />
  ),
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
      expect(trigger.className).toContain('bg-white/80');
      expect(trigger.className).toContain('text-slate-950');
      expect(trigger.className).toContain('hover:bg-white');
      expect(trigger.className).toContain('border-white/90');
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
    it('uses high contrast slate text and translucent hover on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<LanguageSwitcher />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-slate-900');
      expect(button.className).toContain('hover:text-slate-950');
      expect(button.className).toContain('hover:bg-white/20');
      expect(button.className).not.toContain('text-white/70');
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
    it('applies calibrated text-slate-900 and translucent white hover on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<NotificationBell />, { wrapper: Wrapper });

      const button = screen.getByRole('button');
      expect(button.className).toContain('text-slate-900');
      expect(button.className).toContain('hover:text-slate-950');
      expect(button.className).toContain('hover:bg-white/20');
      expect(button.className).toContain('dark:hover:bg-slate-800');
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });

  describe('MainHeader Container & Accent Border', () => {
    it('locks authentic Manchester City blue patterned background on light theme', () => {
      mockUseTheme.mockReturnValue({ isDark: false });
      const Wrapper = createWrapper();
      render(<MainHeader />, { wrapper: Wrapper });

      const header = screen.getByRole('banner');
      expect(header.className).toContain('bg-mancity-pattern');
      expect(header.className).toContain('border-b-2');
      expect(header.className).toContain('border-b-sky-700/30');
      expect(header.className).toContain('text-slate-900');
    });

    it('locks symmetric 2px border and dark styling on dark theme', () => {
      mockUseTheme.mockReturnValue({ isDark: true });
      const Wrapper = createWrapper();
      render(<MainHeader />, { wrapper: Wrapper });

      const header = screen.getByRole('banner');
      expect(header.className).toContain('bg-slate-950');
      expect(header.className).toContain('border-b-2');
      expect(header.className).toContain('border-b-slate-800');
      expect(header.className).toContain('text-slate-50');
    });
  });
});
