import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TLCTabContent } from '../TLCTabContent';
import { Control } from '@shared/types';
import { MemoryRouter } from 'react-router-dom';

const mockControls: Control[] = Array.from({ length: 25 }, (_, i) => ({
  id: `ctrl-${i + 1}`,
  code: `TLC-${String(i + 1).padStart(3, '0')}`,
  name: `Control Name ${i + 1}`,
  description: `Description for control ${i + 1}`,
  level: 'TLC',
  nature: 'Preventive',
  riskRating: 'Medium',
  type: 'Manual',
  frequency: 'Monthly',
  classification: 'Key',
  financialStatementAssertions: ['Existence'],
  status: 'Draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
}));

describe('TLCTabContent with DataTablePagination', () => {
  it('renders only the active page items (default 10) and shows pager', () => {
    render(
      <MemoryRouter>
        <TLCTabContent
          filteredTlc={mockControls}
          controlsLoading={false}
          searchTerm=""
          onSearchChange={vi.fn()}
          onEditControl={vi.fn()}
        />
      </MemoryRouter>
    );

    // Both desktop table and mobile card feed are rendered in jsdom
    expect(screen.getAllByText('TLC-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TLC-010').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('TLC-011')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Menampilkan 1-10 dari 25 data/i).length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to next page on click', () => {
    render(
      <MemoryRouter>
        <TLCTabContent
          filteredTlc={mockControls}
          controlsLoading={false}
          searchTerm=""
          onSearchChange={vi.fn()}
          onEditControl={vi.fn()}
        />
      </MemoryRouter>
    );

    const nextButtons = screen.getAllByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextButtons[0]);

    expect(screen.getAllByText('TLC-011').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('TLC-001')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Menampilkan 11-20 dari 25 data/i).length).toBeGreaterThanOrEqual(1);
  });

  it('resets page to 1 when search term changes', () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <TLCTabContent
          filteredTlc={mockControls}
          controlsLoading={false}
          searchTerm=""
          onSearchChange={onSearchChange}
          onEditControl={vi.fn()}
        />
      </MemoryRouter>
    );

    const nextButtons = screen.getAllByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextButtons[0]);
    expect(screen.getAllByText(/Menampilkan 11-20 dari 25 data/i).length).toBeGreaterThanOrEqual(1);

    const searchInput = screen.getByPlaceholderText(/matrix.subtitle_tlc/i);
    fireEvent.change(searchInput, { target: { value: 'TLC' } });
    expect(onSearchChange).toHaveBeenCalledWith('TLC');

    rerender(
      <MemoryRouter>
        <TLCTabContent
          filteredTlc={mockControls.slice(0, 5)}
          controlsLoading={false}
          searchTerm="TLC"
          onSearchChange={onSearchChange}
          onEditControl={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Menampilkan 1-5 dari 5 data/i).length).toBeGreaterThanOrEqual(1);
  });
});
