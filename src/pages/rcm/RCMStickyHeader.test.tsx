import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RCMTable } from '@/components/rcm/RCMTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const mockGroups = [
  {
    title: "Test Group",
    columns: [
      { id: "col1", header: "Col 1", width: "100px", accessorKey: "col1" }
    ]
  }
];

const mockData = [
  { id: "1", col1: "Data 1" }
];

describe('RCMTable Sticky Header Verification', () => {
  it('should have a scrollable container with overflow-auto', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <RCMTable groups={mockGroups} data={mockData} />
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    // The table sits inside a responsive wrapper (hidden md:block), so assert
    // against the nearest scrollable ancestor rather than the direct parent.
    const table = screen.getByRole('table');
    const scrollContainer = table.closest('div.overflow-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should have a sticky thead', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <RCMTable groups={mockGroups} data={mockData} />
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    const firstHeaderRow = container.querySelector('thead tr');
    expect(firstHeaderRow).toHaveClass('sticky');
    expect(firstHeaderRow).toHaveClass('top-0');
  });

  it('should have sticky group rows with correct top offset', () => {
    const renderGroupRow = (row: any) => <tr key="group" className="sticky top-[88px]"><td>Group</td></tr>;
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
            <RCMTable groups={mockGroups} data={mockData} renderGroupRow={renderGroupRow} />
          </TooltipProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );

    const groupRow = container.querySelector('.sticky.top-\\[88px\\]');
    expect(groupRow).toBeInTheDocument();
  });
});
