import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DoDTable } from '../DoDTable';
import type { FormattedDoDRow } from '../dod-types';
import { makeMockDoDRow } from '@/test/mock-factories';

const mockRows: FormattedDoDRow[] = Array.from({ length: 25 }, (_, i) => makeMockDoDRow({}, i + 1));

describe('DoDTable with DataTablePagination', () => {
  it('renders rows with pagination controls and slices to 10 items by default', () => {
    render(<DoDTable rows={mockRows} showFullTable={true} />);

    expect(screen.getByTestId('dod-table-pagination')).toBeInTheDocument();
    expect(screen.getByText('DEF-1')).toBeInTheDocument();
    expect(screen.getByText('DEF-10')).toBeInTheDocument();
    expect(screen.queryByText('DEF-11')).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan 1-10 dari 25 data/i)).toBeInTheDocument();
  });

  it('navigates to next page on clicking next button', () => {
    render(<DoDTable rows={mockRows} showFullTable={true} />);

    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('DEF-11')).toBeInTheDocument();
    expect(screen.queryByText('DEF-1')).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan 11-20 dari 25 data/i)).toBeInTheDocument();
  });

  it('resets page to 1 when rows dataset changes', () => {
    const { rerender } = render(<DoDTable rows={mockRows} showFullTable={true} />);

    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Menampilkan 11-20 dari 25 data/i)).toBeInTheDocument();

    // Rerender with filtered/smaller dataset
    rerender(<DoDTable rows={mockRows.slice(0, 5)} showFullTable={true} />);
    expect(screen.getByText(/Menampilkan 1-5 dari 5 data/i)).toBeInTheDocument();
  });
});
