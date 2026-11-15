import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ApprovalPage } from '@/pages/scoping/ApprovalPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('ApprovalPage Table Column Sizing and Sticky Context (#169, #170)', () => {
  it('renders table headers with deterministic column widths and sticky attributes', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <ApprovalPage />
          </BrowserRouter>
        </I18nextProvider>
      </QueryClientProvider>
    );

    const thead = container.querySelector('thead');
    expect(thead).toBeDefined();
    expect(thead?.className).toContain('sticky');
    expect(thead?.className).toContain('top-0');

    const firstTh = container.querySelector('thead th');
    expect(firstTh).toHaveClass('sticky');
    expect(firstTh).toHaveClass('left-0');
    expect(firstTh).toHaveClass('min-w-[180px]');
  });
});
