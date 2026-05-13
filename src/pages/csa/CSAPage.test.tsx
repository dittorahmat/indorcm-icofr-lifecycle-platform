import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CSAPage } from './CSAPage';
import React from 'react';

// Mock the components and hooks that depend on external context
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: { items: [] }, isLoading: false }),
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

vi.mock('lucide-react', () => ({
  History: () => <div />,
  Search: () => <div />,
  ShieldCheck: () => <div />,
  ChevronDown: () => <div />,
  ChevronRight: () => <div />,
  Printer: () => <div />,
  Download: () => <div />,
  FileText: () => <div />,
}));

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
});
