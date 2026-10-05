import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CollapsibleFilterCard } from '../CollapsibleFilterCard';
import { useIsMobile } from '@/hooks/use-mobile';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'mobile.showFilters') return 'Show Filters';
      if (key === 'mobile.hideFilters') return 'Hide';
      return key;
    },
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(),
}));

function renderCard() {
  return render(
    <CollapsibleFilterCard title="Test Filters">
      <div>Filter body content</div>
    </CollapsibleFilterCard>
  );
}

describe('CollapsibleFilterCard', () => {
  it('starts collapsed on mobile and expands on toggle', () => {
    (useIsMobile as any).mockReturnValue(true);
    renderCard();

    expect(screen.getByTestId('collapsible-filter-card-expand')).toBeInTheDocument();
    expect(screen.queryByText('Filter body content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('collapsible-filter-card-expand'));
    expect(screen.getByTestId('collapsible-filter-card')).toBeInTheDocument();
    expect(screen.getByText('Filter body content')).toBeInTheDocument();
  });

  it('starts expanded on desktop and collapses on toggle', () => {
    (useIsMobile as any).mockReturnValue(false);
    renderCard();

    expect(screen.getByTestId('collapsible-filter-card')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('collapsible-filter-card-collapse'));
    expect(screen.getByTestId('collapsible-filter-card-expand')).toBeInTheDocument();
    expect(screen.queryByText('Filter body content')).not.toBeInTheDocument();
  });

  it('preserves explicit user toggle across viewport resizes', () => {    const mocked = useIsMobile as any;
    mocked.mockReturnValue(false);
    const { rerender } = render(
      <CollapsibleFilterCard title="Test Filters">
        <div>Filter body content</div>
      </CollapsibleFilterCard>
    );

    fireEvent.click(screen.getByTestId('collapsible-filter-card-collapse'));
    expect(screen.getByTestId('collapsible-filter-card-expand')).toBeInTheDocument();

    mocked.mockReturnValue(true);
    rerender(
      <CollapsibleFilterCard title="Test Filters">
        <div>Filter body content</div>
      </CollapsibleFilterCard>
    );

    expect(screen.getByTestId('collapsible-filter-card-expand')).toBeInTheDocument();
  });

  it('section layout renders children without extra card chrome', () => {
    (useIsMobile as any).mockReturnValue(false);
    render(
      <CollapsibleFilterCard title="Section Filters" layout="section" testId="section-filters">
        <div>Section body content</div>
      </CollapsibleFilterCard>
    );

    expect(screen.getByTestId('section-filters')).toBeInTheDocument();
    expect(screen.getByText('Section body content')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('section-filters-collapse'));
    expect(screen.getByTestId('section-filters-expand')).toBeInTheDocument();
  });
});
